import sys
import os
import asyncio
import threading
import traceback
import json
from typing import List, Optional

# Disable slow online connectivity check for Paddle / PaddleOCR
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
os.environ["PADDLE_DISABLE_TELEMETRY"] = "1"

# Fix Windows console encoding cleanly without closing underlying buffer
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn

# Add the cloned repo to path
REF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "video-subtitle-remover-ref")
sys.path.insert(0, REF_DIR)

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from backend.main import SubtitleRemover
    from backend.config import config
    HAS_BACKEND = True
except ImportError as e:
    print(f"Warning: Could not import backend: {e}")
    HAS_BACKEND = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
job_queue = []
jobs = {}
current_job_id = None
worker_thread = None
is_cancelled = False
subtitle_remover_instance = None
latest_preview_frame = None
active_websockets: List[WebSocket] = []
event_loop = None


class JobRequest(BaseModel):
    input_path: str
    output_path: str
    subtitle_areas: Optional[List[List[int]]] = None
    inpaint_mode: str = "sttn-auto"
    extract_srt: bool = False
    ai_rewrite: bool = False
    ai_config: Optional[dict] = None
    tts_voice: str = "none"
    tts_ref_audio: Optional[str] = None
    tts_bg_volume: int = 10
    frame_range: Optional[dict] = None  # {"start": int, "end": int}
    mask_mode: str = "box"  # "box" | "tight" | "soft"
    regions: Optional[List[dict]] = None  # Danh sách các vùng thủ công [{xmin, xmax, ymin, ymax, startFrame, endFrame, maskMode}]
    asr_fallback: bool = False   # Run Whisper in parallel; use as fallback if no text detected
    asr_language: str = "vi"     # Language for Whisper transcription


class ProcessBatchRequest(BaseModel):
    jobs: List[JobRequest]


class DetectTextRequest(BaseModel):
    video_path: str
    frame_number: int


def progress_listener(progress_total, is_finished):
    """Called by SubtitleRemover during inpainting. Never marks job as fully done.
    The job is only finalized after ALL post-processing (SRT, AI, TTS, hardsub) completes."""
    global current_job_id
    try:
        if not current_job_id or current_job_id not in jobs: return
        job = jobs[current_job_id]
        has_post = bool(
            job.get("extract_srt") or
            job.get("ai_rewrite") or
            (job.get("tts_voice") and job.get("tts_voice") != "none")
        )
        if has_post:
            inpaint_pct = max(1, min(int(progress_total * 0.80), 80))
        else:
            inpaint_pct = max(1, min(int(progress_total), 99))
        job["progress"] = inpaint_pct
        
        # Broadcast to websockets from background thread
        msg = {
            "job_id": current_job_id,
            "progress": inpaint_pct,
            "status": "processing",
            "is_finished": False
        }
        if subtitle_remover_instance and hasattr(subtitle_remover_instance, 'frame_count') and subtitle_remover_instance.frame_count > 0:
            frame = int((progress_total / 100) * subtitle_remover_instance.frame_count)
            msg["frame"] = min(frame, subtitle_remover_instance.frame_count - 1)
            
        if event_loop:
            asyncio.run_coroutine_threadsafe(broadcast_progress(msg), event_loop)
    except Exception as e:
        print(f'Progress listener error: {e}', flush=True)


async def broadcast_progress(msg: dict):
    for ws in active_websockets.copy():
        try:
            await ws.send_json(msg)
        except Exception:
            active_websockets.remove(ws)


# ─── ASR / Whisper helpers ────────────────────────────────────────────────

def extract_audio_for_asr(video_path: str) -> str:
    """Extract audio track from video to a temp WAV file for Whisper."""
    import tempfile, subprocess
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp.close()
    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
        tmp.name
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f'ffmpeg audio extract failed: {result.stderr.decode(errors="replace")}')
    return tmp.name


def generate_srt_from_whisper(segments, output_video_path: str) -> str:
    """Convert Whisper segments to SRT file alongside the output video."""
    import datetime
    def fmt(seconds: float) -> str:
        td = datetime.timedelta(seconds=seconds)
        total_s = int(td.total_seconds())
        ms = int((td.total_seconds() - total_s) * 1000)
        h, m, s = total_s // 3600, (total_s % 3600) // 60, total_s % 60
        return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

    srt_path = output_video_path.rsplit('.', 1)[0] + '.srt'
    lines = []
    for i, seg in enumerate(segments, 1):
        text = seg.text.strip()
        if not text:
            continue
        lines.append(f'{i}\n{fmt(seg.start)} --> {fmt(seg.end)}\n{text}\n')
    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'[ASR] SRT saved: {srt_path} ({len(lines)} entries)', flush=True)
    return srt_path


