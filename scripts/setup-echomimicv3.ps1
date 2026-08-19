$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$VenvRoot = Join-Path $RuntimeRoot 'venv'
$Python = Join-Path $VenvRoot 'Scripts\python.exe'
$UpstreamCommit = '7e89489ca51c0d008fc1963ec6c03fc5bd0b9397'
$BootstrapPython = 'C:\VSR-JoyVASA\venv\Scripts\python.exe'
$LowVramPatch = Join-Path $PSScriptRoot 'echomimicv3-lowvram.patch'
$LegacyLowVramPatch = Join-Path $PSScriptRoot 'echomimicv3-lowvram-v1.patch'

function Run-Step([string]$File, [string[]]$Arguments) {
  if (-not $Arguments -or $Arguments.Count -eq 0) { throw "Refusing to launch command without arguments: $File" }
  Write-Host "[EchoMimicV3] $File $($Arguments -join ' ')"
  & $File @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $File $($Arguments -join ' ')" }
}

New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null
if (-not (Test-Path $BootstrapPython)) {
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { $BootstrapPython = 'py'; $bootstrapArgs = @('-3.10') }
  else { throw 'Không tìm thấy Python 3.10 bootstrap. Hãy chạy setup JoyVASA trước hoặc cài Python 3.10.' }
} else { $bootstrapArgs = @() }

if (-not (Test-Path $Python)) { Run-Step $BootstrapPython ($bootstrapArgs + @('-m','venv',$VenvRoot)) }
Run-Step $Python @('-m','pip','install','--upgrade','pip','setuptools','wheel')

if (-not (Test-Path (Join-Path $RepoRoot '.git'))) { Run-Step 'git' @('clone','https://github.com/antgroup/echomimic_v3.git',$RepoRoot) }
Run-Step 'git' @('-C',$RepoRoot,'fetch','origin')
Run-Step 'git' @('-C',$RepoRoot,'checkout','--detach',$UpstreamCommit)

if (-not (Test-Path $LowVramPatch)) { throw "Thiếu low-VRAM patch V2: $LowVramPatch" }
if (-not (Test-Path $LegacyLowVramPatch)) { throw "Thiếu legacy low-VRAM patch V1: $LegacyLowVramPatch" }
$inferFlash = Join-Path $RepoRoot 'infer_flash.py'
$inferSource = Get-Content -Raw -Path $inferFlash
if ($inferSource.Contains('VSR_LOW_VRAM_OFFLOAD_V2')) {
  Write-Host '[EchoMimicV3] VSR low-VRAM patch V2 already applied.'
} elseif ($inferSource.Contains('VSR_LOW_VRAM_OFFLOAD_V1')) {
  Write-Host '[EchoMimicV3] Migrating low-VRAM patch V1 -> V2.'
  Run-Step 'git' @('-C',$RepoRoot,'apply','--reverse','--check',$LegacyLowVramPatch)
  Run-Step 'git' @('-C',$RepoRoot,'apply','--reverse',$LegacyLowVramPatch)
  Run-Step 'git' @('-C',$RepoRoot,'apply','--check',$LowVramPatch)
  Run-Step 'git' @('-C',$RepoRoot,'apply',$LowVramPatch)
  Write-Host '[EchoMimicV3] Applied VSR low-VRAM patch V2.'
} else {
  $runtimeDirty = & git -C $RepoRoot status --porcelain -- infer_flash.py
  if ($LASTEXITCODE -ne 0) { throw 'Không kiểm tra được trạng thái infer_flash.py.' }
  if ($runtimeDirty) { throw "infer_flash.py có thay đổi runtime không nhận diện được; dừng để tránh overwrite: $runtimeDirty" }
  Run-Step 'git' @('-C',$RepoRoot,'apply','--check',$LowVramPatch)
  Run-Step 'git' @('-C',$RepoRoot,'apply',$LowVramPatch)
  Write-Host '[EchoMimicV3] Applied VSR low-VRAM patch V2.'
}

Run-Step $Python @('-m','pip','install','-r',(Join-Path $RepoRoot 'requirements.txt'))
Run-Step $Python @('-m','pip','install','pyloudnorm')
Run-Step $Python @('-c','import pyloudnorm')
Write-Host '[EchoMimicV3] pyloudnorm-import-ok'
Run-Step $Python @('-m','pip','install','--upgrade','torch==2.8.0','torchvision==0.23.0','torchaudio==2.8.0','--index-url','https://download.pytorch.org/whl/cu128')
Run-Step $Python @('-m','pip','install','huggingface_hub','modelscope')

$FlashRoot = Join-Path $RuntimeRoot 'flash'
$WanRoot = Join-Path $FlashRoot 'Wan2.1-Fun-V1.1-1.3B-InP'
$AudioRoot = Join-Path $FlashRoot 'chinese-wav2vec2-base'
$TransformerRoot = Join-Path $FlashRoot 'transformer'
$DownloadScript = Join-Path $RuntimeRoot 'download-assets.py'
New-Item -ItemType Directory -Force -Path $FlashRoot,$TransformerRoot | Out-Null

@'
import os
import shutil
import time

