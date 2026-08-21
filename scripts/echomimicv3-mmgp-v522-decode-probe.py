from pathlib import Path
import sys

MARKER = "VSR_MMGP_V522_DECODE_PROBE"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: echomimicv3-mmgp-v522-decode-probe.py <pipeline.py>")

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.2 decode probe already present.")
        return

    old = '''    def decode_latents(self, latents: torch.Tensor) -> torch.Tensor:\n        frames = self.vae.decode(latents.to(self.vae.dtype)).sample\n        frames = (frames / 2 + 0.5).clamp(0, 1)\n        frames = frames.cpu().float().numpy()\n        return frames\n'''

    new = '''    def decode_latents(self, latents: torch.Tensor) -> torch.Tensor:\n        # VSR_MMGP_V522_DECODE_PROBE: isolate the post-denoise/MMGP/VAE bottleneck.\n        import time as _vsr_time\n        _vsr_decode_started = _vsr_time.perf_counter()\n        print(f"VSR_MMGP_V522: vae_decode_enter latents_device={latents.device} latents_dtype={latents.dtype} vae_device={next(self.vae.parameters()).device} vae_dtype={self.vae.dtype}", flush=True)\n        _vsr_before_decode = _vsr_time.perf_counter()\n        frames = self.vae.decode(latents.to(self.vae.dtype)).sample\n        if torch.cuda.is_available():\n            torch.cuda.synchronize()\n        _vsr_after_decode = _vsr_time.perf_counter()\n        print(f"VSR_MMGP_V522: vae_decode_done seconds={_vsr_after_decode - _vsr_before_decode:.3f} frames_device={frames.device} frames_dtype={frames.dtype}", flush=True)\n        frames = (frames / 2 + 0.5).clamp(0, 1)\n        print("VSR_MMGP_V522: frames_cpu_begin", flush=True)\n        _vsr_before_cpu = _vsr_time.perf_counter()\n        frames = frames.cpu().float().numpy()\n        _vsr_after_cpu = _vsr_time.perf_counter()\n        print(f"VSR_MMGP_V522: frames_cpu_done seconds={_vsr_after_cpu - _vsr_before_cpu:.3f} decode_total_seconds={_vsr_after_cpu - _vsr_decode_started:.3f}", flush=True)\n        return frames\n'''

    text = replace_once(text, old, new, "decode_latents function")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.2 VAE decode probe.")


if __name__ == "__main__":
    main()
