$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$AudioRoot = Join-Path $RuntimeRoot 'flash\chinese-wav2vec2-base'
$RepairScript = Join-Path $RuntimeRoot 'repair-audio-model.py'

if (-not (Test-Path $Python)) { throw "Missing EchoMimicV3 Python runtime: $Python" }

@'
import os
import shutil
from modelscope import snapshot_download

root = r"C:\VSR-EchoMimicV3\flash\chinese-wav2vec2-base"
config = os.path.join(root, "config.json")
weights = [
    os.path.join(root, "model.safetensors"),
    os.path.join(root, "pytorch_model.bin"),
]

if os.path.exists(config) and any(os.path.exists(p) for p in weights):
    print("[EchoMimicV3] Audio encoder assets complete; no repair needed.")
else:
    print("[EchoMimicV3] Audio encoder assets incomplete; rebuilding isolated audio model directory.")
    if os.path.isdir(root):
        shutil.rmtree(root)
    snapshot_download("TencentGameMate/chinese-wav2vec2-base", local_dir=root)

missing = []
if not os.path.exists(config):
    missing.append(config)
if not any(os.path.exists(p) for p in weights):
    missing.append("model.safetensors|pytorch_model.bin")
if missing:
    raise RuntimeError(f"Audio encoder repair incomplete; missing: {missing}")

print("[EchoMimicV3] AUDIO MODEL READY")
for name in sorted(os.listdir(root)):
    if name in {"config.json", "model.safetensors", "pytorch_model.bin", "preprocessor_config.json"}:
        path = os.path.join(root, name)
        print(f"[EchoMimicV3] {name}: {os.path.getsize(path)} bytes")
'@ | Set-Content -Encoding ASCII $RepairScript

& $Python $RepairScript
if ($LASTEXITCODE -ne 0) { throw "Audio encoder repair failed ($LASTEXITCODE)." }

& $Python -c "from transformers import Wav2Vec2Model; Wav2Vec2Model.from_pretrained(r'$AudioRoot', local_files_only=True); print('[EchoMimicV3] WAV2VEC2 LOAD PASS')"
if ($LASTEXITCODE -ne 0) { throw "Wav2Vec2 load smoke test failed ($LASTEXITCODE)." }