# hf-xet can fail while reconstructing very large files on Windows with
# "Background writer channel closed". Force the regular HTTP downloader.
os.environ["HF_HUB_DISABLE_XET"] = "1"
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"

from huggingface_hub import snapshot_download, hf_hub_download
from modelscope import snapshot_download as ms_snapshot_download

runtime_root = r"C:\VSR-EchoMimicV3"
flash_root = os.path.join(runtime_root, "flash")
wan_root = os.path.join(flash_root, "Wan2.1-Fun-V1.1-1.3B-InP")
audio_root = os.path.join(flash_root, "chinese-wav2vec2-base")
transformer_root = os.path.join(flash_root, "transformer")
os.makedirs(transformer_root, exist_ok=True)


def retry(label, fn, attempts=3):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except Exception as exc:
            last = exc
            if attempt == attempts:
                raise
            wait_s = attempt * 5
            print(f"[EchoMimicV3] {label} failed ({attempt}/{attempts}): {exc}")
            print(f"[EchoMimicV3] Retry in {wait_s}s; existing downloaded files are kept.")
            time.sleep(wait_s)
    raise last


wan_required = [
    os.path.join(wan_root, "config.json"),
    os.path.join(wan_root, "diffusion_pytorch_model.safetensors"),
    os.path.join(wan_root, "Wan2.1_VAE.pth"),
    os.path.join(wan_root, "models_t5_umt5-xxl-enc-bf16.pth"),
    os.path.join(wan_root, "models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth"),
]
if not all(os.path.exists(path) for path in wan_required):
    print("[EchoMimicV3] Downloading/resuming Wan 1.3B base model (HTTP, single worker)...")
    retry(
        "Wan model download",
        lambda: snapshot_download(
            repo_id="alibaba-pai/Wan2.1-Fun-V1.1-1.3B-InP",
            local_dir=wan_root,
            max_workers=1,
        ),
    )
else:
    print("[EchoMimicV3] Wan base model already present; skip download.")

flash_target = os.path.join(transformer_root, "diffusion_pytorch_model.safetensors")
if not os.path.exists(flash_target):
    print("[EchoMimicV3] Downloading/resuming EchoMimicV3 Flash transformer...")
    downloaded = retry(
        "Flash transformer download",
        lambda: hf_hub_download(
            repo_id="BadToBest/EchoMimicV3",
            filename="echomimicv3-flash-pro/diffusion_pytorch_model.safetensors",
        ),
    )
    shutil.copy2(downloaded, flash_target)
else:
    print("[EchoMimicV3] Flash transformer already present; skip download.")

if not os.path.exists(os.path.join(audio_root, "config.json")):
    print("[EchoMimicV3] Downloading Chinese wav2vec2 audio encoder...")
    retry(
        "Audio encoder download",
        lambda: ms_snapshot_download("TencentGameMate/chinese-wav2vec2-base", local_dir=audio_root),
    )
else:
    print("[EchoMimicV3] Audio encoder already present; skip download.")
'@ | Set-Content -Encoding ASCII $DownloadScript
Run-Step $Python @($DownloadScript)

$smokePath = Join-Path $RuntimeRoot 'cuda-smoke.py'
@'
import torch
print('torch', torch.__version__)
print('cuda', torch.version.cuda)
print('available', torch.cuda.is_available())
assert torch.cuda.is_available(), 'CUDA is not available'
print('gpu', torch.cuda.get_device_name(0))
print('vram_gb', round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 1))
x = torch.ones(1, device='cuda')
print('cuda-smoke', x.item())
'@ | Set-Content -Encoding ASCII $smokePath
Run-Step $Python @($smokePath)

if (-not (Select-String -Path $inferFlash -Pattern 'VSR_LOW_VRAM_OFFLOAD_V2' -Quiet)) {
  throw 'EchoMimicV3 low-VRAM patch V2 marker missing after setup.'
}
if (-not (Select-String -Path $inferFlash -Pattern 'VSR_LONG_AUDIO_V2' -Quiet)) {
  throw 'EchoMimicV3 long-audio V2 marker missing after setup.'
}

$missing = @()
@(
  $inferFlash,
  (Join-Path $WanRoot 'config.json'),
  (Join-Path $WanRoot 'diffusion_pytorch_model.safetensors'),
  (Join-Path $WanRoot 'Wan2.1_VAE.pth'),
  (Join-Path $WanRoot 'models_t5_umt5-xxl-enc-bf16.pth'),
  (Join-Path $WanRoot 'models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth'),
  (Join-Path $AudioRoot 'config.json'),
  (Join-Path $TransformerRoot 'diffusion_pytorch_model.safetensors')
) | ForEach-Object { if (-not (Test-Path $_)) { $missing += $_ } }
if ($missing.Count -gt 0) { throw "Thiếu asset EchoMimicV3: $($missing -join ', ')" }

Write-Host '[EchoMimicV3] READY'
Write-Host '[EchoMimicV3] low-vram: sequential CPU offload + long-audio chunking V2'
Write-Host "[EchoMimicV3] runtime: $RuntimeRoot"
Write-Host "[EchoMimicV3] upstream: $UpstreamCommit"