def worker_loop():
    global current_job_id, is_cancelled, subtitle_remover_instance, latest_preview_frame
    import time
    while True:
        if not job_queue:
            time.sleep(1)
            continue
            
        current_job_id = job_queue.pop(0)
        job = jobs[current_job_id]
        job["status"] = "processing"
        is_cancelled = False
        
        if not HAS_BACKEND:
            job["status"] = "error: backend not available"
            continue

        # Bug #8 fix: capture stdout/stderr BEFORE the try block so `finally`
        # can always restore them even if an early exception occurs inside try.
        import io as _io
        old_stdout = sys.stdout
        old_stderr = sys.stderr

        try:
            from backend.tools.constant import InpaintMode
        except ImportError:
            pass
        
        try:
            latest_preview_frame = None
            
            # Set the inpaint mode in global config BEFORE creating SubtitleRemover
            mode_map = {
                "sttn-auto": InpaintMode.STTN_AUTO,
                "sttn-det": InpaintMode.STTN_DET,
                "lama": InpaintMode.LAMA,
                "propainter": InpaintMode.PROPAINTER,
                "opencv": InpaintMode.OPENCV,
            }
            if job["inpaint_mode"] in mode_map:
                config.set(config.inpaintMode, mode_map[job["inpaint_mode"]])
            
            # Increase subtitle area deviation for better multi-line subtitle removal
            config.set(config.subtitleAreaDeviationPixel, 15)
            config.set(config.subtitleAreaYAxisDifferencePixel, 30)
            
            
            # Monkey-patch SubtitleRemover.run to skip inpainting if requested
            _original_run = getattr(SubtitleRemover, '_original_run', getattr(SubtitleRemover, 'run', None))
            if _original_run and not hasattr(SubtitleRemover, '_patched'):
                SubtitleRemover._original_run = _original_run
                def patched_run(self):
                    if getattr(self, 'skip_inpaint', False):
                        from backend.main import SubtitleDetect, expand_frame_ranges, config
                        # Only extract text and run LLM/TTS
                        print('[Pipeline] Running OCR and AI only, skipping inpainting', flush=True)
                        if self.is_picture: return
                        sub_detector = SubtitleDetect(self.video_path, self.sub_areas)
                        sub_list = sub_detector.find_subtitle_frame_no(sub_remover=self)
                        if len(sub_list) == 0:
                            raise Exception(f"Không tìm thấy phụ đề trong video.")
                        continuous_frame_no_list = sub_detector.find_continuous_ranges_with_same_mask(sub_list)
                        continuous_frame_no_list = expand_frame_ranges(continuous_frame_no_list, config.subtitleTimelineBackwardFrameCount.value, config.subtitleTimelineForwardFrameCount.value)
                        continuous_frame_no_list = sub_detector.filter_and_merge_intervals(continuous_frame_no_list, config.sttnReferenceLength.value)
                        
                        self.check_and_launch_parallel_post_processing()
                        if getattr(self, 'parallel_tts_future', None):
                            self.parallel_tts_future.result()
                        
                        self.progress_total = 100
                        self.isFinished = True
                        self.notify_progress_listeners()
                        return
                    else:
                        return SubtitleRemover._original_run(self)
                SubtitleRemover.run = patched_run
                SubtitleRemover._patched = True
                
            sr = SubtitleRemover(job["input_path"], gui_mode=True)
            sr.skip_inpaint = job.get("skip_inpaint", False)
            
            # Hook update_preview_with_comp for real-time preview during inpainting
            last_comp_preview_time = [0.0]
            def _live_preview_comp(orig_frame, comp_frame):
                global latest_preview_frame
                if is_cancelled: return
                now = time.time()
                if now - last_comp_preview_time[0] < 0.1:
                    return
                last_comp_preview_time[0] = now
                try:
                    target = comp_frame if comp_frame is not None else orig_frame
                    if target is not None:
                        _, buffer = cv2.imencode('.jpg', target, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        latest_preview_frame = buffer.tobytes()
                except Exception:
                    pass
            sr.update_preview_with_comp = _live_preview_comp

            sr.extract_srt = job.get("extract_srt", False)
            sr.ai_rewrite = job.get("ai_rewrite", False)
            sr.ai_config = job.get("ai_config", None)
            sr.tts_voice = job.get("tts_voice", "none")
            sr.tts_ref_audio = job.get("tts_ref_audio", None)
            sr.tts_bg_volume = job.get("tts_bg_volume", 10)
            sr.asr_fallback = job.get("asr_fallback", False)
            sr.asr_language = job.get("asr_language", "vi")
            sr.remove_vocal = job.get("remove_vocal", False)

            # Wire is_cancelled flag into SubtitleRemover so cancel actually stops processing.
            def _check_cancelled():
                if is_cancelled:
                    sr.is_stop_run = True
            sr._cancel_check = _check_cancelled

            original_writer = sr.video_writer if hasattr(sr, 'video_writer') and sr.video_writer else None
            
            # cv2.VideoWriter.write is a C++ method - cannot be monkey-patched directly.
            # Use a wrapper object that captures the frame for preview, then delegates to original.
            class VideoWriterWithPreview:
                def __init__(self, writer):
                    self._writer = writer
                    self._last_time = 0.0
                def write(self, frame):
                    global latest_preview_frame
                    if is_cancelled:
                        return
                    now = time.time()
                    if now - self._last_time >= 0.1:
                        self._last_time = now
                        try:
                            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                            latest_preview_frame = buffer.tobytes()
                        except Exception:
                            pass
                    if self._writer:
                        self._writer.write(frame)
                def release(self):
                    if self._writer:
                        self._writer.release()
                def __getattr__(self, name):
                    if self._writer:
                        return getattr(self._writer, name)
                    raise AttributeError(name)

            if original_writer is not None:
                sr.video_writer = VideoWriterWithPreview(original_writer)

            
            # Monkey-patch SubtitleDetect for live preview during Subtitle Finding phase
            try:
                from backend.tools.subtitle_detect import SubtitleDetect
                if not hasattr(SubtitleDetect, '_original_detect_subtitle'):
                    SubtitleDetect._original_detect_subtitle = SubtitleDetect.detect_subtitle
                    
                def intercept_detect_subtitle(self_detect, frame):
                    global latest_preview_frame
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    latest_preview_frame = buffer.tobytes()
                    return SubtitleDetect._original_detect_subtitle(self_detect, frame)
                    
                SubtitleDetect.detect_subtitle = intercept_detect_subtitle
                if not hasattr(SubtitleDetect, '_orig_find_sub_frame_no'):
                    SubtitleDetect._orig_find_sub_frame_no = SubtitleDetect.find_subtitle_frame_no
                def _custom_find_sub_frame_no(self_det, sub_remover=None):
                    if sub_remover and getattr(sub_remover, 'custom_sub_list', None):
                        print(f'[CustomRegions] SubtitleDetect using {len(sub_remover.custom_sub_list)} predefined frames in single pass', flush=True)
                        return sub_remover.custom_sub_list
                    return SubtitleDetect._orig_find_sub_frame_no(self_det, sub_remover=sub_remover)
                SubtitleDetect.find_subtitle_frame_no = _custom_find_sub_frame_no
            except ImportError:
                pass

            # If job has custom/manual regions, build custom_sub_list for 1 single unified pass
            if job.get("regions"):
                custom_sub_list = {}
                for r in job["regions"]:
                    xmin = int(r.get("xmin", 0))
                    xmax = int(r.get("xmax", 0))
                    ymin = int(r.get("ymin", 0))
                    ymax = int(r.get("ymax", 0))
                    sf = int(r.get("startFrame", 0))
                    ef = int(r.get("endFrame", sr.frame_count - 1))
                    box = (xmin, xmax, ymin, ymax)
                    for f in range(sf, ef + 1):
                        custom_sub_list.setdefault(f, []).append(box)
                sr.custom_sub_list = custom_sub_list
                print(f'[CustomRegions] Loaded {len(job["regions"])} regions covering {len(custom_sub_list)} frames for single-pass inpaint.', flush=True)
                
            subtitle_remover_instance = sr
            if job["subtitle_areas"]:
                sr.sub_areas = [tuple(area) for area in job["subtitle_areas"]]

            # Validate and fallback output_path if the target drive or dir is inaccessible
            out_target = job.get("output_path") or ""
            out_dir = os.path.dirname(os.path.abspath(out_target)) if out_target else ""
            try:
                if out_dir:
                    os.makedirs(out_dir, exist_ok=True)
                sr.video_out_path = out_target
            except Exception:
                fallback_dir = os.path.dirname(os.path.abspath(job["input_path"]))
                filename = os.path.basename(out_target) if out_target else f"{sr.vd_name}_no_sub.mp4"
                safe_out = os.path.join(fallback_dir, filename)
                try:
                    os.makedirs(fallback_dir, exist_ok=True)
                except Exception:
                    pass
                job["output_path"] = safe_out
                sr.video_out_path = safe_out
                print(f'[Path] Target output dir {out_dir} not accessible, fell back to {safe_out}', flush=True)

            # Mask mode: pass to SubtitleRemover for tight/soft mask generation
            sr.mask_mode = job.get("mask_mode", "box")
            
            # Wire stage_progress_callback so generate_srt/TTS/hardsub push real progress
            
            def stage_progress_callback(msg: str, progress_total: float):
                # For skip_inpaint mode, progress_total might just jump to 100
                inpaint_pct = min(int(progress_total * 0.80), 80)
                # We rely on worker_loop to broadcast the srt/ai ready!
                if event_loop:
                    try:
                        asyncio.run_coroutine_threadsafe(
                            broadcast_progress({"job_id": current_job_id, "progress": inpaint_pct, "status": "processing", "is_finished": False, "stage": msg}),
                            event_loop
                        )
                    except Exception:
                        pass
                print(f'[Stage] {inpaint_pct}% - {msg}', flush=True)
            sr.stage_progress_callback = stage_progress_callback


            # Frame range support: limit processing to specific frame range
            frame_range = job.get("frame_range")

            if frame_range and "start" in frame_range and "end" in frame_range:
                sr.ab_sections = [range(int(frame_range["start"]), int(frame_range["end"]) + 1)]
                print(f'Frame range set: {frame_range["start"]}-{frame_range["end"]}', flush=True)
            
            sr.add_progress_listener(progress_listener)

            print(f'[Inpaint] Đang khởi động model {job.get("inpaint_mode","sttn")}... (lần đầu có thể mất 30-60 giây)', flush=True)
            job["status"] = "processing"

            # Heartbeat: send periodic progress updates while model loads (progress stays at 0)
            import time as _time
            heartbeat_stop = threading.Event()
            def _heartbeat():
                t0 = _time.time()
                dots = 0
                while not heartbeat_stop.is_set():
                    _time.sleep(4)
                    if heartbeat_stop.is_set():
                        break
                    # Bug #7 fix: check cancellation in heartbeat too
                    if is_cancelled:
                        sr.is_stop_run = True
                        break
                    elapsed = int(_time.time() - t0)
                    pct = job.get("progress", 0)
                    dots = (dots + 1) % 4
                    dot_str = '.' * (dots + 1)
                    print(f'[Inpaint] Đang xử lý{dot_str} ({elapsed}s trôi qua, tiến độ: {pct}%)', flush=True)
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(
                                broadcast_progress({
                                    "job_id": current_job_id,
                                    "progress": pct,
                                    "status": "processing",
                                    "is_finished": False
                                }),
                                event_loop
                            )
                        except Exception:
                            pass
            hb = threading.Thread(target=_heartbeat, daemon=True)
            hb.start()

            sr.run()

            # Poll while running
            sent_srt = False
            sent_ai = False
            while not sr.isFinished:
                if not sent_srt and hasattr(sr, 'original_srt_content') and sr.original_srt_content:
                    sent_srt = True
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(broadcast_progress({"job_id": current_job_id, "srt_ready": sr.original_srt_content}), event_loop)
                        except Exception: pass
                if not sent_ai and hasattr(sr, 'ai_srt_content') and sr.ai_srt_content:
                    sent_ai = True
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(broadcast_progress({"job_id": current_job_id, "ai_ready": sr.ai_srt_content}), event_loop)
                        except Exception: pass
                time.sleep(0.5)

            heartbeat_stop.set()
            print('[Inpaint] Hoàn tất!', flush=True)

            # If cancelled, skip post-processing and mark as idle
            if is_cancelled:
                job["status"] = "idle"
                job["progress"] = 0
                print('[Job] Job đã bị hủy.', flush=True)
                if event_loop:
                    try:
                        asyncio.run_coroutine_threadsafe(
                            broadcast_progress({"job_id": current_job_id, "status": "idle", "is_finished": True, "progress": 0}),
                            event_loop
                        )
                    except Exception: pass
                continue
            
            # Post-processing stage helper
            def send_stage_progress(pct, msg_text):
                job["progress"] = pct
                if event_loop:
                    try:
                        asyncio.run_coroutine_threadsafe(
                            broadcast_progress({"job_id": current_job_id, "progress": pct, "status": "processing", "is_finished": False, "stage": msg_text}),
                            event_loop
                        )
                    except Exception: pass
                print(f'[Post] {pct}% - {msg_text}', flush=True)
            
            # Stage 1: SRT extraction (80%)
            send_stage_progress(80, 'Đang trích xuất phụ đề...')
            
            # Send extracted SRT to frontend if available
            if event_loop and hasattr(sr, 'original_srt_content') and sr.original_srt_content:
                try:
                    asyncio.run_coroutine_threadsafe(
                        broadcast_progress({"job_id": current_job_id, "srt_ready": sr.original_srt_content}),
                        event_loop
                    )
                except Exception: pass
            
            # Send AI rewritten SRT to frontend if available
            if event_loop and hasattr(sr, 'ai_srt_content') and sr.ai_srt_content:
                try:
                    asyncio.run_coroutine_threadsafe(
                        broadcast_progress({"job_id": current_job_id, "ai_ready": sr.ai_srt_content}),
                        event_loop
                    )
                except Exception: pass

            # ── ALL post-processing done: now mark job as truly finished ──
            final_output = getattr(sr, 'video_out_path', job.get('output_path', ''))
            job["status"] = "finished"
            job["progress"] = 100
            job["is_finished"] = True
            job["output_path"] = final_output
            print(f'[Job] Hoàn tất toàn bộ pipeline. Output: {final_output}', flush=True)
            if event_loop:
                try:
                    asyncio.run_coroutine_threadsafe(
                        broadcast_progress({
                            "job_id": current_job_id,
                            "progress": 100,
                            "status": "finished",
                            "is_finished": True,
                            "output_path": final_output
                        }),
                        event_loop
                    )
                except Exception as e:
                    print(f'Final broadcast error: {e}', flush=True)
            
        except Exception as e:
            traceback.print_exc()
            job["status"] = f"error: {str(e)}"
            if event_loop:
                asyncio.run_coroutine_threadsafe(
                    broadcast_progress({"job_id": current_job_id, "status": job["status"], "error": str(e), "is_finished": True}),
                    event_loop
                )
        finally:
            subtitle_remover_instance = None
            current_job_id = None
            # Bug #8 fix: old_stdout/old_stderr are always defined (captured before try)
            sys.stdout = old_stdout
            sys.stderr = old_stderr


@app.get("/api/asr/status")
def asr_status():
    """Check if faster-whisper is available."""
    try:
        import faster_whisper
        return {"available": True, "version": getattr(faster_whisper, '__version__', 'unknown')}
    except ImportError:
        return {"available": False, "error": "faster-whisper not installed"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/gpu-info")
def gpu_info():
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        return {
            "gpu_available": gpu_available,
            "gpu_name": torch.cuda.get_device_name(0) if gpu_available else "CPU Only",
            "vram_total": f"{round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 1)} GB" if gpu_available else "0",
            "cuda_version": torch.version.cuda if gpu_available else None
        }
    except Exception as e:
        print("GPU Info Error:", repr(e))
        return {"gpu_available": False, "gpu_name": "CPU Only", "vram_total": "0", "cuda_version": None}


@app.post("/api/process")
def start_process(req: ProcessBatchRequest):
    global worker_thread
    
    added_jobs = []
    for j in req.jobs:
        import uuid
        job_id = str(uuid.uuid4())
        jobs[job_id] = {
            "id": job_id,
            "input_path": j.input_path,
            "output_path": j.output_path,
            "subtitle_areas": j.subtitle_areas or [],
            "regions": j.regions or [],
            "inpaint_mode": j.inpaint_mode,
            "mask_mode": j.mask_mode,
            "frame_range": j.frame_range,
            "extract_srt": j.extract_srt,
            "asr_fallback": j.asr_fallback,
            "asr_language": j.asr_language,
            "ai_rewrite": j.ai_rewrite,
            "ai_config": j.ai_config,
            "tts_voice": j.tts_voice,
            "tts_ref_audio": j.tts_ref_audio,
            "tts_bg_volume": j.tts_bg_volume,
            "status": "pending",
            "progress": 0,
            "is_finished": False,
            "error": None
        }
        job_queue.append(job_id)
        added_jobs.append(job_id)
        
    if worker_thread is None or not worker_thread.is_alive():
        worker_thread = threading.Thread(target=worker_loop)
        worker_thread.daemon = True
        worker_thread.start()
        
    return {"status": "started", "jobs": added_jobs}


@app.get("/api/status")
def get_status():
    return {
        "jobs": jobs,
        "queue": job_queue,
        "current_job_id": current_job_id
    }


@app.post("/api/cancel")
def cancel_process():
    """Bug #7 fix: actually set the is_cancelled flag so worker_loop stops sr.run()

            # Poll while running
            sent_srt = False
            sent_ai = False
            while not sr.isFinished:
                if not sent_srt and hasattr(sr, 'original_srt_content') and sr.original_srt_content:
                    sent_srt = True
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(broadcast_progress({"job_id": current_job_id, "srt_ready": sr.original_srt_content}), event_loop)
                        except Exception: pass
                if not sent_ai and hasattr(sr, 'ai_srt_content') and sr.ai_srt_content:
                    sent_ai = True
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(broadcast_progress({"job_id": current_job_id, "ai_ready": sr.ai_srt_content}), event_loop)
                        except Exception: pass
                time.sleep(0.5)
"""
    global is_cancelled
    is_cancelled = True
    # Also set is_stop_run on the running SubtitleRemover instance if available
    if subtitle_remover_instance is not None:
        try:
            subtitle_remover_instance.is_stop_run = True
        except Exception:
            pass
    # Mark current job as cancelling so frontend can reflect immediately
    if current_job_id and current_job_id in jobs:
        jobs[current_job_id]["status"] = "cancelling"
    return {"status": "cancel_requested"}


@app.post("/api/detect-text")
def detect_text(req: DetectTextRequest):
    cap = cv2.VideoCapture(req.video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, req.frame_number)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise HTTPException(status_code=400, detail="Could not read frame")
        
    try:
        # Create dummy instance of SubtitleDetect to get regions
        detector = SubtitleDetect(req.video_path, [])
        sub_list = detector.detect_subtitle(frame)
        return {"boxes": sub_list}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/frame/{frame_number}")
def get_frame(frame_number: int, path: str = Query(...)):
    if not cv2:
        raise HTTPException(status_code=500, detail="OpenCV not available")
    
    import os
    if not os.path.exists(path):
        print(f"Error in get_frame: File does not exist: {path}")
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    cap = cv2.VideoCapture(path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print(f"Error in get_frame: Could not read frame {frame_number} from {path}")
        raise HTTPException(status_code=400, detail="Could not read frame")
        
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return Response(content=buffer.tobytes(), media_type="image/jpeg")


@app.get("/api/preview")
def get_preview():
    global latest_preview_frame
    if latest_preview_frame is not None:
        return Response(content=latest_preview_frame, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="No preview available")


@app.get("/api/video-info")
def video_info(path: str = Query(...)):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found")
        
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    duration = total_frames / fps if fps > 0 else 0
    
    return {
        "fps": fps,
        "width": width,
        "height": height,
        "total_frames": total_frames,
        "duration": duration
    }

# ─── TTS API Endpoints ───────────────────────────────
@app.get("/api/tts/status")
def tts_status():
    """Check TTS engine availability"""
    try:
        from tts_engine import get_status
        return get_status()
    except ImportError:
        return {"available": False, "model_loaded": False, "error": "tts_engine not found"}


class TTSRequest(BaseModel):
    text: str
    ref_audio_path: Optional[str] = None
    language: str = "vi"
    output_path: Optional[str] = None
    voice_name: Optional[str] = None  # Edge TTS voice name e.g. vi-VN-NamMinhNeural


class TTSSrtRequest(BaseModel):
    srt_path: str
    ref_audio_path: Optional[str] = None
    language: str = "vi"
    output_dir: Optional[str] = None


@app.post("/api/tts/generate")
def tts_generate(req: TTSRequest):
    """Generate speech from text - supports OmniVoice (ref_audio) or Edge TTS (voice_name)"""
    import tempfile, os
    
    # If voice_name provided and no ref_audio → use Edge TTS
    if req.voice_name and req.voice_name not in ('none', 'default') and not req.ref_audio_path:
        try:
            import asyncio, threading, tempfile, os
            import edge_tts
            out_path = req.output_path or os.path.join(
                tempfile.gettempdir(), f'edge_tts_{abs(hash(req.text + req.voice_name))}.mp3'
            )
            error_holder = []

            def run_in_thread():
                async def _gen():
                    communicate = edge_tts.Communicate(req.text, req.voice_name)
                    await communicate.save(out_path)
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(_gen())
                except Exception as e:
                    error_holder.append(str(e))
                finally:
                    loop.close()

            t = threading.Thread(target=run_in_thread)
            t.start()
            t.join(timeout=30)

            if error_holder:
                return {"status": "error", "error": f"Edge TTS: {error_holder[0]}"}
            if os.path.exists(out_path):
                return {"status": "ok", "audio_path": out_path}
            return {"status": "error", "error": "Edge TTS: file not created"}
        except ImportError:
            return {"status": "error", "error": "edge-tts chưa được cài. Chạy: pip install edge-tts"}
        except Exception as e:
            return {"status": "error", "error": f"Edge TTS error: {str(e)}"}
    
    # Otherwise use OmniVoice
    try:
        from tts_engine import generate_speech
        result = generate_speech(
            text=req.text,
            ref_audio_path=req.ref_audio_path,
            output_path=req.output_path,
            language=req.language
        )
        if result:
            return {"status": "ok", "audio_path": result}
        else:
            return {"status": "error", "error": "Failed to generate speech. Is OmniVoice installed?"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/api/tts/from-srt")
def tts_from_srt(req: TTSSrtRequest):
    """Generate voice for all SRT segments"""
    try:
        from tts_engine import generate_from_srt
        results = generate_from_srt(
            srt_path=req.srt_path,
            ref_audio_path=req.ref_audio_path,
            output_dir=req.output_dir,
            language=req.language
        )
        return {"status": "ok", "segments": results, "count": len(results)}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ─── Video Analysis Endpoint ────────────
class AnalyzeVideoReq(BaseModel):
    video_path: str
    ai_config: dict
    prompt: str

@app.post("/api/analyze-video")
def api_analyze_video(req: AnalyzeVideoReq):
    import os, tempfile, json, urllib.request, urllib.error
    import subprocess
    try:
        if not os.path.exists(req.video_path):
            return {"status": "error", "error": "Video file not found"}
            
        # 1. Extract audio
        fd, temp_audio = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        
        cmd = ['ffmpeg', '-y', '-i', req.video_path, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', temp_audio]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if not os.path.exists(temp_audio) or os.path.getsize(temp_audio) == 0:
            return {"status": "error", "error": "Failed to extract audio from video"}

        # 2. Run faster_whisper
        from faster_whisper import WhisperModel
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = WhisperModel('large-v3-turbo', device=device, compute_type='float16' if device == 'cuda' else 'int8')
        segments, info = model.transcribe(temp_audio, beam_size=5, vad_filter=True)
        
        transcript = ""
        for seg in segments:
            transcript += seg.text + "\n"
            
        os.remove(temp_audio)
        
        if not transcript.strip():
            return {"status": "error", "error": "Không tìm thấy giọng nói nào trong video để phân tích."}
        
        # 3. Call LLM
        prompt = req.prompt
        ai_config = req.ai_config
        provider = ai_config.get('provider', 'ollama')
        api_keys = ai_config.get('api_keys', [])
        if not api_keys:
            api_keys = [ai_config.get('api_key', '')]
        endpoint = ai_config.get('endpoint', '')
        model_name = ai_config.get('model', '')
        
        messages = [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': transcript}]
        
        success = False
        last_error = 'Vui lòng cấu hình API Key cho AI (Gemini/Ollama) trong phần Cài đặt.'
        result_text = ''
        
        for key_or_model in api_keys:
            if not key_or_model: continue
            try:
                if provider == 'gemini':
                    gm = model_name or 'gemini-2.5-flash'
                    url = f'https://generativelanguage.googleapis.com/v1beta/models/{gm}:generateContent?key={key_or_model}'
                    data = json.dumps({'contents': [{'parts': [{'text': prompt + '\n\n' + transcript}]}]}).encode('utf-8')
                    request = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                    res = json.loads(urllib.request.urlopen(request, timeout=60).read().decode('utf-8'))
                    result_text = res['candidates'][0]['content']['parts'][0]['text']
                elif provider == 'deepseek':
                    dm = model_name or 'deepseek-chat'
                    url = 'https://api.deepseek.com/chat/completions'
                    data = json.dumps({'model': dm, 'messages': messages}).encode('utf-8')
                    request = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res = json.loads(urllib.request.urlopen(request, timeout=60).read().decode('utf-8'))
                    result_text = res['choices'][0]['message']['content']
                elif provider == 'ollama':
                    url = endpoint or 'http://localhost:11434/api/chat'
                    data = json.dumps({'model': key_or_model, 'messages': messages, 'stream': False}).encode('utf-8')
                    request = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                    res = json.loads(urllib.request.urlopen(request, timeout=120).read().decode('utf-8'))
                    result_text = res['message']['content']
                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                    
                success = True
                break
            except urllib.error.HTTPError as e:
                body = e.read().decode('utf-8')
                last_error = f'HTTP {e.code}: {body}'
                continue
            except Exception as e:
                last_error = str(e)
                continue
                
        if not success:
            return {"status": "error", "error": f"LLM Error: {last_error}", "transcript": transcript}
            
        return {"status": "ok", "transcript": transcript, "analysis": result_text}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

# ─── P1 Extraction Endpoint ────────────
class ExtractTextP1Req(BaseModel):
    job_id: str
    video_path: str
    extraction_mode: str = "asr"
    language: str = "zh"

@app.post("/api/p1/extract-text")
def api_p1_extract_text(req: ExtractTextP1Req):
    """
    Dedicated Pipeline 1 extraction route (ASR only).
    """
    if req.extraction_mode != "asr":
        return {
            "job_id": req.job_id,
            "status": "error",
            "error": "Only 'asr' extraction_mode is supported in this phase.",
            "warnings": []
        }
    
    # Use existing ASR helper
    existing_req = ExtractSrtReq(
        video_path=req.video_path,
        asr_fallback=True,
        asr_language=req.language
    )
    
    result = api_extract_srt(existing_req)
    
    if result.get("status") == "error":
        return {
            "job_id": req.job_id,
            "status": "error",
            "error": result.get("error", "Unknown error during ASR extraction"),
            "warnings": []
        }
        
    return {
        "job_id": req.job_id,
        "status": "ok",
        "extraction_mode_requested": req.extraction_mode,
        "extraction_mode_used": "asr",
        "srt_content": result.get("srt_content", ""),
        "plain_text": "", # Omitted for now, can be parsed from SRT later if needed
        "warnings": []
    }

# ─── AI Rewrite Endpoint ────────────
class ExtractSrtReq(BaseModel):
    video_path: str
    asr_fallback: bool = True   # dùng Whisper ASR (đây là mode chính cho Pipeline 1)
    asr_language: str = "vi"

@app.post("/api/extract-srt")
def api_extract_srt(req: ExtractSrtReq):
    """
    Trích xuất SRT từ video bằng Whisper ASR.
    Dùng cho Pipeline 1 (AI Analysis) — không cần inpaint.
    Trả về SRT hợp lệ với timestamps.
    """
    import os, tempfile, subprocess, datetime
    temp_audio = None
    try:
        if not os.path.exists(req.video_path):
            return {"status": "error", "error": "Video file not found"}

        # Trích xuất audio
        fd, temp_audio = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        cmd = [
            'ffmpeg', '-y', '-i', req.video_path,
            '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
            temp_audio
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        if result.returncode != 0 or not os.path.exists(temp_audio) or os.path.getsize(temp_audio) == 0:
            return {"status": "error", "error": "Không thể trích xuất audio từ video"}

        # Chạy Whisper ASR
        try:
            from faster_whisper import WhisperModel
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            model = WhisperModel('large-v3-turbo', device=device,
                                 compute_type='float16' if device == 'cuda' else 'int8')
            lang = None if req.asr_language == 'auto' else req.asr_language
            segments, info = model.transcribe(temp_audio, beam_size=5, vad_filter=True, language=lang)
        except Exception as e:
            return {"status": "error", "error": f"Whisper ASR lỗi: {e}"}

        def _fmt(seconds: float) -> str:
            td = datetime.timedelta(seconds=seconds)
            total_s = int(td.total_seconds())
            ms = int((td.total_seconds() - total_s) * 1000)
            h, m, s = total_s // 3600, (total_s % 3600) // 60, total_s % 60
            return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

        srt_lines = []
        line_count = 0
        for i, seg in enumerate(segments, 1):
            if seg.text.strip():
                srt_lines.append(f"{i}\n{_fmt(seg.start)} --> {_fmt(seg.end)}\n{seg.text.strip()}\n")
                line_count += 1

        if not srt_lines:
            return {"status": "ok", "srt_content": "", "line_count": 0,
                    "message": "Không phát hiện giọng nói trong video"}

        srt_content = "\n".join(srt_lines)
        return {"status": "ok", "srt_content": srt_content, "line_count": line_count,
                "detected_language": info.language if hasattr(info, 'language') else req.asr_language}

    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        if temp_audio is not None and os.path.exists(temp_audio):
            try:
                os.remove(temp_audio)
            except OSError:
                pass


class AIRewriteReq(BaseModel):
    srt_content: str
    ai_config: dict

@app.post("/api/ai-rewrite")
def api_ai_rewrite(req: AIRewriteReq):
    """Bug #9 fix: avoid SubtitleRemover('') by calling run_llm_rewrite logic directly."""
    import tempfile, os, json, urllib.request, urllib.error
    try:
        # Write SRT content to a temp file
        fd, temp_srt = tempfile.mkstemp(suffix=".srt")
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(req.srt_content)

        ai_config = req.ai_config
        provider = ai_config.get('provider', 'gemini')
        api_keys = ai_config.get('api_keys', [])
        if not api_keys:
            api_keys = [ai_config.get('api_key', '')]
        endpoint = ai_config.get('endpoint', '')
        prompt = ai_config.get('prompt', 'Hãy dịch các phụ đề sau sang Tiếng Việt. Giữ nguyên định dạng SRT.')
        model = ai_config.get('model', '')

        # Đếm số segment gốc và tổng số từ để AI không viết dài hơn
        import re as _re
        orig_segments = [b for b in _re.split(r'\n\n+', req.srt_content.strip()) if '-->' in b]
        orig_word_count = len(req.srt_content.split())

        # Inject constraint vào prompt: giữ ĐÚNG số segment, không thêm nội dung mới
        length_constraint = (
            f"\n\nQUAN TRỌNG - GIỚI HẠN ĐỘ DÀI:"
            f"\n- Bản gốc có {len(orig_segments)} segment phụ đề."
            f"\n- Output phải có ĐÚNG {len(orig_segments)} segment, không thêm không bớt."
            f"\n- Mỗi segment chỉ được có 1-2 câu ngắn, KHÔNG được mở rộng thêm ý."
            f"\n- Giữ nguyên định dạng SRT với số thứ tự và timestamp y chang bản gốc."
            f"\n- Tổng số từ output KHÔNG được vượt quá {int(orig_word_count * 1.3)} từ."
        )
        effective_prompt = prompt + length_constraint

        messages = [
            {"role": "system", "content": effective_prompt},
            {"role": "user", "content": req.srt_content}
        ]

        success = False
        last_error = "No API key configured"
        result_text = req.srt_content

        for key_or_model in api_keys:
            if not key_or_model:
                continue
            try:
                if provider == 'gemini':
                    gemini_model = model or "gemini-2.5-flash"
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={key_or_model}"
                    data = json.dumps({
                        "contents": [{"parts": [{"text": effective_prompt + "\n\n" + req.srt_content}]}]
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['candidates'][0]['content']['parts'][0]['text']
                elif provider == 'deepseek':
                    ds_model = model or "deepseek-chat"
                    url = "https://api.deepseek.com/chat/completions"
                    data = json.dumps({"model": ds_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'ollama':
                    url = endpoint or "http://localhost:11434/api/chat"
                    data = json.dumps({"model": key_or_model, "messages": messages, "stream": False}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=120).read().decode('utf-8'))
                    result_text = res_data['message']['content']
                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']

                elif provider == 'openai':
                    oa_model = model or "gpt-4o-mini"
                    url = "https://api.openai.com/v1/chat/completions"
                    data = json.dumps({"model": oa_model, "messages": messages}).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['choices'][0]['message']['content']
                elif provider == 'anthropic':
                    ant_model = model or "claude-3-haiku-20240307"
                    url = "https://api.anthropic.com/v1/messages"
                    sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
                    user_msgs = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
                    data = json.dumps({
                        "model": ant_model,
                        "max_tokens": 4096,
                        "messages": user_msgs,
                        "system": sys_prompt
                    }).encode('utf-8')
                    req_http = urllib.request.Request(url, data=data, headers={
                        'Content-Type': 'application/json', 
                        'x-api-key': key_or_model,
                        'anthropic-version': '2023-06-01'
                    })
                    res_data = json.loads(urllib.request.urlopen(req_http, timeout=60).read().decode('utf-8'))
                    result_text = res_data['content'][0]['text']


                # Strip markdown code fences if AI wrapped the output
                if result_text.strip().startswith('```'):
                    lines = result_text.strip().split('\n')
                    if lines[0].startswith('```'):
                        lines = lines[1:]
                    if lines and lines[-1].startswith('```'):
                        lines = lines[:-1]
                    result_text = '\n'.join(lines)

                success = True
                break
            except urllib.error.HTTPError as e:
                last_error = f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}"
                continue
            except Exception as exc:
                last_error = str(exc)
                continue

        os.remove(temp_srt)

        if success:
            return {"status": "ok", "result": result_text}
        else:
            return {"status": "error", "error": f"AI Rewrite failed: {last_error}"}
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

class TTSRetryReq(BaseModel):
    srt_content: str
    tts_voice: str
    video_path: str
    tts_ref_audio: Optional[str] = None

@app.post("/api/tts-retry")
def api_tts_retry(req: TTSRetryReq):
    """
    Approach mới: TTS-first timing.
    
    Thay vì đặt clip vào timeline theo timestamp SRT gốc,
    ta tạo clip TTS cho từng segment, đặt chúng liên tiếp (với gap im lặng),
    đo duration thực tế của mỗi clip → tạo SRT mới có timestamp khớp hoàn toàn với voice.
    
    Trả về: audio_path, srt_content (SRT mới từ timing thực), segments_timing
    """
    import tempfile, os, asyncio, threading, re
    try:
        # ── Parse SRT gốc ────────────────────────────────────────────────
        def time_to_ms(t: str) -> int:
            t = t.strip()
            h, m, s_ms = t.split(':')
            s, ms = s_ms.replace('.', ',').split(',')
            return int(h) * 3600000 + int(m) * 60000 + int(s) * 1000 + int(ms)

        def ms_to_srt_time(ms: int) -> str:
            h   = ms // 3600000
            m   = (ms % 3600000) // 60000
            s   = (ms % 60000) // 1000
            mil = ms % 1000
            return f"{h:02d}:{m:02d}:{s:02d},{mil:03d}"

        segments = []
        blocks = re.split(r'\n\n+', req.srt_content.strip())
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) < 2:
                continue
            ts_line = next((l for l in lines if '-->' in l), None)
            if not ts_line:
                continue
            parts = ts_line.split('-->')
            orig_start_ms = time_to_ms(parts[0])
            orig_end_ms   = time_to_ms(parts[1]) if len(parts) > 1 else orig_start_ms + 3000
            text_lines = lines[lines.index(ts_line) + 1:]
            text = ' '.join(text_lines).strip()
            if text:
                segments.append({
                    'orig_start': orig_start_ms,
                    'orig_end':   orig_end_ms,
                    'text': text
                })

        if not segments:
            return {"status": "error", "error": "Không tìm thấy segment nào trong SRT"}

        # ── Pre-process: nếu chỉ có 1 segment nhưng text quá dài → chia nhỏ ──
        # Điều này xảy ra khi Whisper detect 1 câu dài hoặc AI viết lại thêm nội dung.
        # Chia theo dấu câu, mỗi sub-segment ~20-40 từ để TTS dễ đọc và sub khả xem.
        MAX_WORDS_PER_SEGMENT = 30
        expanded_segments = []
        for seg in segments:
            words = seg['text'].split()
            if len(words) <= MAX_WORDS_PER_SEGMENT:
                expanded_segments.append(seg)
                continue
            # Chia text theo dấu câu trước
            import re as _re_pre
            parts = _re_pre.split(r'(?<=[.!?,;。！？，；])\s+', seg['text'].strip())
            # Gộp chunk ngắn lại
            sub_texts: list[str] = []
            buf = ""
            for part in parts:
                cand = (buf + " " + part).strip() if buf else part
                if len(cand.split()) >= 15 or part == parts[-1]:
                    sub_texts.append(cand)
                    buf = ""
                else:
                    buf = cand
            if buf:
                if sub_texts:
                    sub_texts[-1] = (sub_texts[-1] + " " + buf).strip()
                else:
                    sub_texts.append(buf)
            if not sub_texts:
                sub_texts = [seg['text']]

            # Phân bổ timestamp đều cho các sub-segment
            total_dur = seg['orig_end'] - seg['orig_start']
            wcs = [max(1, len(t.split())) for t in sub_texts]
            total_wc = sum(wcs)
            cur_t = seg['orig_start']
            for si2, (st, wc) in enumerate(zip(sub_texts, wcs)):
                if si2 == len(sub_texts) - 1:
                    # Clamp cuối cùng về đúng orig_end để tránh overflow/underflow do làm tròn
                    seg_end = max(cur_t + 500, seg['orig_end'])
                else:
                    seg_end = cur_t + max(500, int(total_dur * wc / total_wc))
                expanded_segments.append({
                    'orig_start': cur_t,
                    'orig_end':   seg_end,
                    'text':       st
                })
                cur_t = seg_end

        # Dùng expanded_segments thay segments
        segments = expanded_segments
        print(f'[TTS] Segments after expansion: {len(segments)}', flush=True)

        try:
            from pydub import AudioSegment as _AS
        except ImportError:
            return {"status": "error", "error": "pydub not installed. Run: pip install pydub"}

        voice   = req.tts_voice
        out_dir = tempfile.gettempdir()
        dubbed_path = os.path.join(out_dir, f'tts_retry_{abs(hash(req.srt_content[:80]))}.mp3')

        # ── Tạo từng clip TTS + thu thập word boundaries cho karaoke ──────
        clips = []  # list of (AudioSegment, text, orig_start_ms, orig_end_ms, word_boundaries)

        def _edge_tts_with_words(text_str: str, voice_str: str, out_path: str):
            """
            Chạy edge_tts với WordBoundary, thu thập timing từng từ.
            Trả về (success: bool, word_timings: list of {offset_ms, duration_ms, word})
            """
            import edge_tts
            result = {"ok": False, "words": [], "err": ""}
            def _t():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    async def _gen():
                        import io as _io
                        audio_buf = _io.BytesIO()
                        words = []
                        comm = edge_tts.Communicate(
                            text_str, voice_str,
                            boundary='WordBoundary'
                        )
                        async for chunk in comm.stream():
                            if chunk["type"] == "audio":
                                audio_buf.write(chunk["data"])
                            elif chunk["type"] == "WordBoundary":
                                # offset unit = 100-nanosecond ticks → ms
                                offset_ms   = chunk["offset"] // 10000
                                duration_ms = chunk.get("duration", 0) // 10000
                                words.append({
                                    "offset_ms":   offset_ms,
                                    "duration_ms": duration_ms,
                                    "word":        chunk.get("text", "")
                                })
                        # Ghi audio ra file
                        with open(out_path, "wb") as f:
                            f.write(audio_buf.getvalue())
                        result["ok"]    = True
                        result["words"] = words
                    loop.run_until_complete(_gen())
                except Exception as e:
                    result["err"] = str(e)
                finally:
                    loop.close()
            th = threading.Thread(target=_t)
            th.start()
            th.join(timeout=30)
            return result["ok"], result["words"]

        for idx, seg in enumerate(segments):
            text = seg['text']
            ext  = ".mp3"
            tmp  = os.path.join(out_dir, f'tts_seg_{idx}{ext}')
            cur_voice  = voice
            word_timings = []

            if cur_voice.startswith("clone:"):
                import urllib.request as _urlreq, json as _json
                try:
                    body = _json.dumps({
                        "text": text, "voice_name": cur_voice,
                        "ref_audio_path": req.tts_ref_audio, "language": "vi"
                    }).encode()
                    r = _json.loads(_urlreq.urlopen(
                        _urlreq.Request("http://127.0.0.1:8765/api/tts/generate",
                                        data=body, headers={'Content-Type':'application/json'}),
                        timeout=60).read())
                    if r.get("status") == "ok":
                        import shutil; shutil.copy(r["audio_path"], tmp)
                    else:
                        cur_voice = "vi-VN-HoaiMyNeural"
                except Exception:
                    cur_voice = "vi-VN-HoaiMyNeural"

            if not cur_voice.startswith("clone:"):
                try:
                    ok, word_timings = _edge_tts_with_words(text, cur_voice, tmp)
                    if not ok:
                        # fallback không có word timing
                        from edge_tts import Communicate as _C
                        err2 = []
                        def _fb():
                            loop2 = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop2)
                            try:
                                loop2.run_until_complete(_C(text, cur_voice).save(tmp))
                            except Exception as e2:
                                err2.append(str(e2))
                            finally:
                                loop2.close()
                        th2 = threading.Thread(target=_fb)
                        th2.start(); th2.join(timeout=30)
                        if err2:
                            print(f'[TTS] Segment {idx} failed: {err2[0]}', flush=True)
                            continue
                except ImportError:
                    return {"status": "error", "error": "edge-tts not installed"}

            if os.path.exists(tmp):
                from pydub import AudioSegment as _AS2
                clip = _AS2.from_file(tmp)
                os.remove(tmp)

                # Kiểm tra tốc độ nói: nếu audio quá dài so với độ dài kỳ vọng
                # (khoảng 4-6 chars/giây là bình thường cho TTS tiếng Việt),
                # speed up về tốc độ hợp lý bằng cách thay đổi frame_rate.
                expected_chars_per_sec = 5.0  # ~5 ký tự/giây
                expected_duration_ms   = max(1000, int(len(text) / expected_chars_per_sec * 1000))
                actual_duration_ms     = len(clip)
                
                if actual_duration_ms > expected_duration_ms * 2.5:
                    # Quá chậm → speed up
                    speed_ratio = actual_duration_ms / expected_duration_ms
                    speed_ratio = min(speed_ratio, 3.0)  # tối đa 3x, tránh méo tiếng
                    new_frame_rate = int(clip.frame_rate * speed_ratio)
                    clip = clip._spawn(clip.raw_data, overrides={"frame_rate": new_frame_rate})
                    clip = clip.set_frame_rate(clip.frame_rate)
                    print(f'[TTS] Speed-up {speed_ratio:.2f}x: {actual_duration_ms}ms → {len(clip)}ms', flush=True)

                clips.append((clip, text, seg['orig_start'], seg['orig_end'], word_timings))
                print(f'[TTS] Seg {idx}: "{text[:30]}..." → {len(clip)}ms, {len(word_timings)} words', flush=True)

        if not clips:
            return {"status": "error", "error": "Không tạo được clip TTS nào"}

        # ── TTS-first timing ─────────────────────────────────────────────
        timed_segments = []  # (actual_start_ms, actual_end_ms, text, word_timings)

        cursor_ms = clips[0][2]  # bắt đầu tại orig_start của segment đầu

        for i, (clip, text, orig_start, orig_end, word_timings) in enumerate(clips):
            actual_start = cursor_ms
            actual_end   = cursor_ms + len(clip)

            # Đảm bảo sub hiển thị tối thiểu 2s (tránh sub flash quá nhanh)
            MIN_SUB_DISPLAY_MS = 2000
            # Segment cuối cùng: đệm thêm 800ms để voice không bị cắt
            if i == len(clips) - 1:
                display_end = actual_end + 800
            else:
                display_end = max(actual_end, actual_start + MIN_SUB_DISPLAY_MS)

            # ── Nếu clip quá dài so với slot gốc (> 2x) và không có word timing
            # → chia text thành nhiều sub-segments để sub không hiện cùng lúc
            orig_slot_ms = orig_end - orig_start
            clip_len_ms  = len(clip)

            if not word_timings and orig_slot_ms > 0 and clip_len_ms > orig_slot_ms * 1.5:
                import re as _re_sub
                # Chia text theo dấu câu
                raw_parts = _re_sub.split(r'(?<=[.!?,;。！？，；])\s+', text.strip())
                # Gộp chunk nhỏ (<5 từ) vào chunk tiếp theo
                sub_chunks: list[str] = []
                buf2 = ""
                for part in raw_parts:
                    cand = (buf2 + " " + part).strip() if buf2 else part
                    if len(cand.split()) >= 6 or part == raw_parts[-1]:
                        sub_chunks.append(cand)
                        buf2 = ""
                    else:
                        buf2 = cand
                if buf2:
                    if sub_chunks:
                        sub_chunks[-1] = (sub_chunks[-1] + " " + buf2).strip()
                    else:
                        sub_chunks.append(buf2)
                if not sub_chunks:
                    sub_chunks = [text]

                # Phân bổ thời gian theo số từ
                word_counts2 = [max(1, len(c.split())) for c in sub_chunks]
                total_words2 = sum(word_counts2)
                sub_cursor   = actual_start
                for si, (sc, wc2) in enumerate(zip(sub_chunks, word_counts2)):
                    frac2   = wc2 / total_words2
                    sub_dur = max(MIN_SUB_DISPLAY_MS, int(clip_len_ms * frac2))
                    sub_end = sub_cursor + sub_dur
                    if si == len(sub_chunks) - 1:
                        sub_end = display_end  # dùng display_end (có padding) cho chunk cuối
                    timed_segments.append((sub_cursor, sub_end, sc, []))
                    sub_cursor = sub_end
            else:
                timed_segments.append((actual_start, display_end, text, word_timings))

            if i + 1 < len(clips):
                next_orig_start = clips[i + 1][2]
                orig_gap = next_orig_start - orig_end
                gap = max(orig_gap, 200)
            else:
                gap = 500

            cursor_ms = actual_end + gap

        # ── Build audio timeline ──────────────────────────────────────────
        total_duration = timed_segments[-1][1] + 1000
        final_audio = _AS.silent(duration=total_duration)

        for (clip, _, _, _, _), (act_start, act_end, _, _) in zip(clips, timed_segments):
            if act_end > len(final_audio):
                extra = _AS.silent(duration=act_end - len(final_audio) + 500)
                final_audio = final_audio + extra
            final_audio = final_audio.overlay(clip, position=act_start)

        final_audio.export(dubbed_path, format="mp3")

        # ── Tạo SRT chuẩn (timing thực) ──────────────────────────────────
        srt_lines = []
        for i, (act_start, act_end, text, _) in enumerate(timed_segments):
            srt_lines.append(f"{i + 1}")
            srt_lines.append(f"{ms_to_srt_time(act_start)} --> {ms_to_srt_time(act_end)}")
            srt_lines.append(text)
            srt_lines.append("")
        new_srt_content = "\n".join(srt_lines)

        # ── Tạo Karaoke ASS (highlight từng từ theo tiếng) ───────────────
        def ms_to_ass_time(ms: int) -> str:
            h  = ms // 3600000
            m  = (ms % 3600000) // 60000
            s  = (ms % 60000) // 1000
            cs = (ms % 1000) // 10
            return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

        karaoke_ass_lines = [
            "[Script Info]",
            "ScriptType: v4.00+",
            "PlayResX: 1920", "PlayResY: 1080",
            "Timer: 100.0000", "",
            "[V4+ Styles]",
            # Name, Font, Size, PrimaryColour(trắng), SecondaryColour(vàng karaoke),
            # OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut,
            # ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow,
            # Alignment, MarginL, MarginR, MarginV, Encoding
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
            "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
            "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
            "Alignment, MarginL, MarginR, MarginV, Encoding",
            # Style: text màu trắng, karaoke fill màu vàng
            "Style: Karaoke,Arial,28,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,"
            "0,0,0,0,100,100,0,0,1,2,1,2,20,20,15,1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
        ]

        for act_start, act_end, text, word_timings in timed_segments:
            seg_duration_ms = act_end - act_start

            if word_timings:
                # Có word boundaries từ edge_tts → karaoke thực sự per-word
                karaoke_text_parts = []
                for wt in word_timings:
                    word   = wt["word"]
                    dur_cs = max(1, wt["duration_ms"] // 10)
                    karaoke_text_parts.append(f"{{\\kf{dur_cs}}}{word}")
                karaoke_text = " ".join(karaoke_text_parts)
                karaoke_ass_lines.append(
                    f"Dialogue: 0,{ms_to_ass_time(act_start)},{ms_to_ass_time(act_end)},"
                    f"Karaoke,,0,0,0,,{{\\an2}}{karaoke_text}"
                )
            else:
                # Không có word timing (OmniVoice clone) → chia text thành
                # nhiều câu nhỏ, mỗi câu hiện lần lượt theo thời gian.
                # Chia theo dấu câu: . ! ? , ; rồi nhóm lại mỗi ~15 từ
                import re as _re2
                # Split tại dấu câu giữ dấu câu ở cuối chunk
                raw_chunks = _re2.split(r'(?<=[.!?,;。！？，；])\s+', text.strip())
                # Gộp chunk nhỏ lại nếu ít từ quá (< 5 từ)
                chunks: list[str] = []
                buf = ""
                for ch in raw_chunks:
                    if buf:
                        combined = buf + " " + ch
                    else:
                        combined = ch
                    if len(combined.split()) >= 8 or ch == raw_chunks[-1]:
                        chunks.append(combined.strip())
                        buf = ""
                    else:
                        buf = combined
                if buf:
                    if chunks:
                        chunks[-1] = (chunks[-1] + " " + buf).strip()
                    else:
                        chunks.append(buf.strip())
                if not chunks:
                    chunks = [text]

                # Phân bổ thời gian theo số từ (chunk nhiều từ hơn → dài hơn)
                word_counts = [max(1, len(c.split())) for c in chunks]
                total_words = sum(word_counts)
                cursor_ms = act_start
                for ci, (chunk, wc) in enumerate(zip(chunks, word_counts)):
                    frac = wc / total_words
                    chunk_dur = max(800, int(seg_duration_ms * frac))
                    chunk_end = min(cursor_ms + chunk_dur, act_end)
                    if ci == len(chunks) - 1:
                        chunk_end = act_end  # last chunk takes remaining time

                    # Dùng \kf chia đều theo từ trong chunk này
                    words_in_chunk = chunk.split()
                    per_word_cs = max(1, (chunk_end - cursor_ms) // 10 // max(len(words_in_chunk), 1))
                    karaoke_text = " ".join(f"{{\\kf{per_word_cs}}}{w}" for w in words_in_chunk)

                    karaoke_ass_lines.append(
                        f"Dialogue: 0,{ms_to_ass_time(cursor_ms)},{ms_to_ass_time(chunk_end)},"
                        f"Karaoke,,0,0,0,,{{\\an2}}{karaoke_text}"
                    )
                    cursor_ms = chunk_end

        karaoke_ass_content = "\n".join(karaoke_ass_lines)

        print(f'[TTS] Done: {len(clips)} segs, audio={dubbed_path}', flush=True)

        return {
            "status":          "ok",
            "audio_path":      dubbed_path,
            "srt_content":     new_srt_content,       # SRT thuần, timing từ TTS thực
            "karaoke_ass":     karaoke_ass_content,   # ASS karaoke với \k per-word
            "segments_timing": [
                {"start": s, "end": e, "text": t}
                for s, e, t, _ in timed_segments
            ],
            # Tổng duration audio TTS (ms) — dùng để tính video tempo adjustment
            "audio_duration_ms": timed_segments[-1][1] if timed_segments else 0,
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


# ─── Video Tempo Adjustment ─────────────────────────────────────────────────

class AdjustVideoTempoReq(BaseModel):
    video_path:        str           # video đầu vào (_no_sub.mp4)
    output_path:       str           # video đầu ra
    audio_duration_ms: float         # duration TTS thực tế (ms)
    max_speed_ratio:   float = 1.30  # giới hạn tốc tối đa (1.3 = tăng 30%)
    min_speed_ratio:   float = 0.80  # giới hạn tốc tối thiểu (0.8 = chậm 20%)

@app.post("/api/adjust-video-tempo")
def api_adjust_video_tempo(req: AdjustVideoTempoReq):
    """
    Tự động điều chỉnh tốc độ video để khớp với duration của TTS audio.
    
    Nếu TTS dài hơn video → làm chậm video (slow down).
    Nếu TTS ngắn hơn video → tăng tốc video (speed up).
    Giới hạn speed ratio trong [min_speed_ratio, max_speed_ratio] để tránh quá khó nhìn.
    
    Trả về: { status, output_path, speed_ratio, video_duration_ms, audio_duration_ms }
    """
    import subprocess, os

    if not cv2:
        return {"status": "error", "error": "OpenCV not available"}
    if not os.path.exists(req.video_path):
        return {"status": "error", "error": "Video not found"}
    if req.audio_duration_ms <= 0:
        return {"status": "error", "error": "Invalid audio_duration_ms"}

    try:
        cap = cv2.VideoCapture(req.video_path)
        fps_v    = cap.get(cv2.CAP_PROP_FPS) or 30
        frames_v = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
        cap.release()

        if frames_v <= 0:
            return {"status": "error", "error": "Cannot read video frame count"}

        video_duration_ms = (frames_v / fps_v) * 1000

        # Tính tỷ lệ cần thiết: nếu TTS dài 20s, video 17s → cần slow down → ratio = 17/20 = 0.85
        # video phải chạy ở 85% tốc độ để bằng 20s
        raw_ratio = video_duration_ms / req.audio_duration_ms

        # Clamp trong giới hạn cho phép
        speed_ratio = max(req.min_speed_ratio, min(req.max_speed_ratio, raw_ratio))
        
        deviation_pct = abs(1.0 - raw_ratio) * 100
        print(f'[Tempo] Video={video_duration_ms:.0f}ms TTS={req.audio_duration_ms:.0f}ms '
              f'raw_ratio={raw_ratio:.3f} clamped={speed_ratio:.3f} '
              f'deviation={deviation_pct:.1f}%', flush=True)

        if abs(speed_ratio - 1.0) < 0.02:
            # Chênh lệch <2% → không cần adjust, copy trực tiếp
            import shutil
            shutil.copy(req.video_path, req.output_path)
            return {
                "status": "ok",
                "output_path":       req.output_path,
                "speed_ratio":       1.0,
                "video_duration_ms": video_duration_ms,
                "audio_duration_ms": req.audio_duration_ms,
                "adjusted":          False,
                "message":           "Deviation <2%, no adjustment needed"
            }

        # ffmpeg setpts filter: PTS *= (1/speed_ratio) để điều chỉnh thời gian
        # speed_ratio < 1 → video chậm lại (PTS lớn hơn)
        # speed_ratio > 1 → video nhanh hơn (PTS nhỏ hơn)
        pts_factor = 1.0 / speed_ratio

        # Audio: atempo filter, nhưng ta sẽ thay audio hoàn toàn → xóa audio gốc
        cmd = [
            'ffmpeg', '-y', '-i', req.video_path,
            '-filter:v', f'setpts={pts_factor:.6f}*PTS',
            '-an',  # bỏ audio (sẽ ghép TTS riêng)
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
            req.output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            return {
                "status":            "ok",
                "output_path":       req.output_path,
                "speed_ratio":       speed_ratio,
                "video_duration_ms": video_duration_ms,
                "audio_duration_ms": req.audio_duration_ms,
                "adjusted":          True,
                "deviation_pct":     round(deviation_pct, 1)
            }
        else:
            return {"status": "error", "error": result.stderr[-500:]}

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

# ─── Audio/Subtitle Replacement Endpoints ────────────
class ReplaceAudioRequest(BaseModel):
    video_path: str
    audio_path: str
    output_path: str
    bg_volume: int = 10  # 0-100, original audio volume


class BurnSubtitleRequest(BaseModel):
    video_path: str
    srt_path: str
    output_path: str
    mode: str = "soft"  # "soft" (mux) or "hard" (burn)
    # Styling options
    font_name: Optional[str] = "Arial"
    font_size: Optional[int] = 24
    primary_color: Optional[str] = "&H00FFFFFF" # ASS hex format (AABBGGRR)
    alignment: Optional[int] = 2 # 1: BotL, 2: BotC, 3: BotR, 5: TopL, 8: TopC, etc.
    margin_v: Optional[int] = 10


# ─── Vocal Removal ─────────────────────────────────────────────────────────

class RemoveVocalReq(BaseModel):
    video_path: str
    output_audio_path: Optional[str] = None  # nếu None → tự tạo đường dẫn

@app.post("/api/remove-vocal")
def api_remove_vocal(req: RemoveVocalReq):
    """
    Tách vocal ra khỏi audio track của video, giữ lại nhạc nền.
    
    Thử theo thứ tự ưu tiên:
    1. demucs (tốt nhất, AI-based) — nếu đã cài
    2. librosa + numpy center-channel subtraction (stereo only, không cần AI)
    3. ffmpeg pan filter fallback (nhanh nhất, chất lượng thấp nhất)
    
    Trả về: { status, audio_path (WAV nhạc nền), method_used }
    """
    import tempfile, os, subprocess

    if not os.path.exists(req.video_path):
        return {"status": "error", "error": "Video not found"}

    out_dir  = tempfile.gettempdir()
    base     = os.path.splitext(os.path.basename(req.video_path))[0]
    out_path = req.output_audio_path or os.path.join(out_dir, f'{base}_bg.wav')

    # ── Bước 1: Extract audio từ video ───────────────────────────────────
    fd, raw_audio = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    cmd_extract = [
        'ffmpeg', '-y', '-i', req.video_path,
        '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2',
        raw_audio
    ]
    r = subprocess.run(cmd_extract, capture_output=True, timeout=120)
    if r.returncode != 0:
        # Fallback: thử mono
        cmd_mono = [
            'ffmpeg', '-y', '-i', req.video_path,
            '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1',
            raw_audio
        ]
        r2 = subprocess.run(cmd_mono, capture_output=True, timeout=120)
        if r2.returncode != 0:
            return {"status": "error", "error": "Cannot extract audio: " + r.stderr.decode(errors='replace')[-300:]}

    try:
        # ── Method 1: demucs (tốt nhất) ──────────────────────────────────
        try:
            import demucs.separate
            import torch
            print('[VocalRemove] Using demucs (htdemucs model)...', flush=True)
            
            demucs_out = os.path.join(out_dir, 'demucs_out')
            os.makedirs(demucs_out, exist_ok=True)
            
            # Chạy demucs: -n htdemucs (4-stem: drums, bass, other, vocals)
            demucs.separate.main([
                '--out', demucs_out,
                '--name', 'htdemucs',
                '--two-stems', 'vocals',   # tách vocals vs no_vocals (nhanh hơn 4-stem)
                raw_audio
            ])
            
            # Tìm file no_vocals output
            no_vocals = None
            for root, dirs, files in os.walk(demucs_out):
                for f in files:
                    if 'no_vocals' in f.lower() or ('other' in f.lower() and 'htdemucs' in root):
                        no_vocals = os.path.join(root, f)
                        break
            
            if no_vocals and os.path.exists(no_vocals):
                import shutil
                shutil.copy(no_vocals, out_path)
                os.remove(raw_audio)
                print(f'[VocalRemove] demucs OK → {out_path}', flush=True)
                return {"status": "ok", "audio_path": out_path, "method_used": "demucs"}
        except (ImportError, Exception) as e:
            print(f'[VocalRemove] demucs not available: {e}', flush=True)

        # ── Method 2: librosa center-channel subtraction (stereo) ────────
        try:
            import librosa
            import soundfile as sf
            import numpy as np

            print('[VocalRemove] Using librosa center-channel subtraction...', flush=True)
            y, sr = librosa.load(raw_audio, sr=None, mono=False)  # shape: (channels, samples)

            if y.ndim == 2 and y.shape[0] == 2:
                # Stereo: vocal ở center → L - R loại bỏ center
                left  = y[0]
                right = y[1]
                # Karaoke formula: background = (L + R) / 2 - alpha * (L - R) / 2
                # Đơn giản hơn: background = L - vocal_estimate, với vocal = (L+R)/2
                vocal_est  = (left + right) / 2.0
                bg_left    = left  - vocal_est * 0.85
                bg_right   = right - vocal_est * 0.85
                background = np.vstack([bg_left, bg_right])
            else:
                # Mono: không thể tách vocal → trả về nguyên
                print('[VocalRemove] Mono audio — center-channel subtraction not applicable', flush=True)
                background = y

            sf.write(out_path, background.T if background.ndim == 2 else background, sr)
            os.remove(raw_audio)
            print(f'[VocalRemove] librosa OK → {out_path}', flush=True)
            return {"status": "ok", "audio_path": out_path, "method_used": "librosa_center_sub"}

        except (ImportError, Exception) as e:
            print(f'[VocalRemove] librosa method failed: {e}', flush=True)

        # ── Method 3: ffmpeg pan filter fallback ─────────────────────────
        print('[VocalRemove] Fallback: ffmpeg pan filter (stereo center removal)...', flush=True)
        cmd_pan = [
            'ffmpeg', '-y', '-i', raw_audio,
            '-af', 'pan=stereo|c0=c0-c1|c1=c1-c0',  # center channel elimination
            out_path
        ]
        r3 = subprocess.run(cmd_pan, capture_output=True, timeout=120)
        os.remove(raw_audio)

        if r3.returncode == 0:
            print(f'[VocalRemove] ffmpeg pan OK → {out_path}', flush=True)
            return {"status": "ok", "audio_path": out_path, "method_used": "ffmpeg_pan"}
        else:
            # Cuối cùng: trả về audio gốc không tách được
            return {"status": "warning",
                    "audio_path": raw_audio,
                    "method_used": "original",
                    "message": "Không thể tách vocal, dùng audio gốc"}

    except Exception as e:
        if os.path.exists(raw_audio):
            os.remove(raw_audio)
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


# ─── Sub Position Detection ────────────────────────────────────────────────

class DetectSubPositionsReq(BaseModel):
    video_path: str
    sample_step: int = 30   # sample every N frames (default 30 = ~1s at 30fps)

@app.post("/api/detect-sub-positions")
def api_detect_sub_positions(req: DetectSubPositionsReq):
    """
    Phân tích video gốc để phát hiện vị trí (Y) của phụ đề theo từng khoảng thời gian.
    
    Trả về:
      - positions: [{start_ms, end_ms, y_center_ratio, position ("top"|"middle"|"bottom"),
                     alignment (ASS: 8=TopC, 5=MidC, 2=BotC), margin_v_ratio}]
      - video_height, video_width
    """
    if not cv2:
        return {"status": "error", "error": "OpenCV not available"}
    if not os.path.exists(req.video_path):
        return {"status": "error", "error": "Video not found"}

    try:
        cap = cv2.VideoCapture(req.video_path)
        fps_v    = cap.get(cv2.CAP_PROP_FPS) or 30
        total_f  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()

        if total_f == 0 or height == 0:
            return {"status": "error", "error": "Cannot read video properties"}

        # Chạy SubtitleDetect để lấy bbox dict
        try:
            from backend.tools.subtitle_detect import SubtitleDetect
        except ImportError:
            return {"status": "error", "error": "SubtitleDetect not available"}

        detector = SubtitleDetect(req.video_path, [])
        detector.SAMPLE_STEP = max(req.sample_step, 5)

        # Dummy sub_remover để SubtitleDetect không crash
        class _DummySR:
            ab_sections = [range(0, total_f + 1)]
            extracted_texts = []
            def append_output(self, *a): pass

        dummy = _DummySR()
        frame_box_dict = detector.find_subtitle_frame_no(sub_remover=dummy)

        if not frame_box_dict:
            return {
                "status": "ok",
                "positions": [],
                "video_height": height,
                "video_width": width,
                "message": "No subtitle regions detected"
            }

        # Gom các frame liên tiếp thành segments, tính y_center trung bình
        def _y_center(boxes):
            """Tính trung bình y center (0..1) của tất cả bbox trong frame."""
            centers = []
            for box in boxes:
                # box format: (xmin, xmax, ymin, ymax)
                if len(box) == 4:
                    _, _, ymin, ymax = box
                    centers.append((ymin + ymax) / 2.0 / height)
            return sum(centers) / len(centers) if centers else 0.5

        def _classify(y_ratio):
            """0..0.4 = top, 0.4..0.65 = middle, 0.65..1.0 = bottom"""
            if y_ratio < 0.40:
                return "top",    8,  int(y_ratio * height)
            elif y_ratio < 0.65:
                return "middle", 5,  0  # centered vertically
            else:
                return "bottom", 2,  int((1.0 - y_ratio) * height)

        sorted_frames = sorted(frame_box_dict.keys())
        segments = []
        seg_start_frame = sorted_frames[0]
        seg_boxes       = list(frame_box_dict[sorted_frames[0]])
        GAP_THRESHOLD   = fps_v * 2  # 2s gap → new segment

        for i in range(1, len(sorted_frames)):
            f = sorted_frames[i]
            prev_f = sorted_frames[i - 1]
            if f - prev_f <= GAP_THRESHOLD:
                seg_boxes.extend(frame_box_dict[f])
            else:
                # Finalize previous segment
                y_c = _y_center(seg_boxes)
                pos, align, margin = _classify(y_c)
                segments.append({
                    "start_ms":      int(seg_start_frame / fps_v * 1000),
                    "end_ms":        int(prev_f / fps_v * 1000),
                    "y_center_ratio": round(y_c, 3),
                    "position":      pos,
                    "alignment":     align,
                    "margin_v":      margin,
                })
                seg_start_frame = f
                seg_boxes       = list(frame_box_dict[f])

        # Finalize last segment
        last_f = sorted_frames[-1]
        y_c    = _y_center(seg_boxes)
        pos, align, margin = _classify(y_c)
        segments.append({
            "start_ms":      int(seg_start_frame / fps_v * 1000),
            "end_ms":        int(last_f / fps_v * 1000),
            "y_center_ratio": round(y_c, 3),
            "position":      pos,
            "alignment":     align,
            "margin_v":      margin,
        })

        print(f'[SubPos] Detected {len(segments)} position segments: '
              + ', '.join(f'{s["position"]}@{s["start_ms"]}ms' for s in segments), flush=True)

        return {
            "status":       "ok",
            "positions":    segments,
            "video_height": height,
            "video_width":  width,
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


class AutoDetectRegionsReq(BaseModel):
    video_path: str
    sample_step: int = 15
    padding: int = 12
    mask_mode: str = "box"

@app.post("/api/auto-detect-regions")
def api_auto_detect_regions(req: AutoDetectRegionsReq):
    """
    Quét video tự động phát hiện các vùng phụ đề (tọa độ pixel + frame range) cho chế độ Thủ công.
    """
    if not cv2:
        return {"status": "error", "error": "OpenCV not available"}
    if not os.path.exists(req.video_path):
        return {"status": "error", "error": "Video not found"}

    try:
        cap = cv2.VideoCapture(req.video_path)
        total_f  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps_v    = cap.get(cv2.CAP_PROP_FPS) or 30
        cap.release()

        if total_f <= 0 or height <= 0:
            return {"status": "error", "error": "Cannot read video properties"}

        try:
            from backend.tools.subtitle_detect import DirectDBNet, ModelConfig
            model_config = ModelConfig()
            net = DirectDBNet(model_config.DET_MODEL_DIR)
        except Exception:
            return {"status": "error", "error": "Subtitle detector not available"}

        # Quét tuần tự video theo bước nhảy mẫu 6 frame (đảm bảo tốc độ quét cao < 1.5s và không sót frame)
        cap = cv2.VideoCapture(req.video_path)
        frame_box_dict = {}
        f = 0
        step = max(req.sample_step, 5)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if f % step == 0:
                boxes = net.predict(frame)
                sub_boxes = []
                for b in boxes:
                    bx1, bx2, by1, by2 = b
                    bw = bx2 - bx1
                    bh = by2 - by1
                    b_cy = (by1 + by2) / 2.0

                    # 1. Bộ lọc Vùng phụ đề (Subtitle Zone): Hỗ trợ cả banner trên (<= 45% H) và phụ đề dưới (>= 58% H)
                    is_sub_zone = (b_cy <= 0.45 * height) or (b_cy >= 0.58 * height)

                    # 2. Tiêu chuẩn hình dáng Banner / Dòng chữ phụ đề (Độ dài >= 120px, tỷ lệ W/H >= 1.5)
                    is_banner = (bw >= 120 and 18 <= bh <= 150 and (bw / float(max(1, bh))) >= 1.5)

                    if is_sub_zone and is_banner:
                        sub_boxes.append(b)
                if sub_boxes:
                    frame_box_dict[f] = sub_boxes
            f += 1
        cap.release()

        if not frame_box_dict:
            return {
                "status": "ok",
                "regions": [],
                "video_height": height,
                "video_width": width,
                "message": "Không tìm thấy vùng phụ đề nào"
            }

        def box_center(b):
            return (b[0] + b[1]) / 2.0, (b[2] + b[3]) / 2.0

        # Xây dựng các track phụ đề chặt chẽ theo câu (GAP_LIMIT = step + 2 frames)
        raw_tracks = []
        GAP_LIMIT = step + 2

        for f_idx in sorted(frame_box_dict.keys()):
            boxes = frame_box_dict[f_idx]
            for b in boxes:
                cx, cy = box_center(b)
                bw = b[1] - b[0]
                bh = b[3] - b[2]
                best_track = None
                best_dist = 999999
                for t in raw_tracks:
                    if f_idx - t['frames'][-1] <= GAP_LIMIT:
                        lcx, lcy = box_center(t['boxes'][-1])
                        lbw = t['boxes'][-1][1] - t['boxes'][-1][0]
                        dy = abs(cy - lcy)
                        dx = abs(cx - lcx)
                        dw = abs(bw - lbw)
                        if dy <= 14 and dx <= 35 and dw <= 65:
                            dist = dy * 2.0 + dx + dw * 0.5
                            if dist < best_dist:
                                best_dist = dist
                                best_track = t
                if best_track is not None:
                    best_track['frames'].append(f_idx)
                    best_track['boxes'].append(b)
                else:
                    raw_tracks.append({'frames': [f_idx], 'boxes': [b]})

        # Lọc các track phụ đề thực thụ (tồn tại >= 12 frame hoặc ít nhất 2 mẫu quét)
        import numpy as np
        final_subs = []
        for t in raw_tracks:
            dur = t['frames'][-1] - t['frames'][0] + 1
            if dur >= 12 and len(t['frames']) >= 2:
                all_b = np.array(t['boxes'])
                sf = max(0, t['frames'][0] - 2)
                ef = min(total_f - 1, t['frames'][-1] + 2)
                x1 = int(np.min(all_b[:, 0]))
                x2 = int(np.max(all_b[:, 1]))
                y1 = int(np.min(all_b[:, 2]))
                y2 = int(np.max(all_b[:, 3]))
                final_subs.append({'sf': sf, 'ef': ef, 'x1': x1, 'x2': x2, 'y1': y1, 'y2': y2})

        final_subs.sort(key=lambda s: (s['sf'], s['y1']))

        # Áp dụng padding thích ứng thông minh:
        # - Phía trái (pad_left): mở rộng đủ bao trọn số thứ tự (e.g. 1., 8., 10.), bullet, icon, dấu ngoặc
        # - Phía phải (pad_right): mở rộng trọn dấu câu, emoji, ký tự cuối
        # - Phía trên/dưới (pad_y): mở rộng đủ bao phủ dấu mũ, nét viền đen (stroke), bóng đổ (drop shadow), hiệu ứng phát sáng (glow)
        segments = []
        for s in final_subs:
            bh = max(20, s['y2'] - s['y1'])
            pad_left = max(45, int(1.4 * bh))
            pad_right = max(28, int(0.55 * bh))
            pad_y = max(24, int(0.35 * bh))

            xmin = max(0, s['x1'] - pad_left)
            xmax = min(width, s['x2'] + pad_right)
            ymin = max(0, s['y1'] - pad_y)
            ymax = min(height, s['y2'] + pad_y)

            if (xmax - xmin) >= 30 and (ymax - ymin) >= 15:
                segments.append({
                    "label": len(segments) + 1,
                    "startFrame": int(s['sf']),
                    "endFrame": int(s['ef']),
                    "xmin": int(xmin),
                    "xmax": int(xmax),
                    "ymin": int(ymin),
                    "ymax": int(ymax),
                    "maskMode": req.mask_mode
                })

        print(f'[AutoRegions] Detected {len(segments)} clean subtitle regions for manual fine-tuning', flush=True)
        return {
            "status": "ok",
            "regions": segments,
            "video_height": height,
            "video_width": width
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


# ─── Burn Subtitle with Position Awareness (ASS format) ────────────────────

class BurnSubPositionedReq(BaseModel):
    video_path:    str
    srt_content:   str          # SRT text (với timestamp)
    output_path:   str
    positions:     Optional[List[dict]] = None  # từ /api/detect-sub-positions
    karaoke_ass:   Optional[str] = None         # ASS karaoke content (ưu tiên nếu có)
    font_name:     str  = "Arial"
    font_size:     int  = 24
    primary_color: str = "&H00FFFFFF"
    outline_color: str = "&H00000000"
    margin_v:      int  = 10
    video_height:  int  = 0
    video_width:   int  = 0

@app.post("/api/burn-subtitle-positioned")
def api_burn_subtitle_positioned(req: BurnSubPositionedReq):
    """
    Burn subtitle vào video với position awareness:
    - Chuyển SRT → ASS format
    - Mỗi dialogue event được gán alignment + margin_v dựa trên
      position segment tương ứng từ /api/detect-sub-positions
    - Dùng ffmpeg ass filter để burn vào video
    """
    import tempfile, os, re, subprocess

    def time_to_ms(t: str) -> int:
        t = t.strip()
        h, m, s_ms = t.split(':')
        s, ms = s_ms.replace('.', ',').split(',')
        return int(h)*3600000 + int(m)*60000 + int(s)*1000 + int(ms)

    def ms_to_ass_time(ms: int) -> str:
        """ASS time format: H:MM:SS.cc (centiseconds)"""
        h   = ms // 3600000
        m   = (ms % 3600000) // 60000
        s   = (ms % 60000) // 1000
        cs  = (ms % 1000) // 10
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    def get_position_for_time(start_ms: int, positions: list) -> dict:
        """Tìm position segment phù hợp với timestamp."""
        if not positions:
            return {"alignment": 2, "margin_v": req.margin_v, "position": "bottom"}
        for seg in positions:
            if seg["start_ms"] <= start_ms <= seg["end_ms"] + 500:
                return seg
        # Fallback: dùng segment gần nhất
        closest = min(positions, key=lambda s: abs(s["start_ms"] - start_ms))
        return closest

    try:
        # Parse SRT
        srt_entries = []
        blocks = re.split(r'\n\n+', req.srt_content.strip())
        for block in blocks:
            lines = block.strip().split('\n')
            ts_line = next((l for l in lines if '-->' in l), None)
            if not ts_line:
                continue
            parts = ts_line.split('-->')
            start_ms = time_to_ms(parts[0])
            end_ms   = time_to_ms(parts[1]) if len(parts) > 1 else start_ms + 3000
            text_lines = [l for l in lines if l != ts_line and not re.match(r'^\d+$', l.strip())]
            text = '\\N'.join(t.strip() for t in text_lines if t.strip())
            if text:
                srt_entries.append((start_ms, end_ms, text))

        if not srt_entries:
            return {"status": "error", "error": "No subtitle entries found in SRT"}

        # Nếu có karaoke_ass content → dùng luôn, không cần tái tạo từ SRT
        if req.karaoke_ass:
            ass_content = req.karaoke_ass
            # Cập nhật PlayRes nếu có video dimensions
            if req.video_width and req.video_height:
                ass_content = re.sub(r'PlayResX: \d+', f'PlayResX: {req.video_width}',  ass_content)
                ass_content = re.sub(r'PlayResY: \d+', f'PlayResY: {req.video_height}', ass_content)
            # Cập nhật font nếu khác mặc định
            if req.font_name and req.font_name != "Arial":
                ass_content = ass_content.replace("Fontname: Arial", f"Fontname: {req.font_name}")
                ass_content = ass_content.replace(",Arial,", f",{req.font_name},")
            # Cập nhật font size
            if req.font_size and req.font_size != 28:
                ass_content = re.sub(r'(Style: Karaoke,[^,]+,)\d+', f'\\g<1>{req.font_size}', ass_content)
            # Cập nhật màu chữ chính
            if req.primary_color and req.primary_color != "&H00FFFFFF":
                ass_content = ass_content.replace("&H00FFFFFF", req.primary_color)

            # Thêm position-awareness: thay \an2 trong mỗi dialogue line
            # và cập nhật MarginV bằng cách sinh ra nhiều Style Karaoke
            if req.positions:
                import re as _re
                # 1. Tìm dòng Style: Karaoke
                style_line = ""
                for line in ass_content.split('\n'):
                    if line.startswith("Style: Karaoke"):
                        style_line = line
                        break
                
                new_dialogue_lines = []
                style_map = {} # (align, margin_v) -> style_name
                
                for line in ass_content.split('\n'):
                    if line.startswith('Dialogue:'):
                        parts = line.split(',', 9)
                        if len(parts) >= 3:
                            try:
                                def _ass_to_ms(t):
                                    h2, m2, s_cs = t.strip().split(':')
                                    s2, cs = s_cs.split('.')
                                    return (int(h2)*3600 + int(m2)*60 + int(s2))*1000 + int(cs)*10
                                start_ms = _ass_to_ms(parts[1])
                                pos_info = get_position_for_time(start_ms, req.positions)
                                align    = pos_info.get("alignment", 2)
                                margin_v = pos_info.get("margin_v", 10)
                                
                                # Replace {\anX} if it exists
                                line = _re.sub(r'\{\\an\d\}', f'{{\\an{align}}}', line)
                                
                                # Thay đổi style name
                                style_name = f"Karaoke_{align}_{margin_v}"
                                if (align, margin_v) not in style_map:
                                    style_map[(align, margin_v)] = style_name
                                
                                # Cập nhật trường Style (index 3)
                                parts[3] = style_name
                                line = ",".join(parts)
                                
                            except Exception:
                                pass
                    new_dialogue_lines.append(line)
                
                ass_content = '\n'.join(new_dialogue_lines)
                
                # 2. Sinh ra các style mới và thay thế dòng Style: Karaoke gốc
                if style_line and style_map:
                    style_parts = style_line.split(',')
                    new_styles = []
                    for (align, margin_v), style_name in style_map.items():
                        new_parts = list(style_parts)
                        new_parts[0] = f"Style: {style_name}"
                        if len(new_parts) >= 22:
                            new_parts[18] = str(align)
                            new_parts[21] = str(margin_v)
                        new_styles.append(",".join(new_parts))
                    
                    ass_content = ass_content.replace(style_line, "\n".join(new_styles))
        else:
            # Tạo ASS từ SRT + position awareness (fallback khi không có karaoke_ass)
            positions = req.positions or []
            style_map = {}  # (alignment, margin_v) → style_name

            def _get_style(align: int, margin_v: int) -> str:
                key = (align, margin_v)
                if key not in style_map:
                    style_map[key] = f"Sub_{align}_{margin_v}"
                return style_map[key]

            entries_with_style = []
            for start_ms, end_ms, text in srt_entries:
                pos_info = get_position_for_time(start_ms, positions)
                align    = pos_info.get("alignment", 2)
                margin_v = pos_info.get("margin_v", 10)
                style    = _get_style(align, margin_v)
                entries_with_style.append((start_ms, end_ms, text, style, align, margin_v))

            primary = req.primary_color
            if primary.startswith('#'):
                r2 = primary[1:3]; g2 = primary[3:5]; b2 = primary[5:7]
                primary = f"&H00{b2}{g2}{r2}".upper()

            ass_lines = [
                "[Script Info]", "ScriptType: v4.00+", "Collisions: Normal",
                f"PlayResX: {req.video_width or 1920}",
                f"PlayResY: {req.video_height or 1080}",
                "Timer: 100.0000", "",
                "[V4+ Styles]",
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
                "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
                "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
                "Alignment, MarginL, MarginR, MarginV, Encoding",
            ]
            for (align, margin_v), style_name in style_map.items():
                ass_lines.append(
                    f"Style: {style_name},{req.font_name},{req.font_size},"
                    f"{primary},{primary},{req.outline_color},&H80000000,"
                    f"0,0,0,0,100,100,0,0,1,2,1,{align},20,20,{margin_v},1"
                )
            ass_lines += ["", "[Events]",
                          "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
            for start_ms, end_ms, text, style, _, _ in entries_with_style:
                ass_lines.append(
                    f"Dialogue: 0,{ms_to_ass_time(start_ms)},{ms_to_ass_time(end_ms)},"
                    f"{style},,0,0,0,,{text}"
                )
            ass_content = "\n".join(ass_lines)
            style_map_len = len(style_map)

        # Ghi ASS ra file tạm và burn vào video
        fd, ass_path = tempfile.mkstemp(suffix='.ass')
        with os.fdopen(fd, 'w', encoding='utf-8-sig') as f:
            f.write(ass_content)

        def _esc(p):
            p = p.replace('\\', '/')
            if len(p) >= 2 and p[1] == ':':
                p = p[0] + '\\:' + p[2:]
            return p

        cmd = [
            'ffmpeg', '-y', '-i', req.video_path,
            '-vf', f"ass='{_esc(ass_path)}'",
            '-c:a', 'copy', req.output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        os.remove(ass_path)

        if result.returncode == 0:
            styles_used = 1 if req.karaoke_ass else style_map_len
            print(f'[BurnSub] ASS burn OK → {req.output_path}', flush=True)
            return {"status": "ok", "output_path": req.output_path, "styles_used": styles_used}
        else:
            return {"status": "error", "error": result.stderr[-500:]}

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


class MixAudioTracksReq(BaseModel):
    video_path:    str
    tts_path:      str
    bg_audio_path: str   # nhạc nền đã tách (từ /api/remove-vocal)
    output_path:   str
    bg_volume:     int = 30  # % âm lượng nhạc nền (0-100)

@app.post("/api/mix-audio-tracks")
def api_mix_audio_tracks(req: MixAudioTracksReq):
    """
    Mix 3 tracks: video (không có audio gốc) + nhạc nền (đã tách) + TTS voice.
    Video track giữ nguyên, audio được thay bằng: bg_audio * bg_vol + tts * 1.0
    """
    import subprocess
    bg_vol = req.bg_volume / 100.0
    try:
        # Filter complex:
        # [0:v] → video stream (giữ nguyên)
        # [1:a] → nhạc nền (bg_audio), adjust volume
        # [2:a] → TTS voice, volume 1.0 (full)
        # amix kết hợp 2 audio streams
        filter_complex = (
            f"[1:a]volume={bg_vol}[bg];"
            f"[2:a]volume=1.0[voice];"
            f"[bg][voice]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]"
        )
        cmd = [
            'ffmpeg', '-y',
            '-i', req.video_path,   # [0] video (dùng video stream, bỏ audio)
            '-i', req.bg_audio_path, # [1] nhạc nền
            '-i', req.tts_path,      # [2] TTS voice
            '-filter_complex', filter_complex,
            '-map', '0:v',
            '-map', '[aout]',
            '-c:v', 'copy',
            '-c:a', 'aac', '-b:a', '192k',
            req.output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            return {"status": "ok", "output_path": req.output_path}
        else:
            return {"status": "error", "error": result.stderr[-500:]}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/api/replace-audio")
def replace_audio(req: ReplaceAudioRequest):
    """Replace or mix audio in video with generated voice"""
    import subprocess
    bg_vol = req.bg_volume / 100.0
    try:
        if req.bg_volume == 0:
            # Replace entirely
            cmd = [
                'ffmpeg', '-y', '-i', req.video_path, '-i', req.audio_path,
                '-map', '0:v', '-map', '1:a',
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                req.output_path
            ]
        else:
            # Mix: original audio at bg_volume + new audio
            cmd = [
                'ffmpeg', '-y', '-i', req.video_path, '-i', req.audio_path,
                '-filter_complex',
                f'[0:a]volume={bg_vol}[bg];[1:a]volume=2.0[voice];[bg][voice]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[out]',
                '-map', '0:v', '-map', '[out]',
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                req.output_path
            ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            return {"status": "ok", "output_path": req.output_path}
        else:
            return {"status": "error", "error": result.stderr[:500]}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/api/burn-subtitle")
def burn_subtitle(req: BurnSubtitleRequest):
    """Burn or mux subtitles into video"""
    import subprocess
    try:
        if req.mode == "hard":
            # Hard sub: burn into video frames
            srt_escaped = req.srt_path.replace('\\', '/').replace(':', '\\:')
            # Build force_style string
            style_parts = []
            if req.font_name: style_parts.append(f"FontName={req.font_name}")
            if req.font_size: style_parts.append(f"FontSize={req.font_size}")
            if req.primary_color: style_parts.append(f"PrimaryColour={req.primary_color}")
            if req.alignment: style_parts.append(f"Alignment={req.alignment}")
            if req.margin_v: style_parts.append(f"MarginV={req.margin_v}")
            
            force_style = ",".join(style_parts)
            sub_filter = f"subtitles='{srt_escaped}'"
            if force_style:
                sub_filter += f":force_style='{force_style}'"

            cmd = [
                'ffmpeg', '-y', '-i', req.video_path,
                '-vf', sub_filter,
                '-c:a', 'copy',
                req.output_path
            ]
        else:
            # Soft sub: mux as subtitle track
            cmd = [
                'ffmpeg', '-y', '-i', req.video_path, '-i', req.srt_path,
                '-map', '0:v', '-map', '0:a', '-map', '1:0',
                '-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text',
                req.output_path
            ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            return {"status": "ok", "output_path": req.output_path}
        else:
            return {"status": "error", "error": result.stderr[:500]}
    except Exception as e:
        return {"status": "error", "error": str(e)}


class WriteFileRequest(BaseModel):
    path: str
    content: str

@app.post("/api/write-file")
def write_file(req: WriteFileRequest):
    """Write text content to a file path"""
    try:
        import os as _os
        _os.makedirs(_os.path.dirname(req.path), exist_ok=True)
        with open(req.path, 'w', encoding='utf-8') as f:
            f.write(req.content)
        return {"status": "ok", "path": req.path}
    except Exception as e:
        return {"status": "error", "error": str(e)}


class VideoRenderClip(BaseModel):
    id: str
    name: Optional[str] = None
    start: str
    to: str

class VideoRenderRequest(BaseModel):
    video_path: str
    clips: List[VideoRenderClip]
    output_path: Optional[str] = None
    mode: Optional[str] = "lossless"

@app.post("/api/video-render/cut-and-concat")
def video_render_cut_and_concat(req: VideoRenderRequest):
    """
    Cut video into specified timeline segments and concatenate into a single output video.
    Supports lossless stream-copy or accurate re-encode mode.
    """
    import tempfile, subprocess, shutil, os as _os
    try:
        if not _os.path.isfile(req.video_path):
            return {"status": "error", "error": f"Không tìm thấy video nguồn: {req.video_path}"}
        if not req.clips:
            return {"status": "error", "error": "Danh sách clip rỗng, vui lòng cung cấp ít nhất 1 đoạn cắt."}

        # Determine output path
        output_path = req.output_path
        if not output_path:
            base, ext = _os.path.splitext(req.video_path)
            output_path = f"{base}_remix{ext or '.mp4'}"
        _os.makedirs(_os.path.dirname(_os.path.abspath(output_path)), exist_ok=True)

        temp_dir = tempfile.mkdtemp(prefix="vsr_video_render_")
        clip_paths = []

        # 1. Cut each clip
        for idx, clip in enumerate(req.clips):
            clip_name = clip.name or f"clip_{idx+1}"
            safe_name = f"clip_{idx+1:03d}.mp4"
            clip_file = _os.path.join(temp_dir, safe_name)
            
            start_val = str(clip.start).strip()
            to_val = str(clip.to).strip()

            if req.mode == "accurate":
                cmd = [
                    'ffmpeg', '-y',
                    '-ss', start_val,
                    '-to', to_val,
                    '-i', req.video_path,
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
                    '-c:a', 'aac', '-b:a', '192k',
                    clip_file
                ]
            else:
                # Lossless fast copy
                cmd = [
                    'ffmpeg', '-y',
                    '-ss', start_val,
                    '-to', to_val,
                    '-i', req.video_path,
                    '-c', 'copy',
                    '-avoid_negative_ts', 'make_zero',
                    clip_file
                ]

            print(f"[VideoRender] Cutting clip {idx+1}/{len(req.clips)}: {clip_name} ({start_val} -> {to_val})...", flush=True)
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode != 0 or not _os.path.isfile(clip_file) or _os.path.getsize(clip_file) == 0:
                err_msg = res.stderr.decode('utf-8', errors='replace')
                print(f"[VideoRender] Fast copy failed for clip {idx+1}, retrying with re-encode fallback: {err_msg}", flush=True)
                # Fallback to re-encode
                cmd_fallback = [
                    'ffmpeg', '-y',
                    '-ss', start_val,
                    '-to', to_val,
                    '-i', req.video_path,
                    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20',
                    '-c:a', 'aac',
                    clip_file
                ]
                res_fb = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res_fb.returncode != 0 or not _os.path.isfile(clip_file) or _os.path.getsize(clip_file) == 0:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    return {"status": "error", "error": f"Lỗi cắt đoạn {clip_name}: {res_fb.stderr.decode('utf-8', errors='replace')}"}

            clip_paths.append(clip_file)

        # 2. Concat list
        concat_txt = _os.path.join(temp_dir, "concat_list.txt")
        with open(concat_txt, 'w', encoding='utf-8') as f:
            for p in clip_paths:
                # Use forward slash for ffmpeg concat file
                norm_p = p.replace('\\', '/')
                f.write(f"file '{norm_p}'\n")

        # 3. Concat clips into final video
        print(f"[VideoRender] Concatenating {len(clip_paths)} clips into {output_path}...", flush=True)
        concat_cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_txt,
            '-c', 'copy',
            output_path
        ]
        res_concat = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # If copy concat fails, re-encode concat
        if res_concat.returncode != 0 or not _os.path.isfile(output_path) or _os.path.getsize(output_path) == 0:
            print(f"[VideoRender] Concat copy failed, falling back to concat re-encode...", flush=True)
            concat_cmd_fb = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_txt,
                '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
                '-c:a', 'aac',
                output_path
            ]
            res_concat_fb = subprocess.run(concat_cmd_fb, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res_concat_fb.returncode != 0 or not _os.path.isfile(output_path) or _os.path.getsize(output_path) == 0:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return {"status": "error", "error": f"Lỗi ghép chuỗi clip: {res_concat_fb.stderr.decode('utf-8', errors='replace')}"}

        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"[VideoRender] Successfully exported stitched video: {output_path}", flush=True)
        return {
            "status": "ok",
            "output_path": output_path,
            "clips_count": len(clip_paths),
            "mode_used": req.mode
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


@app.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_websockets.remove(websocket)


@app.on_event("startup")
async def startup_event():
    global event_loop
    event_loop = asyncio.get_running_loop()


if __name__ == '__main__':
    print("Starting Video Subtitle Remover API on port 8765...")
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")
