import os
import re
import json
import hashlib
import math
from fractions import Fraction
from typing import Dict, Any, Optional

class P1ArtifactError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code

def get_jobs_root() -> str:
    env_root = os.environ.get('VIDEO_SUBTITLE_REMOVER_JOBS_ROOT')
    if env_root:
        return os.path.abspath(env_root)
    return os.path.abspath(os.path.join(os.getcwd(), 'jobs'))

def validate_job_id(job_id: str) -> None:
    if not job_id or not re.match(r'^[A-Za-z0-9_-]{1,128}$', job_id):
        raise P1ArtifactError('P1_INVALID_JOB_ID', f'Invalid job id: {job_id}')

def compute_source_fingerprint(source_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(source_path, 'rb') as f:
        while True:
            chunk = f.read(4 * 1024 * 1024)
            if not chunk:
                break
            sha256.update(chunk)
    return f"sha256:{sha256.hexdigest()}"

def compute_timebase(fps: float) -> str:
    rate = Fraction(float(fps)).limit_denominator(100000)
    return f"{rate.denominator}/{rate.numerator}"

def get_p1_dir(job_id: str) -> str:
    validate_job_id(job_id)
    return os.path.join(get_jobs_root(), job_id, 'p1')

def _atomic_write_text(filepath: str, content: str) -> None:
    tmp_filepath = f"{filepath}.tmp"
    with open(tmp_filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    os.replace(tmp_filepath, filepath)

def _atomic_write_json(filepath: str, data: Dict[str, Any]) -> None:
    content = json.dumps(data, indent=2, ensure_ascii=False)
    _atomic_write_text(filepath, content)

def get_manifest_path(job_id: str) -> str:
    return os.path.join(get_p1_dir(job_id), 'manifest.json')

def load_manifest(job_id: str) -> Optional[Dict[str, Any]]:
    manifest_path = get_manifest_path(job_id)
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def init_p1_job(job_id: str, source_path: str, fps: float, frame_count: int) -> Dict[str, Any]:
    validate_job_id(job_id)
    
    if fps <= 0 or not math.isfinite(float(fps)):
        raise P1ArtifactError('P1_INVALID_METADATA', 'FPS must be finite and > 0')
    if frame_count <= 0:
        raise P1ArtifactError('P1_INVALID_METADATA', 'Frame count must be > 0')

    p1_dir = get_p1_dir(job_id)
    manifest_path = get_manifest_path(job_id)
    source_fingerprint = compute_source_fingerprint(source_path)
    
    existing_manifest = load_manifest(job_id)
    if existing_manifest:
        if existing_manifest.get('job_id') != job_id:
            raise P1ArtifactError('P1_INVALID_JOB_ID', 'Job ID collision')
        if existing_manifest.get('source_fingerprint') != source_fingerprint:
            raise P1ArtifactError('P1_SOURCE_IDENTITY_MISMATCH', 'Source identity mismatch for existing job')
        return existing_manifest

    os.makedirs(p1_dir, exist_ok=True)

    source_duration = float(frame_count) / float(fps)
    timebase = compute_timebase(fps)

    manifest = {
        "artifact_version": "1",
        "job_id": job_id,
        "source_fingerprint": source_fingerprint,
        "source_path": os.path.abspath(source_path),
        "source_duration": source_duration,
        "fps": float(fps),
        "frame_count": int(frame_count),
        "timebase": timebase,
        "timebase_source": "fps-derived-v1",
        "artifacts": {
            "raw_srt": None,
            "tts_audio": None,
            "tts_srt": None,
            "karaoke_ass": None
        }
    }

    _atomic_write_json(manifest_path, manifest)
    return manifest

def save_raw_srt(job_id: str, srt_content: str) -> str:
    manifest = load_manifest(job_id)
    if not manifest:
        raise P1ArtifactError('P1_MANIFEST_NOT_FOUND', 'Manifest not found')
    
    srt_path = os.path.join(get_p1_dir(job_id), 'raw.srt')
    _atomic_write_text(srt_path, srt_content)
    
    manifest['artifacts']['raw_srt'] = 'raw.srt'
    _atomic_write_json(get_manifest_path(job_id), manifest)
    return srt_path

def update_tts_artifacts(job_id: str, tts_audio_filename: str = 'tts.mp3', tts_srt_content: Optional[str] = None) -> None:
    manifest = load_manifest(job_id)
    if not manifest:
        raise P1ArtifactError('P1_MANIFEST_NOT_FOUND', 'Manifest not found')
    
    manifest['artifacts']['tts_audio'] = tts_audio_filename
    
    if tts_srt_content is not None:
        tts_srt_path = os.path.join(get_p1_dir(job_id), 'tts.srt')
        _atomic_write_text(tts_srt_path, tts_srt_content)
        manifest['artifacts']['tts_srt'] = 'tts.srt'
        
    _atomic_write_json(get_manifest_path(job_id), manifest)
