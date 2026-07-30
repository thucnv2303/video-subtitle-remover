import sys
import os
import asyncio
import threading
import traceback
import json
from typing import List, Optional

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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
    tts_bg_volume: int = 10
    frame_range: Optional[dict] = None  # {"start": int, "end": int}
    mask_mode: str = "box"  # "box" | "tight" | "soft"


class ProcessBatchRequest(BaseModel):
    jobs: List[JobRequest]


class DetectTextRequest(BaseModel):
    video_path: str
    frame_number: int


def progress_listener(progress_total, is_finished):
    global current_job_id
    try:
        if not current_job_id or current_job_id not in jobs: return
        job = jobs[current_job_id]
        job["progress"] = progress_total
        if is_finished:
            job["status"] = "finished"
        
        # Broadcast to websockets from background thread
        msg = {
            "job_id": current_job_id,
            "progress": job["progress"],
            "status": job["status"],
            "is_finished": is_finished
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
            
        # Fix encoding for this thread - SubtitleRemover has Chinese print() calls
        import io
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
            
            sr = SubtitleRemover(job["input_path"])
            sr.extract_srt = job.get("extract_srt", False)
            sr.ai_rewrite = job.get("ai_rewrite", False)
            sr.ai_config = job.get("ai_config", None)
            sr.tts_voice = job.get("tts_voice", "none")
            sr.tts_bg_volume = job.get("tts_bg_volume", 10)
            
            original_writer_write = sr.video_writer.write
            def intercept_write(frame):
                global latest_preview_frame
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                latest_preview_frame = buffer.tobytes()
                original_writer_write(frame)
                
            sr.video_writer.write = intercept_write
            
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
            except ImportError:
                pass
                
            subtitle_remover_instance = sr
            if job["subtitle_areas"]:
                sr.sub_areas = [tuple(area) for area in job["subtitle_areas"]]
            # If no subtitle_areas, SubtitleRemover auto-detects (full screen)
            sr.video_out_path = job["output_path"]
            
            # Mask mode: pass to SubtitleRemover for tight/soft mask generation
            sr.mask_mode = job.get("mask_mode", "box")
            
            # Frame range support: limit processing to specific frame range
            frame_range = job.get("frame_range")
            if frame_range and "start" in frame_range and "end" in frame_range:
                sr.ab_sections = [range(int(frame_range["start"]), int(frame_range["end"]) + 1)]
                print(f'Frame range set: {frame_range["start"]}-{frame_range["end"]}', flush=True)
            
            sr.add_progress_listener(progress_listener)
            sr.run()
            
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
            # Restore stdout/stderr
            sys.stdout = old_stdout
            sys.stderr = old_stderr


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
            "subtitle_areas": j.subtitle_areas,
            "inpaint_mode": j.inpaint_mode,
            "extract_srt": j.extract_srt,
            "ai_rewrite": j.ai_rewrite,
            "ai_config": j.ai_config,
            "tts_voice": j.tts_voice,
            "tts_bg_volume": j.tts_bg_volume,
            "status": "pending",
            "progress": 0,
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
    # Currently unsupported gracefully
    return {"status": "cancel request received (may not be fully supported)"}


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
            import asyncio
            import edge_tts
            out_path = req.output_path or os.path.join(tempfile.gettempdir(), f'tts_test_{abs(hash(req.text))}.mp3')
            async def _gen():
                communicate = edge_tts.Communicate(req.text, req.voice_name)
                await communicate.save(out_path)
            asyncio.run(_gen())
            return {"status": "ok", "audio_path": out_path}
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
                f'[0:a]volume={bg_vol}[bg];[bg][1:a]amix=inputs=2:duration=first[out]',
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
