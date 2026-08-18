$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$VenvRoot = Join-Path $RuntimeRoot 'venv'
$Python = Join-Path $VenvRoot 'Scripts\python.exe'
$UpstreamCommit = '7e89489ca51c0d008fc1963ec6c03fc5bd0b9397'
$BootstrapPython = 'C:\VSR-JoyVASA\venv\Scripts\python.exe'

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

Run-Step $Python @('-m','pip','install','-r',(Join-Path $RepoRoot 'requirements.txt'))
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
from huggingface_hub import snapshot_download, hf_hub_download
from modelscope import snapshot_download as ms_snapshot_download

runtime_root = r"C:\VSR-EchoMimicV3"
flash_root = os.path.join(runtime_root, "flash")
wan_root = os.path.join(flash_root, "Wan2.1-Fun-V1.1-1.3B-InP")
audio_root = os.path.join(flash_root, "chinese-wav2vec2-base")
transformer_root = os.path.join(flash_root, "transformer")
os.makedirs(transformer_root, exist_ok=True)

wan_marker = os.path.join(wan_root, "model_index.json")
if not os.path.exists(wan_marker):
    print("[EchoMimicV3] Downloading Wan 1.3B base model...")
    snapshot_download(repo_id="alibaba-pai/Wan2.1-Fun-V1.1-1.3B-InP", local_dir=wan_root)
else:
    print("[EchoMimicV3] Wan base model already present; skip download.")

flash_target = os.path.join(transformer_root, "diffusion_pytorch_model.safetensors")
if not os.path.exists(flash_target):
    print("[EchoMimicV3] Downloading EchoMimicV3 Flash transformer...")
    downloaded = hf_hub_download(
        repo_id="BadToBest/EchoMimicV3",
        filename="echomimicv3-flash-pro/diffusion_pytorch_model.safetensors",
    )
    shutil.copy2(downloaded, flash_target)
else:
    print("[EchoMimicV3] Flash transformer already present; skip download.")

if not os.path.exists(os.path.join(audio_root, "config.json")):
    print("[EchoMimicV3] Downloading Chinese wav2vec2 audio encoder...")
    ms_snapshot_download("TencentGameMate/chinese-wav2vec2-base", local_dir=audio_root)
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

$missing = @()
@(
  (Join-Path $RepoRoot 'infer_flash.py'),
  (Join-Path $WanRoot 'model_index.json'),
  (Join-Path $AudioRoot 'config.json'),
  (Join-Path $TransformerRoot 'diffusion_pytorch_model.safetensors')
) | ForEach-Object { if (-not (Test-Path $_)) { $missing += $_ } }
if ($missing.Count -gt 0) { throw "Thiếu asset EchoMimicV3: $($missing -join ', ')" }

Write-Host '[EchoMimicV3] READY'
Write-Host "[EchoMimicV3] runtime: $RuntimeRoot"
Write-Host "[EchoMimicV3] upstream: $UpstreamCommit"
