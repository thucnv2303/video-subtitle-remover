"""
OmniVoice TTS Engine - Wrapper for text-to-speech generation
Supports zero-shot voice cloning with reference audio
"""
import os
import sys
import json
import tempfile
import traceback
import re
import gc
import threading
from pathlib import Path

# Add OmniVoice repo to path if available locally
_omnivoice_repo = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'omnivoice')
if os.path.isdir(_omnivoice_repo) and _omnivoice_repo not in sys.path:
    sys.path.insert(0, _omnivoice_repo)

# Try to import OmniVoice
_omnivoice_available = False
_model = None
_model_lock = threading.RLock()
_release_timer = None
_active_generations = 0
_IDLE_RELEASE_SECONDS = 6.0


def _check_omnivoice():
    """Check if OmniVoice is installed and available"""
    global _omnivoice_available
    try:
        import torch
        _omnivoice_available = True
    except ImportError:
        _omnivoice_available = False
    return _omnivoice_available


def _cancel_scheduled_release():
    global _release_timer
    with _model_lock:
        timer = _release_timer
        _release_timer = None
    if timer is not None:
        timer.cancel()


def release_model():
    """Release cached OmniVoice model after a completed TTS burst."""
    global _model, _release_timer
    with _model_lock:
        if _active_generations > 0:
            return False
        _release_timer = None
        if _model is None:
            return True
        _model = None

    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            try:
                torch.cuda.ipc_collect()
            except Exception:
                pass
    except Exception:
        pass
    print("[TTS] OmniVoice released after idle TTS burst.", flush=True)
    return True


def _schedule_idle_release(delay_seconds=_IDLE_RELEASE_SECONDS):
    """Debounce release so multi-segment clone TTS does not reload per segment."""
    global _release_timer
    _cancel_scheduled_release()
    with _model_lock:
        if _active_generations > 0 or _model is None:
            return
        timer = threading.Timer(delay_seconds, release_model)
        timer.daemon = True
        _release_timer = timer
        timer.start()


def load_model(device="cuda", dtype="float16"):
    """Load OmniVoice model (lazy initialization)"""
    global _model
    with _model_lock:
        if _model is not None:
            return _model
    
    try:
        import torch
        from omnivoice import OmniVoice
        
        torch_dtype = torch.float16 if dtype == "float16" else torch.float32
        device_map = device if torch.cuda.is_available() else "cpu"
        
        print(f"[TTS] Loading OmniVoice model on {device_map}...", flush=True)
        loaded = OmniVoice.from_pretrained(
            "k2-fsa/OmniVoice",
            device_map=device_map,
            dtype=torch_dtype
        )
        with _model_lock:
            _model = loaded
        print(f"[TTS] OmniVoice loaded successfully!", flush=True)
        return _model
    except ImportError as e:
        print(f"[TTS] OmniVoice not installed: {e}", flush=True)
        print(f"[TTS] Install with: pip install omnivoice", flush=True)
        return None
    except Exception as e:
        print(f"[TTS] Error loading OmniVoice: {e}", flush=True)
        traceback.print_exc()
        return None


def generate_speech(text, ref_audio_path=None, output_path=None, language="vi"):
    """
    Generate speech from text using OmniVoice.
    
    Args:
        text: Text to synthesize
        ref_audio_path: Optional path to reference audio for voice cloning
        output_path: Where to save the output WAV file
        language: Language code (default: 'vi' for Vietnamese)
    
    Returns:
        Path to generated audio file, or None on failure
    """
    global _active_generations
    _cancel_scheduled_release()
    with _model_lock:
        _active_generations += 1

    try:
        model = load_model()
        if model is None:
            return None
        
        if output_path is None:
            output_path = tempfile.mktemp(suffix='.wav')
        
        try:
            kwargs = {
                "text": text,
                "language": language,
            }
            if ref_audio_path and os.path.exists(ref_audio_path):
                kwargs["ref_audio"] = ref_audio_path
            
            # model.generate() returns a list of numpy arrays
            audios = model.generate(**kwargs)
            
            # Save first audio to file using model's sampling rate
            import soundfile as sf
            sf.write(output_path, audios[0], model.sampling_rate)
            
            print(f"[TTS] Generated: {output_path} ({len(text)} chars)", flush=True)
            return output_path
        except Exception as e:
            print(f"[TTS] Error generating speech: {e}", flush=True)
            traceback.print_exc()
            return None
    finally:
        with _model_lock:
            _active_generations = max(0, _active_generations - 1)
            should_schedule = _active_generations == 0
        if should_schedule:
            _schedule_idle_release()


