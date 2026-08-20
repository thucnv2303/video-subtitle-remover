from pathlib import Path
import sys

MARKER = "VSR_MMGP_V52"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: echomimicv3-mmgp-v52.py <infer_flash.py>")

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2 transform already present.")
        return
    if "VSR_LOW_VRAM_OFFLOAD_V2" not in text or "VSR_LONG_AUDIO_V2" not in text:
        raise RuntimeError("MMGP V5.2 requires recognized V2 runtime")

    full_gpu_branch = '''    elif GPU_memory_mode == "full_gpu":
        print("VSR_LOW_VRAM_OFFLOAD_V2: full GPU mode enabled.")
        pipeline.to(device=device)
'''
    mmgp_branch = '''    elif GPU_memory_mode == "mmgp_v52":
        import importlib.util
        from mmgp import offload, profile_type
        total_vram_mb = int(torch.cuda.get_device_properties(0).total_memory / 1048576)
        budget_mb = int(total_vram_mb * 0.90)
        flash_attn_available = importlib.util.find_spec("flash_attn") is not None
        print(f"VSR_MMGP_V52: profile=LowRAM_HighVRAM budget_mb={budget_mb} total_vram_mb={total_vram_mb}")
        print(f"VSR_MMGP_V52: flash_attn_package={flash_attn_available}")
        print(f"VSR_MMGP_V52: torch_flash_sdp={torch.backends.cuda.flash_sdp_enabled()} mem_efficient_sdp={torch.backends.cuda.mem_efficient_sdp_enabled()} math_sdp={torch.backends.cuda.math_sdp_enabled()}")
        pipeline.to("cpu")
        offload.profile(
            pipeline,
            profile_type.LowRAM_HighVRAM,
            budgets={"*": budget_mb},
            compile=False,
        )
        print("VSR_MMGP_V52: MMGP profile applied")
    elif GPU_memory_mode == "full_gpu":
        print("VSR_LOW_VRAM_OFFLOAD_V2: full GPU mode enabled.")
        pipeline.to(device=device)
'''
    text = replace_once(text, full_gpu_branch, mmgp_branch, "V2 full-GPU branch")

    chunk_start = '''            sample = pipeline(
'''
    chunk_start_replacement = '''            import time as _vsr_time
            _vsr_chunk_started = _vsr_time.perf_counter()
            if torch.cuda.is_available():
                torch.cuda.reset_peak_memory_stats()
            print(f"VSR_MMGP_V52: chunk={chunk_index} pipeline_start")
            sample = pipeline(
'''
    text = replace_once(text, chunk_start, chunk_start_replacement, "chunk pipeline call")

    chunk_end = '''            ).videos

            sample = sample[:, :, :raw_chunk_frames].cpu()
'''
    chunk_end_replacement = '''            ).videos
            _vsr_chunk_seconds = _vsr_time.perf_counter() - _vsr_chunk_started
            _vsr_peak_gb = torch.cuda.max_memory_allocated() / 1024**3 if torch.cuda.is_available() else 0.0
            print(f"VSR_MMGP_V52: chunk={chunk_index} pipeline_seconds={_vsr_chunk_seconds:.3f} peak_cuda_gb={_vsr_peak_gb:.3f}")

            sample = sample[:, :, :raw_chunk_frames].cpu()
'''
    text = replace_once(text, chunk_end, chunk_end_replacement, "chunk pipeline return")

    if text.count(MARKER) < 6:
        raise RuntimeError(f"MMGP V5.2 markers missing after transform: {text.count(MARKER)}")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2 runtime transform.")


if __name__ == "__main__":
    main()
