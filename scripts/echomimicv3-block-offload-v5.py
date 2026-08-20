from pathlib import Path
import sys

V4 = "VSR_SELECTIVE_GPU_V4"
V5 = "VSR_BLOCK_OFFLOAD_V5"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def transform_infer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if V5 in text:
        print("[EchoMimicV3] Block-offload V5 infer transform already present.")
        return
    if V4 not in text:
        raise RuntimeError("Block-offload V5 requires recognized selective V4 infer runtime")

    anchor = '''    elif GPU_memory_mode == "full_gpu":
        print("VSR_LOW_VRAM_OFFLOAD_V2: full GPU mode enabled.")
        pipeline.to(device=device)
'''
    replacement = '''    elif GPU_memory_mode == "block_offload_v5":
        print("VSR_BLOCK_OFFLOAD_V5: transformer block residency enabled; T5/CLIP/VAE stay phase-managed.")
        pipeline.to("cpu")
        pipeline._vsr_selective_gpu_v4 = True
        pipeline._vsr_block_offload_v5 = True
        pipeline._vsr_execution_device = device
    elif GPU_memory_mode == "full_gpu":
        print("VSR_LOW_VRAM_OFFLOAD_V2: full GPU mode enabled.")
        pipeline.to(device=device)
'''
    text = replace_once(text, anchor, replacement, "full-GPU branch")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied block-offload V5 infer transform.")


def transform_transformer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if V5 in text:
        print("[EchoMimicV3] Block-offload V5 transformer transform already present.")
        return

    manager = '''class BlockGPUManager:
    """Move only the active transformer block to CUDA during inference."""
    VSR_BLOCK_OFFLOAD_V5 = True

    def __init__(self, device="cuda"):
        self.device = device
        self.managed_modules = []
        self.embedder_modules = []
        self.output_modules = []

    def setup_for_inference(self, transformer_model):
        self.managed_modules = list(transformer_model.blocks)
        embedder_names = [
            "patch_embedding", "control_adapter", "ref_conv", "time_embedding",
            "time_projection", "audio_injection", "text_embedding", "img_emb",
        ]
        self.embedder_modules = [getattr(transformer_model, name) for name in embedder_names if hasattr(transformer_model, name)]
        self.output_modules = [getattr(transformer_model, "head")] if hasattr(transformer_model, "head") else []
        for module in self.embedder_modules + self.output_modules:
            if hasattr(module, "to"):
                module.to(self.device)
        return self

    def activate_block(self, block_index):
        block = self.managed_modules[block_index]
        block.to(self.device)
        if block_index > 0:
            self.managed_modules[block_index - 1].to("cpu")

    def unload_all(self):
        for module in self.managed_modules + self.embedder_modules + self.output_modules:
            if hasattr(module, "to"):
                module.to("cpu")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


'''
    text = replace_once(text, "def get_ai2v_audio(\n", manager + "def get_ai2v_audio(\n", "transformer helper insertion")

    signature = '''        full_ref=None,
        cond_flag=True,
    ):
'''
    signature_v5 = '''        full_ref=None,
        cond_flag=True,
        gpu_manager=None,
    ):
'''
    text = replace_once(text, signature, signature_v5, "transformer forward signature")

    teacache_loop = '''                for block in self.blocks:
                    if torch.is_grad_enabled() and self.gradient_checkpointing:
'''
    teacache_loop_v5 = '''                for block_index, block in enumerate(self.blocks):
                    if gpu_manager is not None:
                        gpu_manager.activate_block(block_index)
                    if torch.is_grad_enabled() and self.gradient_checkpointing:
'''
    text = replace_once(text, teacache_loop, teacache_loop_v5, "TeaCache transformer block loop")

    normal_loop = '''        else:
            for block in self.blocks:
                if torch.is_grad_enabled() and self.gradient_checkpointing:
'''
    normal_loop_v5 = '''        else:
            for block_index, block in enumerate(self.blocks):
                if gpu_manager is not None:
                    gpu_manager.activate_block(block_index)
                if torch.is_grad_enabled() and self.gradient_checkpointing:
'''
    text = replace_once(text, normal_loop, normal_loop_v5, "normal transformer block loop")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied block-offload V5 transformer transform.")