def parse_srt(srt_path):
    """Parse SRT file into segments with timestamps"""
    segments = []
    with open(srt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    blocks = re.split(r'\n\n+', content.strip())
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 3:
            continue
        
        # Parse timestamp line
        time_match = re.match(
            r'(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})',
            lines[1]
        )
        if not time_match:
            continue
        
        h1, m1, s1, ms1 = int(time_match.group(1)), int(time_match.group(2)), int(time_match.group(3)), int(time_match.group(4))
        h2, m2, s2, ms2 = int(time_match.group(5)), int(time_match.group(6)), int(time_match.group(7)), int(time_match.group(8))
        
        start_ms = h1 * 3600000 + m1 * 60000 + s1 * 1000 + ms1
        end_ms = h2 * 3600000 + m2 * 60000 + s2 * 1000 + ms2
        
        text = ' '.join(lines[2:]).strip()
        if text:
            segments.append({
                'index': int(lines[0]) if lines[0].isdigit() else len(segments) + 1,
                'start_ms': start_ms,
                'end_ms': end_ms,
                'text': text
            })
    
    return segments


def generate_from_srt(srt_path, ref_audio_path=None, output_dir=None, language="vi"):
    """
    Generate voice for each SRT segment.
    
    Args:
        srt_path: Path to SRT file
        ref_audio_path: Optional reference audio for voice cloning
        output_dir: Directory to save audio segments
        language: Language code
    
    Returns:
        List of dicts with 'start_ms', 'end_ms', 'audio_path', 'text'
    """
    segments = parse_srt(srt_path)
    if not segments:
        print(f"[TTS] No segments found in {srt_path}", flush=True)
        return []
    
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(srt_path), 'tts_audio')
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    for i, seg in enumerate(segments):
        audio_path = os.path.join(output_dir, f'segment_{seg["index"]:04d}.wav')
        result = generate_speech(
            text=seg['text'],
            ref_audio_path=ref_audio_path,
            output_path=audio_path,
            language=language
        )
        if result:
            results.append({
                'index': seg['index'],
                'start_ms': seg['start_ms'],
                'end_ms': seg['end_ms'],
                'text': seg['text'],
                'audio_path': result
            })
            print(f"[TTS] Segment {i+1}/{len(segments)}: {seg['text'][:50]}...", flush=True)
    
    return results


def merge_audio_with_video(video_path, audio_segments, output_path, bg_volume=10):
    """
    Merge TTS audio segments with video using FFmpeg.
    Places each audio segment at its SRT timestamp position.
    
    Args:
        video_path: Input video path
        audio_segments: List from generate_from_srt()
        output_path: Output video path
        bg_volume: Original audio volume percentage (0-100)
    """
    import subprocess
    
    if not audio_segments:
        return video_path
    
    # Build FFmpeg complex filter for mixing
    inputs = ['-i', video_path]
    filter_parts = []
    
    for i, seg in enumerate(audio_segments):
        inputs.extend(['-i', seg['audio_path']])
        delay_ms = seg['start_ms']
        filter_parts.append(f'[{i+1}:a]adelay={delay_ms}|{delay_ms}[a{i}]')
    
    # Mix original audio (reduced volume) with all TTS segments
    bg_vol = bg_volume / 100.0
    mix_inputs = f'[0:a]volume={bg_vol}[bg]'
    filter_parts.insert(0, mix_inputs)
    
    amix_inputs = '[bg]' + ''.join(f'[a{i}]' for i in range(len(audio_segments)))
    filter_parts.append(f'{amix_inputs}amix=inputs={len(audio_segments)+1}:duration=first[out]')
    
    filter_complex = ';'.join(filter_parts)
    
    cmd = [
        'ffmpeg', '-y',
        *inputs,
        '-filter_complex', filter_complex,
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print(f"[TTS] Merged audio with video: {output_path}", flush=True)
            return output_path
        else:
            print(f"[TTS] FFmpeg error: {result.stderr[:500]}", flush=True)
            return None
    except Exception as e:
        print(f"[TTS] Error merging: {e}", flush=True)
        return None


def get_status():
    """Return TTS engine status"""
    return {
        'available': _omnivoice_available or _check_omnivoice(),
        'model_loaded': _model is not None,
        'model_name': 'OmniVoice (k2-fsa)',
        'supported_languages': ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru']
    }
