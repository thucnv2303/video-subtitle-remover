from pathlib import Path
import sys

MARKER = "VSR_MMGP_V524_TUPLE_RETURN"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def patch_pipeline(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.4 pipeline return fix already present.")
        return
    if "VSR_MMGP_V523: pipeline_return" not in text:
        raise RuntimeError("V5.2.4 requires recognized V5.2.3 pipeline runtime")

    old = '''        if not return_dict:\n            print("VSR_MMGP_V523: torch_from_numpy_begin", flush=True)\n            video = torch.from_numpy(video)\n            print("VSR_MMGP_V523: torch_from_numpy_done", flush=True)\n\n        print("VSR_MMGP_V523: pipeline_return", flush=True)\n        return WanPipelineOutput(videos=video)\n'''
    new = '''        if not return_dict:\n            print("VSR_MMGP_V523: torch_from_numpy_begin", flush=True)\n            video = torch.from_numpy(video)\n            print("VSR_MMGP_V523: torch_from_numpy_done", flush=True)\n            if getattr(self, "_vsr_mmgp_v52", False):\n                # VSR_MMGP_V524_TUPLE_RETURN: avoid Diffusers BaseOutput construction on MMGP path.\n                print("VSR_MMGP_V524: tuple_return", flush=True)\n                return (video,)\n\n        print("VSR_MMGP_V523: pipeline_return", flush=True)\n        return WanPipelineOutput(videos=video)\n'''
    text = replace_once(text, old, new, "V5.2.3 post-decode return block")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.4 tuple return fix.")


def patch_infer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.4 infer return fix already present.")
        return
    if "VSR_MMGP_V52: chunk={chunk_index} pipeline_start" not in text:
        raise RuntimeError("V5.2.4 requires recognized V5.2 infer benchmark runtime")

    old = '''            sample = pipeline(\n                prompt,\n'''
    new = '''            _vsr_pipeline_result = pipeline(\n                prompt,\n'''
    text = replace_once(text, old, new, "MMGP chunk pipeline assignment")

    old = '''                shift=shift,\n            ).videos\n            _vsr_chunk_seconds = _vsr_time.perf_counter() - _vsr_chunk_started\n'''
    new = '''                shift=shift,\n                return_dict=False if GPU_memory_mode == "mmgp_v52" else True,\n            )\n            # VSR_MMGP_V524_TUPLE_RETURN: MMGP path returns (video,) directly.\n            sample = _vsr_pipeline_result[0] if GPU_memory_mode == "mmgp_v52" else _vsr_pipeline_result.videos\n            print(f"VSR_MMGP_V524: caller_received type={type(_vsr_pipeline_result).__name__} sample_device={sample.device}", flush=True)\n            _vsr_chunk_seconds = _vsr_time.perf_counter() - _vsr_chunk_started\n'''
    text = replace_once(text, old, new, "MMGP chunk pipeline result extraction")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.4 infer tuple result handling.")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: echomimicv3-mmgp-v524-return-fix.py <infer_flash.py> <pipeline.py>")
    patch_infer(Path(sys.argv[1]))
    patch_pipeline(Path(sys.argv[2]))


if __name__ == "__main__":
    main()
