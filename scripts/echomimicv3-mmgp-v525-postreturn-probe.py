from pathlib import Path
import sys

MARKER = "VSR_MMGP_V525_POSTRETURN_PROBE"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: echomimicv3-mmgp-v525-postreturn-probe.py <infer_flash.py>")

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.5 post-return probe already present.")
        return
    if "VSR_MMGP_V524: caller_received" not in text:
        raise RuntimeError("V5.2.5 requires recognized V5.2.4 runtime")

    old = '''            print(f"VSR_MMGP_V524: caller_received type={type(_vsr_pipeline_result).__name__} sample_device={sample.device}", flush=True)\n            _vsr_chunk_seconds = _vsr_time.perf_counter() - _vsr_chunk_started\n            _vsr_peak_gb = torch.cuda.max_memory_allocated() / 1024**3 if torch.cuda.is_available() else 0.0\n            print(f"VSR_MMGP_V52: chunk={chunk_index} pipeline_seconds={_vsr_chunk_seconds:.3f} peak_cuda_gb={_vsr_peak_gb:.3f}")\n\n            sample = sample[:, :, :raw_chunk_frames].cpu()\n'''

    new = '''            print(f"VSR_MMGP_V524: caller_received type={type(_vsr_pipeline_result).__name__} sample_device={sample.device}", flush=True)\n            # VSR_MMGP_V525_POSTRETURN_PROBE: make every post-return step observable.\n            _vsr_chunk_seconds = _vsr_time.perf_counter() - _vsr_chunk_started\n            print(f"VSR_MMGP_V525: pipeline_seconds_ready={_vsr_chunk_seconds:.3f}", flush=True)\n            print("VSR_MMGP_V525: peak_query_begin", flush=True)\n            _vsr_peak_gb = torch.cuda.max_memory_allocated() / 1024**3 if torch.cuda.is_available() else 0.0\n            print(f"VSR_MMGP_V525: peak_query_done peak_cuda_gb={_vsr_peak_gb:.3f}", flush=True)\n            print(f"VSR_MMGP_V52: chunk={chunk_index} pipeline_seconds={_vsr_chunk_seconds:.3f} peak_cuda_gb={_vsr_peak_gb:.3f}", flush=True)\n\n            if GPU_memory_mode == "mmgp_v52" and chunk_index == 1:\n                print("VSR_MMGP_V525: benchmark_stop_after_chunk1_before_postprocess", flush=True)\n                return\n\n            print("VSR_MMGP_V525: sample_slice_begin", flush=True)\n            sample = sample[:, :, :raw_chunk_frames].cpu()\n            print("VSR_MMGP_V525: sample_slice_done", flush=True)\n'''

    text = replace_once(text, old, new, "V5.2.4 caller timing block")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.5 post-return probe.")


if __name__ == "__main__":
    main()
