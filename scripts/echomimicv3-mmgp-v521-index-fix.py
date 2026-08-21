from pathlib import Path
import sys

MARKER = "VSR_MMGP_V521_CPU_INDICES"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: echomimicv3-mmgp-v521-index-fix.py <infer_flash.py>")

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    if MARKER in text:
        print("[EchoMimicV3] MMGP V5.2.1 CPU index fix already present.")
        return
    if "VSR_MMGP_V52" not in text or "VSR_LONG_AUDIO_V2" not in text:
        raise RuntimeError("V5.2.1 requires recognized MMGP V5.2 + long-audio runtime")

    old = '''            local_centers = torch.arange(chunk_start, chunk_start + chunk_frames).unsqueeze(1)
            context_offsets = (torch.arange(5) - 2).unsqueeze(0)
            center_indices = torch.clamp(local_centers + context_offsets, min=0, max=audio_feature_wav2vec.shape[0] - 1)
            audio_embeds = audio_feature_wav2vec[center_indices].unsqueeze(0).to(device=device, dtype=weight_dtype)
'''
    new = '''            # VSR_MMGP_V521_CPU_INDICES: MMGP may set a CUDA default device context.
            # Wav2Vec features are intentionally CPU-resident, so build indexing tensors on CPU too,
            # then transfer only the gathered chunk embedding to the inference device.
            local_centers = torch.arange(chunk_start, chunk_start + chunk_frames, device="cpu").unsqueeze(1)
            context_offsets = (torch.arange(5, device="cpu") - 2).unsqueeze(0)
            center_indices = torch.clamp(local_centers + context_offsets, min=0, max=audio_feature_wav2vec.shape[0] - 1)
            audio_embeds = audio_feature_wav2vec[center_indices].unsqueeze(0).to(device=device, dtype=weight_dtype)
'''
    text = replace_once(text, old, new, "long-audio CPU index block")
    path.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied MMGP V5.2.1 CPU index fix.")


if __name__ == "__main__":
    main()