def transform_pipeline(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if V5 in text:
        print("[EchoMimicV3] Block-offload V5 pipeline transform already present.")
        return
    if V4 not in text:
        raise RuntimeError("Block-offload V5 requires recognized selective V4 pipeline runtime")

    device_anchor = '''        vsr_selective_gpu_v4 = getattr(self, "_vsr_selective_gpu_v4", False)
        if vsr_selective_gpu_v4:
'''
    device_replacement = '''        vsr_selective_gpu_v4 = getattr(self, "_vsr_selective_gpu_v4", False)
        vsr_block_offload_v5 = getattr(self, "_vsr_block_offload_v5", False)
        if vsr_block_offload_v5:
            print("VSR_BLOCK_OFFLOAD_V5: 49-frame benchmark uses one transformer block on CUDA at a time")
        if vsr_selective_gpu_v4:
'''
    text = replace_once(text, device_anchor, device_replacement, "V4 device state")

    transformer_anchor = '''        if vsr_selective_gpu_v4:
            if torch.is_tensor(clip_context):
                clip_context = clip_context.to(device=device, dtype=weight_dtype)
            elif isinstance(clip_context, (list, tuple)):
                clip_context = [u.to(device=device, dtype=weight_dtype) for u in clip_context]
            print("VSR_SELECTIVE_GPU_V4: CLIP context CPU -> CUDA")
            print("VSR_SELECTIVE_GPU_V4: phase=transformer -> cuda (resident for denoise loop)")
            self.transformer.to(device)
'''
    transformer_replacement = '''        gpu_manager = None
        if vsr_selective_gpu_v4:
            if torch.is_tensor(clip_context):
                clip_context = clip_context.to(device=device, dtype=weight_dtype)
            elif isinstance(clip_context, (list, tuple)):
                clip_context = [u.to(device=device, dtype=weight_dtype) for u in clip_context]
            print("VSR_SELECTIVE_GPU_V4: CLIP context CPU -> CUDA")
            if vsr_block_offload_v5:
                from src.wan_transformer3d_audio_2512 import BlockGPUManager
                gpu_manager = BlockGPUManager(device=str(device)).setup_for_inference(self.transformer)
                print("VSR_BLOCK_OFFLOAD_V5: transformer embedder/head on CUDA; blocks stream one-at-a-time")
            else:
                print("VSR_SELECTIVE_GPU_V4: phase=transformer -> cuda (resident for denoise loop)")
                self.transformer.to(device)
'''
    text = replace_once(text, transformer_anchor, transformer_replacement, "V4 transformer phase")

    primary_call = '''                        clip_fea=clip_context_input,
                    )
'''
    primary_replacement = '''                        clip_fea=clip_context_input,
                        gpu_manager=gpu_manager,
                    )
'''
    text = replace_once(text, primary_call, primary_replacement, "primary transformer call")

    secondary_call = '''                            clip_fea=clip_context_input,
                        )
'''
    secondary_replacement = '''                            clip_fea=clip_context_input,
                            gpu_manager=gpu_manager,
                        )
'''
    if secondary_call in text:
        text = replace_once(text, secondary_call, secondary_replacement, "secondary transformer call")
    else:
        print("[EchoMimicV3] Secondary transformer call anchor not present; primary call patched only.")

    decode_anchor = '''        if vsr_selective_gpu_v4:
            self.transformer.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=transformer -> cpu")
            print("VSR_SELECTIVE_GPU_V4: phase=vae_decode -> cuda")
            self.vae.to(device)
'''
    decode_replacement = '''        if vsr_selective_gpu_v4:
            if vsr_block_offload_v5 and gpu_manager is not None:
                gpu_manager.unload_all()
                print("VSR_BLOCK_OFFLOAD_V5: transformer blocks/embedder/head -> cpu")
            else:
                self.transformer.to("cpu")
                print("VSR_SELECTIVE_GPU_V4: phase=transformer -> cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V4: phase=vae_decode -> cuda")
            self.vae.to(device)
'''
    text = replace_once(text, decode_anchor, decode_replacement, "V4 decode boundary")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied block-offload V5 pipeline transform.")


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: echomimicv3-block-offload-v5.py <infer_flash.py> <pipeline.py> <transformer.py>")
    transform_infer(Path(sys.argv[1]))
    transform_pipeline(Path(sys.argv[2]))
    transform_transformer(Path(sys.argv[3]))


if __name__ == "__main__":
    main()
