from pathlib import Path
import sys

V5 = "VSR_BLOCK_OFFLOAD_V5"
V51 = "VSR_BLOCK_OFFLOAD_V51_CLIP_GPU"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: echomimicv3-block-offload-v51.py <pipeline.py>")

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    if V51 in text:
        print("[EchoMimicV3] Block-offload V5.1 CLIP GPU phase already present.")
        return
    if V5 not in text:
        raise RuntimeError("Block-offload V5.1 requires recognized V5 pipeline runtime")

    old_clip_phase = '''        if vsr_selective_gpu_v4:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=vae_encode -> cpu")
            clip_device = torch.device("cpu")
            print("VSR_SELECTIVE_GPU_V4: clip_image_encoder stays on CPU")
        else:
            clip_device = device
'''
    new_clip_phase = '''        if vsr_selective_gpu_v4:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=vae_encode -> cpu")
            if vsr_block_offload_v5:
                clip_device = device
                self.clip_image_encoder.to(device)
                print("VSR_BLOCK_OFFLOAD_V51_CLIP_GPU: clip_image_encoder -> cuda")
            else:
                clip_device = torch.device("cpu")
                print("VSR_SELECTIVE_GPU_V4: clip_image_encoder stays on CPU")
        else:
            clip_device = device
'''
    text = replace_once(text, old_clip_phase, new_clip_phase, "V5 CLIP phase")

    old_transformer_phase = '''        gpu_manager = None
        if vsr_selective_gpu_v4:
            if torch.is_tensor(clip_context):
'''
    new_transformer_phase = '''        gpu_manager = None
        if vsr_selective_gpu_v4:
            if vsr_block_offload_v5:
                self.clip_image_encoder.to("cpu")
                torch.cuda.empty_cache()
                print("VSR_BLOCK_OFFLOAD_V51_CLIP_GPU: clip_image_encoder -> cpu")
            if torch.is_tensor(clip_context):
'''
    text = replace_once(text, old_transformer_phase, new_transformer_phase, "V5 transformer phase boundary")

    if text.count(V51) != 2:
        raise RuntimeError(f"Expected exactly two V5.1 CLIP markers; found {text.count(V51)}")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied block-offload V5.1 CLIP GPU phase.")


if __name__ == "__main__":
    main()
