from pathlib import Path
import sys

SELECTIVE_MARKER = "VSR_SELECTIVE_GPU_V3"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def transform_infer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if SELECTIVE_MARKER in text:
        print("[EchoMimicV3] Selective GPU V3 infer transform already present.")
        return

    old = '''    elif GPU_memory_mode == "model_cpu_offload":
        print("VSR_MODEL_CPU_OFFLOAD_BENCH_V1: model CPU offload enabled.")
        pipeline.enable_model_cpu_offload()
'''
    new = '''    elif GPU_memory_mode == "selective_gpu_v3":
        print("VSR_SELECTIVE_GPU_V3: phase-based selective GPU residency enabled.")
        pipeline._vsr_selective_gpu_v3 = True
        pipeline._vsr_execution_device = device
'''
    text = replace_once(text, old, new, "model-offload branch")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied selective GPU V3 infer transform.")


def transform_pipeline(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if SELECTIVE_MARKER in text:
        print("[EchoMimicV3] Selective GPU V3 pipeline transform already present.")
        return

    old_device = '''        device = self._execution_device
        weight_dtype = self.text_encoder.dtype


        do_classifier_free_guidance = guidance_scale > 1.0
'''
    new_device = '''        device = self._execution_device
        weight_dtype = self.text_encoder.dtype
        vsr_selective_gpu_v3 = getattr(self, "_vsr_selective_gpu_v3", False)
        if vsr_selective_gpu_v3:
            device = getattr(self, "_vsr_execution_device", device)
            print("VSR_SELECTIVE_GPU_V3: phase=text_encoder -> cuda")
            self.text_encoder.to(device)

        do_classifier_free_guidance = guidance_scale > 1.0
'''
    text = replace_once(text, old_device, new_device, "pipeline device block")

    old_after_prompt = '''        # 4. Prepare timesteps
'''
    new_after_prompt = '''        if vsr_selective_gpu_v3:
            self.text_encoder.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=text_encoder -> cpu")

        # 4. Prepare timesteps
'''
    text = replace_once(text, old_after_prompt, new_after_prompt, "post-prompt phase boundary")

    old_mask = '''        # Prepare mask latent variables
'''
    new_mask = '''        if vsr_selective_gpu_v3:
            print("VSR_SELECTIVE_GPU_V3: phase=vae_encode -> cuda")
            self.vae.to(device)

        # Prepare mask latent variables
'''
    text = replace_once(text, old_mask, new_mask, "VAE encode phase start")

    old_clip = '''        # Prepare clip latent variables
'''
    new_clip = '''        if vsr_selective_gpu_v3:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=vae_encode -> cpu")
            print("VSR_SELECTIVE_GPU_V3: phase=clip -> cuda")
            self.clip_image_encoder.to(device)

        # Prepare clip latent variables
'''
    text = replace_once(text, old_clip, new_clip, "CLIP phase start")

    old_denoise = '''        # 6. Prepare extra step kwargs. TODO: Logic should ideally just be moved out of the pipeline
'''
    new_denoise = '''        if vsr_selective_gpu_v3:
            self.clip_image_encoder.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=clip -> cpu")
            print("VSR_SELECTIVE_GPU_V3: phase=transformer -> cuda (resident for denoise loop)")
            self.transformer.to(device)

        # 6. Prepare extra step kwargs. TODO: Logic should ideally just be moved out of the pipeline
'''
    text = replace_once(text, old_denoise, new_denoise, "transformer phase start")

    old_decode = '''        if output_type == "numpy":
            video = self.decode_latents(latents)
'''
    new_decode = '''        if vsr_selective_gpu_v3:
            self.transformer.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=transformer -> cpu")
            print("VSR_SELECTIVE_GPU_V3: phase=vae_decode -> cuda")
            self.vae.to(device)

        if output_type == "numpy":
            video = self.decode_latents(latents)
'''
    text = replace_once(text, old_decode, new_decode, "VAE decode phase start")

    old_free = '''        # Offload all models
        self.maybe_free_model_hooks()
'''
    new_free = '''        if vsr_selective_gpu_v3:
            self.vae.to("cpu")
            torch.cuda.empty_cache()
            print("VSR_SELECTIVE_GPU_V3: phase=vae_decode -> cpu")

        # Offload all models
        self.maybe_free_model_hooks()
'''
    text = replace_once(text, old_free, new_free, "post-decode phase boundary")

    if text.count(SELECTIVE_MARKER) < 8:
        raise RuntimeError("Selective GPU V3 markers missing after pipeline transform")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied selective GPU V3 pipeline transform.")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: echomimicv3-selective-v3.py <infer_flash.py> <pipeline.py>")
    transform_infer(Path(sys.argv[1]))
    transform_pipeline(Path(sys.argv[2]))


if __name__ == "__main__":
    main()
