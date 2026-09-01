from pathlib import Path
import sys

MARKER = "VSR_MMGP_V523_SKIP_DIFFUSERS_HOOK_CLEANUP"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def patch_infer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.3 infer marker already present.")
        return
    if "VSR_MMGP_V52: MMGP profile applied" not in text:
        raise RuntimeError("V5.2.3 requires recognized MMGP V5.2 infer runtime")

    old = '''        offload.profile(\n            pipeline,\n            profile_type.LowRAM_HighVRAM,\n            budgets={"*": budget_mb},\n            compile=False,\n        )\n        print("VSR_MMGP_V52: MMGP profile applied")\n'''
    new = '''        offload.profile(\n            pipeline,\n            profile_type.LowRAM_HighVRAM,\n            budgets={"*": budget_mb},\n            compile=False,\n        )\n        pipeline._vsr_mmgp_v52 = True  # VSR_MMGP_V523_SKIP_DIFFUSERS_HOOK_CLEANUP\n        print("VSR_MMGP_V52: MMGP profile applied")\n        print("VSR_MMGP_V523: MMGP owns model hooks; Diffusers cleanup will be skipped inside pipeline")\n'''
    text = replace_once(text, old, new, "MMGP profile block")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.3 infer hook marker.")


def patch_pipeline(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.3 pipeline fix already present.")
        return

    old = '''        # Offload all models\n        self.maybe_free_model_hooks()\n\n        if not return_dict:\n            video = torch.from_numpy(video)\n\n        return WanPipelineOutput(videos=video)\n'''
    new = '''        # Offload all models\n        # VSR_MMGP_V523_SKIP_DIFFUSERS_HOOK_CLEANUP: MMGP owns the active hooks.\n        # Calling Diffusers cleanup here hangs after successful decode on the MMGP path.\n        if getattr(self, "_vsr_mmgp_v52", False):\n            print("VSR_MMGP_V523: skip maybe_free_model_hooks (MMGP-managed pipeline)", flush=True)\n        else:\n            print("VSR_MMGP_V523: diffusers_hook_cleanup_begin", flush=True)\n            self.maybe_free_model_hooks()\n            print("VSR_MMGP_V523: diffusers_hook_cleanup_done", flush=True)\n\n        if not return_dict:\n            print("VSR_MMGP_V523: torch_from_numpy_begin", flush=True)\n            video = torch.from_numpy(video)\n            print("VSR_MMGP_V523: torch_from_numpy_done", flush=True)\n\n        print("VSR_MMGP_V523: pipeline_return", flush=True)\n        return WanPipelineOutput(videos=video)\n'''
    text = replace_once(text, old, new, "post-decode cleanup/return block")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.3 pipeline hook cleanup fix.")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: echomimicv3-mmgp-v523-hook-fix.py <infer_flash.py> <pipeline.py>")
    patch_infer(Path(sys.argv[1]))
    patch_pipeline(Path(sys.argv[2]))


if __name__ == "__main__":
    main()
