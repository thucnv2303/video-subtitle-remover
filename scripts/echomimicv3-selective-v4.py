from pathlib import Path
import sys

OLD_MARKER = "VSR_SELECTIVE_GPU_V3"
NEW_MARKER = "VSR_SELECTIVE_GPU_V4"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def replace_exact_count(text: str, old: str, new: str, expected: int, label: str) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"Expected exactly {expected} {label}; found {count}")
    return text.replace(old, new, expected)


def transform_infer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if NEW_MARKER in text:
        print("[EchoMimicV3] Selective GPU V4 infer transform already present.")
        return
    if OLD_MARKER not in text:
        raise RuntimeError("Selective GPU V4 requires recognized V3 infer runtime")

    old = '''    elif GPU_memory_mode == "selective_gpu_v3":
        print("VSR_SELECTIVE_GPU_V3: phase-based selective GPU residency enabled.")
        pipeline._vsr_selective_gpu_v3 = True
        pipeline._vsr_execution_device = device
'''
    new = '''    elif GPU_memory_mode == "selective_gpu_v4":
        print("VSR_SELECTIVE_GPU_V4: CPU T5/CLIP + selective CUDA VAE/transformer enabled.")
        pipeline._vsr_selective_gpu_v4 = True
        pipeline._vsr_execution_device = device
'''
    text = replace_once(text, old, new, "V3 infer selective branch")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied selective GPU V4 infer transform.")


def transform_pipeline(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if NEW_MARKER in text:
        print("[EchoMimicV3] Selective GPU V4 pipeline transform already present.")
        return
    if OLD_MARKER not in text:
        raise RuntimeError("Selective GPU V4 requires recognized V3 pipeline runtime")

    old_device = '''        device = self._execution_device
        weight_dtype = self.text_encoder.dtype
        vsr_selective_gpu_v3 = getattr(self, "_vsr_selective_gpu_v3", False)
        if vsr_selective_gpu_v3:
            device = getattr(self, "_vsr_execution_device", device)
            print("VSR_SELECTIVE_GPU_V3: phase=text_encoder -> cuda")
            self.text_encoder.to(device)

        do_classifier_free_guidance = guidance_scale > 1.0
'''
    new_device = '''        device = self._execution_device
        weight_dtype = self.text_encoder.dtype
        vsr_selective_gpu_v4 = getattr(self, "_vsr_selective_gpu_v4", False)
        if vsr_selective_gpu_v4:
            device = getattr(self, "_vsr_execution_device", device)
            prompt_device = torch.device("cpu")
            print("VSR_SELECTIVE_GPU_V4: text_encoder stays on CPU")
        else:
            prompt_device = device

        do_classifier_free_guidance = guidance_scale > 1.0
'''
    text = replace_once(text, old_device, new_device, "V3 pipeline device block")

    text = replace_once(text, "            device=device,\n        )", "            device=prompt_device,\n        )", "encode_prompt device argument")
    old_post_prompt = '''        if vsr_selective_gpu_v3:
            self.text_encoder.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=text_encoder -> cpu")
'''
    new_post_prompt = '''        if vsr_selective_gpu_v4:
            prompt_embeds = [u.to(device=device, dtype=weight_dtype) for u in prompt_embeds]
            if negative_prompt_embeds is not None:
                negative_prompt_embeds = [u.to(device=device, dtype=weight_dtype) for u in negative_prompt_embeds]
            print("VSR_SELECTIVE_GPU_V4: prompt embeddings CPU -> CUDA")
'''
    text = replace_once(text, old_post_prompt, new_post_prompt, "V3 post-prompt phase")

    old_mask = '''        if vsr_selective_gpu_v3:
            print("VSR_SELECTIVE_GPU_V3: phase=vae_encode -> cuda")
            self.vae.to(device)
'''
    new_mask = '''        if vsr_selective_gpu_v4:
            print("VSR_SELECTIVE_GPU_V4: phase=vae_encode -> cuda")
            self.vae.to(device)
'''
    text = replace_once(text, old_mask, new_mask, "V3 VAE encode start")

    old_clip_start = '''        if vsr_selective_gpu_v3:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=vae_encode -> cpu")
            print("VSR_SELECTIVE_GPU_V3: phase=clip -> cuda")
            self.clip_image_encoder.to(device)
'''
    new_clip_start = '''        if vsr_selective_gpu_v4:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=vae_encode -> cpu")
            clip_device = torch.device("cpu")
            print("VSR_SELECTIVE_GPU_V4: clip_image_encoder stays on CPU")
        else:
            clip_device = device
'''
    text = replace_once(text, old_clip_start, new_clip_start, "V3 CLIP phase start")

    old_clip_input = '            clip_image = TF.to_tensor(clip_image).sub_(0.5).div_(0.5).to(device, weight_dtype) \n'
    new_clip_input = '            clip_image = TF.to_tensor(clip_image).sub_(0.5).div_(0.5).to(clip_device, weight_dtype) \n'
    text = replace_exact_count(text, old_clip_input, new_clip_input, 2, "CLIP input placements")

    old_denoise = '''        if vsr_selective_gpu_v3:
            self.clip_image_encoder.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=clip -> cpu")
            print("VSR_SELECTIVE_GPU_V3: phase=transformer -> cuda (resident for denoise loop)")
            self.transformer.to(device)
'''
    new_denoise = '''        if vsr_selective_gpu_v4:
            if torch.is_tensor(clip_context):
                clip_context = clip_context.to(device=device, dtype=weight_dtype)
            elif isinstance(clip_context, (list, tuple)):
                clip_context = [u.to(device=device, dtype=weight_dtype) for u in clip_context]
            print("VSR_SELECTIVE_GPU_V4: CLIP context CPU -> CUDA")
            print("VSR_SELECTIVE_GPU_V4: phase=transformer -> cuda (resident for denoise loop)")
            self.transformer.to(device)
'''
    text = replace_once(text, old_denoise, new_denoise, "V3 transformer phase start")

    old_decode = '''        if vsr_selective_gpu_v3:
            self.transformer.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=transformer -> cpu")
            print("VSR_SELECTIVE_GPU_V3: phase=vae_decode -> cuda")
            self.vae.to(device)
'''
    new_decode = '''        if vsr_selective_gpu_v4:
            self.transformer.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=transformer -> cpu")
            print("VSR_SELECTIVE_GPU_V4: phase=vae_decode -> cuda")
            self.vae.to(device)
'''
    text = replace_once(text, old_decode, new_decode, "V3 decode phase start")

    old_free = '''        if vsr_selective_gpu_v3:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=vae_decode -> cpu")
'''
    new_free = '''        if vsr_selective_gpu_v4:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=vae_decode -> cpu")
'''
    text = replace_once(text, old_free, new_free, "V3 post-decode phase")

    if OLD_MARKER in text:
        raise RuntimeError("V3 marker remains after V4 pipeline transform")
    if text.count(NEW_MARKER) < 8:
        raise RuntimeError("Selective GPU V4 markers missing after transform")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied selective GPU V4 pipeline transform.")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: echomimicv3-selective-v4.py <infer_flash.py> <pipeline.py>")
    transform_infer(Path(sys.argv[1]))
    transform_pipeline(Path(sys.argv[2]))


if __name__ == "__main__":
    main()
