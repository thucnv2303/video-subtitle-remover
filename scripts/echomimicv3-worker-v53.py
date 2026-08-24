import argparse
import json
import math
import os
import sys
import time
import traceback
from pathlib import Path

CONTROL_PREFIX = "VSR_WORKER_JSON "
BENCH_FRAMES = 49
FPS = 25
PROMPT = "A natural person is speaking with realistic facial expressions, subtle head movement, blinking and conversational emotion."
NEGATIVE_PROMPT = "static face, frozen expression, stiff head, bad mouth, deformed face, jitter"


def emit_control(kind, **payload):
    message = {"type": kind, **payload}
    print(CONTROL_PREFIX + json.dumps(message, ensure_ascii=False), flush=True)


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
        self.np = None
        self.Image = None
        self.AudioFileClip = None
        self.VideoFileClip = None
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

        import infer_flash as rt
        import numpy as np
        import torch
        from PIL import Image
        from moviepy import VideoFileClip, AudioFileClip
        from mmgp import offload, profile_type
        from safetensors.torch import load_file

        self.rt = rt
        self.np = np
        self.torch = torch
        self.Image = Image
        self.AudioFileClip = AudioFileClip
        self.VideoFileClip = VideoFileClip
        self.weight_dtype = torch.bfloat16

        emit_control("model_init_start", marker="VSR_WORKER_V53: model_init_start")
        self.audio_encoder = rt.Wav2Vec2Model.from_pretrained(self.args.audio_model, local_files_only=True).to("cpu")
        self.audio_encoder.feature_extractor._freeze_parameters()
        self.wav2vec_feature_extractor = rt.Wav2Vec2FeatureExtractor.from_pretrained(self.args.audio_model, local_files_only=True)

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
        emit_control(
            "model_init_done",
            marker="VSR_WORKER_V53: model_init_done",
            init_seconds=round(init_seconds, 3),
        )
        emit_control("ready", marker="VSR_WORKER_V53: READY", init_seconds=round(init_seconds, 3))

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
        tmp_video_path = os.path.join(output_dir, f"{image_name}_v53_tmp.mp4")
        output_video_path = os.path.join(output_dir, f"{image_name}_v53_benchmark.mp4")

        rt = self.rt
        torch = self.torch

        with torch.no_grad():
            ref_image = self.Image.open(image_path).convert("RGB")
            audio_clip = self.AudioFileClip(audio_path)
            total_frames = max(1, int(math.ceil(audio_clip.duration * FPS)))
            raw_frames = min(BENCH_FRAMES, total_frames)
            infer_frames = raw_frames
            remainder = (infer_frames - 1) % self.vae.config.temporal_compression_ratio
            if remainder:
                infer_frames += self.vae.config.temporal_compression_ratio - remainder
            infer_frames = min(infer_frames, BENCH_FRAMES)
            if infer_frames < 5:
                audio_clip.close()
                raise ValueError("Audio is too short for the 49-frame controlled benchmark")

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
            local_centers = torch.arange(0, infer_frames).unsqueeze(1)
            context_offsets = (torch.arange(5) - 2).unsqueeze(0)
            center_indices = torch.clamp(
                local_centers + context_offsets,
                min=0,
                max=audio_feature_wav2vec.shape[0] - 1,
            )
            audio_embeds = audio_feature_wav2vec[center_indices].unsqueeze(0).to(
                device=self.device,
                dtype=self.weight_dtype,
            )

            generator = torch.Generator(device=self.device).manual_seed(self.generator_seed)
            sample_h, sample_w = rt.get_sample_size(ref_image, [768, 768])
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
                marker=f"VSR_WORKER_V53: pipeline_start id={job_id} warm={str(warm).lower()}",
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
            sample = result[0]
            pipeline_seconds = time.perf_counter() - pipeline_started
            peak_cuda_gb = torch.cuda.max_memory_allocated() / 1024**3 if torch.cuda.is_available() else 0.0
            emit_control(
                "pipeline_done",
                job_id=job_id,
                warm=warm,
                pipeline_seconds=round(pipeline_seconds, 3),
                peak_cuda_gb=round(peak_cuda_gb, 3),
                marker=(
                    f"VSR_WORKER_V53: pipeline_done id={job_id} warm={str(warm).lower()} "
                    f"pipeline_seconds={pipeline_seconds:.3f} peak_cuda_gb={peak_cuda_gb:.3f}"
                ),
            )

            sample = sample[:, :, :raw_frames].cpu()
            rt.save_videos_grid(sample, tmp_video_path, fps=FPS)
            video_clip = self.VideoFileClip(tmp_video_path)
            clip_duration = min(raw_frames / FPS, audio_clip.duration)
            trimmed_audio = audio_clip.subclipped(0, clip_duration)
            video_clip = video_clip.with_audio(trimmed_audio)
            video_clip.write_videofile(
                output_video_path,
                codec="libx264",
                audio_codec="aac",
                threads=2,
                logger=None,
            )
            video_clip.close()
            trimmed_audio.close()
            audio_clip.close()
            if os.path.exists(tmp_video_path):
                os.remove(tmp_video_path)

            del sample, result, audio_embeds, input_video, input_video_mask, clip_image
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        emit_control(
            "job_complete",
            job_id=job_id,
            warm=warm,
            output_path=output_video_path,
            pipeline_seconds=round(pipeline_seconds, 3),
            peak_cuda_gb=round(peak_cuda_gb, 3),
            marker=f"VSR_WORKER_V53: job_complete id={job_id} warm={str(warm).lower()}",
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
