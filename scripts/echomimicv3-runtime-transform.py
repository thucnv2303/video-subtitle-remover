from pathlib import Path
import sys

LOW_VRAM_MARKER = "VSR_LOW_VRAM_OFFLOAD_V2"
LONG_AUDIO_MARKER = "VSR_LONG_AUDIO_V2"


def require_single(text: str, token: str, label: str) -> int:
    count = text.count(token)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}; found {count}")
    return text.index(token)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: echomimicv3-runtime-transform.py <infer_flash.py>")

    target = Path(sys.argv[1])
    text = target.read_text(encoding="utf-8")

    if LOW_VRAM_MARKER in text and LONG_AUDIO_MARKER in text:
        print("[EchoMimicV3] Runtime transform V2 already present.")
        return
    if "VSR_LOW_VRAM_OFFLOAD_V1" in text:
        raise RuntimeError("V1 marker still present; reverse V1 before applying V2 transform")
    if LOW_VRAM_MARKER in text or LONG_AUDIO_MARKER in text:
        raise RuntimeError("Partial V2 runtime markers detected; refusing transform")

    full_gpu_line = "    pipeline.to(device=device)\n"
    positions = []
    search_from = 0
    while True:
        pos = text.find(full_gpu_line, search_from)
        if pos < 0:
            break
        positions.append(pos)
        search_from = pos + len(full_gpu_line)
    if len(positions) != 2:
        raise RuntimeError(f"Expected exactly two full-pipeline CUDA placements; found {len(positions)}")

    first, second = positions
    offload_block = (
        "    if GPU_memory_mode == \"sequential_cpu_offload\":\n"
        "        print(\"VSR_LOW_VRAM_OFFLOAD_V2: sequential CPU offload + chunked long-audio enabled.\")\n"
        "        pipeline.enable_sequential_cpu_offload()\n"
        "    elif GPU_memory_mode == \"full_gpu\":\n"
        "        print(\"VSR_LOW_VRAM_OFFLOAD_V2: full GPU mode enabled.\")\n"
        "        pipeline.to(device=device)\n"
        "    else:\n"
        "        raise ValueError(f\"Unsupported GPU_memory_mode: {GPU_memory_mode}\")\n"
    )
    text = (
        text[:first]
        + offload_block
        + text[first + len(full_gpu_line):second]
        + text[second + len(full_gpu_line):]
    )

    import_line = "from moviepy import VideoFileClip, AudioFileClip\n"
    require_single(text, import_line, "MoviePy import")
    text = text.replace(import_line, "from moviepy import VideoFileClip, AudioFileClip, concatenate_videoclips\n", 1)

    start_token = "        # Load audio\n"
    end_token = "        print(f\"Saved output to: {output_video_path}\")\n"
    start = require_single(text, start_token, "audio/render block start")
    end = require_single(text, end_token, "audio/render block end") + len(end_token)
    old_block = text[start:end]
    required_old_tokens = [
        "video_length_actual = min(int(audio_clip.duration * fps), video_length)",
        "audio_clip = audio_clip.subclipped(0, video_length_actual / fps)",
        "save_videos_grid(sample[:,:,:video_length_actual], tmp_video_path, fps=fps)",
    ]
    for token in required_old_tokens:
        if token not in old_block:
            raise RuntimeError(f"Pinned upstream audio/render block changed; missing token: {token}")

    new_block = '''        # Load full audio. video_length is the per-chunk VRAM ceiling, not total output length.
        audio_clip = AudioFileClip(audio_path)
        total_video_frames = max(1, int(math.ceil(audio_clip.duration * fps)))
        chunk_max_frames = max(5, int(video_length))
        chunk_max_frames = ((chunk_max_frames - 1) // vae.config.temporal_compression_ratio) * vae.config.temporal_compression_ratio + 1
        if chunk_max_frames < 5:
            raise ValueError("video_length must allow at least 5 frames for chunked rendering")
        chunk_stride = chunk_max_frames - 1

        mel_input, sr = librosa.load(audio_path, sr=16000)
        mel_input = loudness_norm(mel_input, sr)
        print(f"VSR_LONG_AUDIO_V2: duration={audio_clip.duration:.3f}s total_frames={total_video_frames} chunk_frames={chunk_max_frames} stride={chunk_stride}")
        audio_feature_wav2vec = get_audio_embed(
            mel_input,
            wav2vec_feature_extractor,
            audio_encoder,
            total_video_frames,
            sr=16000,
            fps=fps,
            device='cpu',
        )

        current_reference = Image.fromarray(ref_start).convert("RGB")
        chunk_paths = []
        chunk_index = 0

        for chunk_start in range(0, total_video_frames, chunk_stride):
            raw_chunk_frames = min(chunk_max_frames, total_video_frames - chunk_start)
            if chunk_start > 0 and raw_chunk_frames <= 1:
                break

            chunk_frames = raw_chunk_frames
            remainder = (chunk_frames - 1) % vae.config.temporal_compression_ratio
            if remainder:
                chunk_frames += vae.config.temporal_compression_ratio - remainder
            chunk_frames = min(chunk_frames, chunk_max_frames)

            chunk_index += 1
            print(
                f"VSR_LONG_AUDIO_V2: chunk={chunk_index} start={chunk_start} "
                f"actual_frames={raw_chunk_frames} infer_frames={chunk_frames}"
            )

            local_centers = torch.arange(chunk_start, chunk_start + chunk_frames).unsqueeze(1)
            context_offsets = (torch.arange(2 * 2 + 1) - 2).unsqueeze(0)
            center_indices = local_centers + context_offsets
            center_indices = torch.clamp(center_indices, min=0, max=audio_feature_wav2vec.shape[0] - 1)
            audio_embeds = audio_feature_wav2vec[center_indices]
            audio_embeds = audio_embeds.unsqueeze(0).to(device=device, dtype=weight_dtype)

            latent_frames = (chunk_frames - 1) // vae.config.temporal_compression_ratio + 1
            if enable_riflex:
                pipeline.transformer.enable_riflex(k=riflex_k, L_test=latent_frames)
            if coefficients is not None:
                pipeline.transformer.enable_teacache(
                    coefficients,
                    num_inference_steps,
                    teacache_threshold,
                    num_skip_start_steps=num_skip_start_steps,
                    offload=teacache_offload,
                )

            sample_size_0, sample_size_1 = get_sample_size(current_reference, sample_size)
            input_video, input_video_mask, clip_image = get_image_to_video_latent2(
                current_reference,
                None,
                video_length=chunk_frames,
                sample_size=[sample_size_0, sample_size_1],
            )

            sample = pipeline(
                prompt,
                num_frames=chunk_frames,
                negative_prompt=negative_prompt,
                audio_embeds=audio_embeds,
                audio_scale=audio_scale,
                ip_mask=None,
                use_un_ip_mask=use_un_ip_mask,
                height=sample_size_0,
                width=sample_size_1,
                generator=generator,
                neg_scale=neg_scale,
                neg_steps=neg_steps,
                use_dynamic_cfg=use_dynamic_cfg,
                use_dynamic_acfg=use_dynamic_acfg,
                guidance_scale=guidance_scale,
                audio_guidance_scale=audio_guidance_scale,
                num_inference_steps=num_inference_steps,
                video=input_video,
                mask_video=input_video_mask,
                clip_image=clip_image,
                cfg_skip_ratio=cfg_skip_ratio,
                shift=shift,
            ).videos

            sample = sample[:, :, :raw_chunk_frames].cpu()
            last_frame = sample[0, :, raw_chunk_frames - 1].permute(1, 2, 0).float().numpy()
            last_frame = np.clip(last_frame * 255.0, 0, 255).astype(np.uint8)
            current_reference = Image.fromarray(last_frame).convert("RGB")

            chunk_sample = sample if chunk_start == 0 else sample[:, :, 1:]
            chunk_path = os.path.join(save_path, f"{image_name}_chunk_{chunk_index:04d}.mp4")
            save_videos_grid(chunk_sample, chunk_path, fps=fps)
            chunk_paths.append(chunk_path)

            del sample, chunk_sample, audio_embeds, input_video, input_video_mask, clip_image
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        if not chunk_paths:
            raise RuntimeError("Chunked EchoMimicV3 produced no video chunks")

        chunk_clips = [VideoFileClip(chunk_path) for chunk_path in chunk_paths]
        video_clip = concatenate_videoclips(chunk_clips, method="chain")
        expected_video_duration = total_video_frames / fps
        if video_clip.duration + (1.0 / fps) < audio_clip.duration:
            raise RuntimeError(
                f"Chunked duration too short: video={video_clip.duration:.3f}s audio={audio_clip.duration:.3f}s"
            )
        video_clip = video_clip.with_audio(audio_clip)
        video_clip.write_videofile(output_video_path, codec="libx264", audio_codec="aac", threads=2)

        video_clip.close()
        for clip in chunk_clips:
            clip.close()
        audio_clip.close()
        for chunk_path in chunk_paths:
            os.remove(chunk_path)

        print(f"VSR_LONG_AUDIO_V2: completed frames={total_video_frames} duration={expected_video_duration:.3f}s")
        print(f"Saved output to: {output_video_path}")
'''

    text = text[:start] + new_block + text[end:]

    if text.count(LOW_VRAM_MARKER) != 2:
        raise RuntimeError("Unexpected low-VRAM V2 marker count after transform")
    if text.count(LONG_AUDIO_MARKER) < 2:
        raise RuntimeError("Long-audio V2 markers missing after transform")

    target.write_text(text, encoding="utf-8", newline="\n")
    print("[EchoMimicV3] Applied deterministic runtime transform V2.")


if __name__ == "__main__":
    main()
