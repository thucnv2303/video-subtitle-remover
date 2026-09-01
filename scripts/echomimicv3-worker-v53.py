import argparse
import json
import math
import os
import sys
import time
import traceback
from pathlib import Path

CONTROL_PREFIX = "VSR_WORKER_JSON "
CHUNK_FRAMES = 49
CHUNK_STRIDE = 48
FPS = 25
PROMPT = "A natural person is speaking with realistic facial expressions, subtle head movement, blinking and conversational emotion."
NEGATIVE_PROMPT = "static face, frozen expression, stiff head, bad mouth, deformed face, jitter"


def emit_control(kind, **payload):
    print(CONTROL_PREFIX + json.dumps({"type": kind, **payload}, ensure_ascii=False), flush=True)


def parse_args():
    parser = argparse.ArgumentParser(description="Persistent EchoMimicV3 V5.3 worker")
    parser.add_argument("--repo", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--audio-model", required=True)
    parser.add_argument("--transformer", required=True)
    return parser.parse_args()


class EchoWorker:
    def __init__(self, args):
        self.args = args
        self.job_count = 0
        self.rt = None
        self.torch = None
        self.Image = None
        self.AudioFileClip = None
        self.VideoFileClip = None
        self.concatenate_videoclips = None
        self.pipeline = None
        self.audio_encoder = None
        self.wav2vec_feature_extractor = None
        self.device = None
        self.weight_dtype = None
        self.vae = None
        self.generator_seed = 43
        self.coefficients = None

    def initialize(self):
        started = time.perf_counter()
        emit_control("boot_start", marker="VSR_WORKER_V53: boot_start")
        repo = Path(self.args.repo).resolve()
        if str(repo) not in sys.path:
            sys.path.insert(0, str(repo))
        os.chdir(repo)

        from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2Model

        emit_control("model_init_start", marker="VSR_WORKER_V53: model_init_start")
        self.audio_encoder = Wav2Vec2Model.from_pretrained(self.args.audio_model, local_files_only=True).to("cpu")
        self.audio_encoder.feature_extractor._freeze_parameters()
        self.wav2vec_feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(
            self.args.audio_model,
            local_files_only=True,
        )
        print("VSR_WORKER_V53: wav2vec_ready", flush=True)

        import infer_flash as rt
        import torch
        from PIL import Image
        from moviepy import AudioFileClip, VideoFileClip, concatenate_videoclips
        from mmgp import offload, profile_type
        from safetensors.torch import load_file

        self.rt = rt
        self.torch = torch
        self.Image = Image
        self.AudioFileClip = AudioFileClip
        self.VideoFileClip = VideoFileClip
        self.concatenate_videoclips = concatenate_videoclips
        self.weight_dtype = torch.bfloat16
        self.device = rt.set_multi_gpus_devices(1, 1)
        config = rt.OmegaConf.load(self.args.config)

        transformer = rt.WanTransformer.from_pretrained(
            os.path.join(self.args.model, config["transformer_additional_kwargs"].get("transformer_subpath", "transformer")),
            transformer_additional_kwargs=rt.OmegaConf.to_container(config["transformer_additional_kwargs"]),
            low_cpu_mem_usage=True,
            torch_dtype=self.weight_dtype,
        )
        state_dict = load_file(self.args.transformer)
        state_dict = state_dict["state_dict"] if "state_dict" in state_dict else state_dict
        missing, unexpected = transformer.load_state_dict(state_dict, strict=False)
        print(f"VSR_WORKER_V53: transformer_checkpoint missing={len(missing)} unexpected={len(unexpected)}", flush=True)

        self.vae = rt.AutoencoderKLWan.from_pretrained(
            os.path.join(self.args.model, config["vae_kwargs"].get("vae_subpath", "vae")),
            additional_kwargs=rt.OmegaConf.to_container(config["vae_kwargs"]),
        ).to(self.weight_dtype)
        tokenizer = rt.AutoTokenizer.from_pretrained(
            os.path.join(self.args.model, config["text_encoder_kwargs"].get("tokenizer_subpath", "tokenizer"))
        )
        text_encoder = rt.WanT5EncoderModel.from_pretrained(
            os.path.join(self.args.model, config["text_encoder_kwargs"].get("text_encoder_subpath", "text_encoder")),
            additional_kwargs=rt.OmegaConf.to_container(config["text_encoder_kwargs"]),
            low_cpu_mem_usage=True,
            torch_dtype=self.weight_dtype,
        ).eval()
        clip_image_encoder = rt.CLIPModel.from_pretrained(
            os.path.join(self.args.model, config["image_encoder_kwargs"].get("image_encoder_subpath", "image_encoder"))
        ).to(self.weight_dtype).eval()

        config["scheduler_kwargs"]["shift"] = 1
        scheduler_cls = rt.FlowUniPCMultistepScheduler
        scheduler = scheduler_cls(**rt.filter_kwargs(scheduler_cls, rt.OmegaConf.to_container(config["scheduler_kwargs"])))
        self.pipeline = rt.WanFunInpaintAudioPipeline(
            transformer=transformer,
            vae=self.vae,
            tokenizer=tokenizer,
            text_encoder=text_encoder,
            scheduler=scheduler,
            clip_image_encoder=clip_image_encoder,
        )

        total_vram_mb = int(torch.cuda.get_device_properties(0).total_memory / 1048576)
        budget_mb = int(total_vram_mb * 0.90)
        print(f"VSR_WORKER_V53: mmgp_profile=LowRAM_HighVRAM budget_mb={budget_mb} total_vram_mb={total_vram_mb}", flush=True)
        self.pipeline.to("cpu")
        offload.profile(
            self.pipeline,
            profile_type.LowRAM_HighVRAM,
            budgets={"*": budget_mb},
            compile=False,
        )

        self.coefficients = rt.get_teacache_coefficients(self.args.model)
        if self.coefficients is not None:
            self.pipeline.transformer.enable_teacache(
                self.coefficients,
                8,
                0.1,
                num_skip_start_steps=5,
                offload=False,
            )

        init_seconds = time.perf_counter() - started
        emit_control("model_init_done", marker="VSR_WORKER_V53: model_init_done", init_seconds=round(init_seconds, 3))
        emit_control("ready", marker="VSR_WORKER_V53: READY", init_seconds=round(init_seconds, 3))

    def _infer_frame_count(self, actual_frames):
        infer_frames = max(5, actual_frames)
        ratio = self.vae.config.temporal_compression_ratio
        remainder = (infer_frames - 1) % ratio
        if remainder:
            infer_frames += ratio - remainder
        return min(infer_frames, CHUNK_FRAMES)

    def render(self, job):
        job_id = str(job.get("job_id") or "")
        image_path = str(job.get("image_path") or "")
        audio_path = str(job.get("audio_path") or "")
        output_dir = str(job.get("output_dir") or "")
        if not job_id or not image_path or not audio_path or not output_dir:
            raise ValueError("render requires job_id, image_path, audio_path and output_dir")

        self.job_count += 1
        warm = self.job_count > 1
        emit_control(
            "job_received",
            job_id=job_id,
            warm=warm,
            marker=f"VSR_WORKER_V53: job_received id={job_id} warm={str(warm).lower()}",
        )

        os.makedirs(output_dir, exist_ok=True)
        image_name = Path(image_path).stem
        output_video_path = os.path.join(output_dir, f"{image_name}_v53_full.mp4")
        chunk_dir = os.path.join(output_dir, "chunks")
        os.makedirs(chunk_dir, exist_ok=True)

        rt = self.rt
        torch = self.torch
        chunk_paths = []
        chunk_pipeline_seconds = []
        peak_cuda_gb = 0.0

        with torch.no_grad():
            ref_image = self.Image.open(image_path).convert("RGB")
            audio_clip = self.AudioFileClip(audio_path)
            total_frames = max(1, int(math.ceil(audio_clip.duration * FPS)))
            if total_frames < 5:
                audio_clip.close()
                raise ValueError("Audio is too short for EchoMimicV3")

            mel_input, sr = rt.librosa.load(audio_path, sr=16000)
            mel_input = rt.loudness_norm(mel_input, sr)
            audio_feature_wav2vec = rt.get_audio_embed(
                mel_input,
                self.wav2vec_feature_extractor,
                self.audio_encoder,
                total_frames,
                sr=16000,
                fps=FPS,
                device="cpu",
            )

            sample_h, sample_w = rt.get_sample_size(ref_image, [768, 768])
            starts = list(range(0, total_frames, CHUNK_STRIDE))
            total_chunks = len(starts)
            emit_control(
                "full_render_plan",
                job_id=job_id,
                total_frames=total_frames,
                total_chunks=total_chunks,
                marker=f"VSR_WORKER_V53: full_render_plan frames={total_frames} chunks={total_chunks} stride={CHUNK_STRIDE}",
            )

            for chunk_index, start in enumerate(starts, start=1):
                actual_frames = min(CHUNK_FRAMES, total_frames - start)
                infer_frames = self._infer_frame_count(actual_frames)
                emit_control(
                    "chunk_start",
                    job_id=job_id,
                    chunk=chunk_index,
                    total_chunks=total_chunks,
                    start_frame=start,
                    actual_frames=actual_frames,
                    infer_frames=infer_frames,
                    marker=(
                        f"VSR_WORKER_V53: chunk_start {chunk_index}/{total_chunks} "
                        f"start={start} actual={actual_frames} infer={infer_frames}"
                    ),
                )

                local_centers = torch.arange(start, start + infer_frames, device="cpu").unsqueeze(1)
                context_offsets = (torch.arange(5, device="cpu") - 2).unsqueeze(0)
                center_indices = torch.clamp(
                    local_centers + context_offsets,
                    min=0,
                    max=audio_feature_wav2vec.shape[0] - 1,
                )
                audio_embeds = audio_feature_wav2vec[center_indices].unsqueeze(0).to(
                    device=self.device,
                    dtype=self.weight_dtype,
                )

                generator = torch.Generator(device=self.device).manual_seed(self.generator_seed + chunk_index - 1)
                input_video, input_video_mask, clip_image = rt.get_image_to_video_latent2(
                    ref_image,
                    None,
                    video_length=infer_frames,
                    sample_size=[sample_h, sample_w],
                )
                if self.coefficients is not None:
                    self.pipeline.transformer.enable_teacache(
                        self.coefficients,
                        8,
                        0.1,
                        num_skip_start_steps=5,
                        offload=False,
                    )

                if torch.cuda.is_available():
                    torch.cuda.reset_peak_memory_stats()
                pipeline_started = time.perf_counter()
                emit_control(
                    "pipeline_start",
                    job_id=job_id,
                    warm=warm,
                    chunk=chunk_index,
                    total_chunks=total_chunks,
                    marker=(
                        f"VSR_WORKER_V53: pipeline_start id={job_id} warm={str(warm).lower()} "
                        f"chunk={chunk_index}/{total_chunks}"
                    ),
                )
                result = self.pipeline(
                    PROMPT,
                    num_frames=infer_frames,
                    negative_prompt=NEGATIVE_PROMPT,
                    audio_embeds=audio_embeds,
                    audio_scale=1.0,
                    ip_mask=None,
                    use_un_ip_mask=False,
                    height=sample_h,
                    width=sample_w,
                    generator=generator,
                    neg_scale=1.0,
                    neg_steps=0,
                    use_dynamic_cfg=False,
                    use_dynamic_acfg=False,
                    guidance_scale=5.0,
                    audio_guidance_scale=2.0,
                    num_inference_steps=8,
                    video=input_video,
                    mask_video=input_video_mask,
                    clip_image=clip_image,
                    cfg_skip_ratio=0.0,
                    shift=5.0,
                    return_dict=False,
                )
                sample = result[0][:, :, :actual_frames].cpu()
                if chunk_index > 1:
                    sample = sample[:, :, 1:]

                pipeline_seconds = time.perf_counter() - pipeline_started
                chunk_pipeline_seconds.append(pipeline_seconds)
                chunk_peak = torch.cuda.max_memory_allocated() / 1024**3 if torch.cuda.is_available() else 0.0
                peak_cuda_gb = max(peak_cuda_gb, chunk_peak)
                emit_control(
                    "pipeline_done",
                    job_id=job_id,
                    warm=warm,
                    chunk=chunk_index,
                    total_chunks=total_chunks,
                    pipeline_seconds=round(pipeline_seconds, 3),
                    peak_cuda_gb=round(chunk_peak, 3),
                    marker=(
                        f"VSR_WORKER_V53: pipeline_done id={job_id} warm={str(warm).lower()} "
                        f"chunk={chunk_index}/{total_chunks} pipeline_seconds={pipeline_seconds:.3f} "
                        f"peak_cuda_gb={chunk_peak:.3f}"
                    ),
                )

                chunk_path = os.path.join(chunk_dir, f"chunk_{chunk_index:03d}.mp4")
                rt.save_videos_grid(sample, chunk_path, fps=FPS)
                chunk_paths.append(chunk_path)
                del sample, result, audio_embeds, input_video, input_video_mask, clip_image
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()

            video_clips = [self.VideoFileClip(path) for path in chunk_paths]
            merged = self.concatenate_videoclips(video_clips, method="chain")
            final_duration = min(audio_clip.duration, total_frames / FPS, merged.duration)
            final_audio = audio_clip.subclipped(0, final_duration)
            final_video = merged.subclipped(0, final_duration).with_audio(final_audio)
            final_video.write_videofile(
                output_video_path,
                codec="libx264",
                audio_codec="aac",
                threads=2,
                logger=None,
            )
            final_video.close()
            final_audio.close()
            merged.close()
            for clip in video_clips:
                clip.close()
            audio_clip.close()

        total_pipeline_seconds = sum(chunk_pipeline_seconds)
        emit_control(
            "job_complete",
            job_id=job_id,
            warm=warm,
            output_path=output_video_path,
            total_frames=total_frames,
            total_chunks=len(chunk_paths),
            pipeline_seconds=round(total_pipeline_seconds, 3),
            peak_cuda_gb=round(peak_cuda_gb, 3),
            marker=(
                f"VSR_WORKER_V53: job_complete id={job_id} warm={str(warm).lower()} "
                f"frames={total_frames} chunks={len(chunk_paths)} pipeline_seconds={total_pipeline_seconds:.3f}"
            ),
        )

    def serve(self):
        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue
            try:
                message = json.loads(line)
            except Exception as exc:
                emit_control("protocol_error", error=f"invalid JSON: {exc}")
                continue

            command = message.get("command")
            if command == "render":
                job_id = str(message.get("job_id") or "")
                try:
                    self.render(message)
                except Exception as exc:
                    traceback.print_exc()
                    emit_control(
                        "job_error",
                        job_id=job_id,
                        error=str(exc),
                        marker=f"VSR_WORKER_V53: job_error id={job_id}",
                    )
            elif command == "shutdown":
                emit_control("shutdown", marker="VSR_WORKER_V53: shutdown")
                return
            else:
                emit_control("protocol_error", error=f"unsupported command: {command}")


def main():
    args = parse_args()
    worker = EchoWorker(args)
    try:
        worker.initialize()
        worker.serve()
    except Exception as exc:
        traceback.print_exc()
        emit_control("fatal", error=str(exc), marker="VSR_WORKER_V53: fatal")
        raise


if __name__ == "__main__":
    main()
