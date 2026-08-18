$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$VenvRoot = Join-Path $RuntimeRoot 'venv'
$Python = Join-Path $VenvRoot 'Scripts\python.exe'
$UpstreamCommit = '7e89489ca51c0d008fc1963ec6c03fc5bd0b9397'
$BootstrapPython = 'C:\VSR-JoyVASA\venv\Scripts\python.exe'

function Run-Step([string]$File, [string[]]$Args) {
  Write-Host "[EchoMimicV3] $File $($Args -join ' ')"
  & $File @Args
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $File $($Args -join ' ')" }
}

New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null
if (-not (Test-Path $BootstrapPython)) {
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { $BootstrapPython = 'py'; $bootstrapArgs = @('-3.10') }
  else { throw 'Không tìm thấy Python 3.10 bootstrap. Hãy chạy setup JoyVASA trước hoặc cài Python 3.10.' }
} else { $bootstrapArgs = @() }

if (-not (Test-Path $Python)) {
  Run-Step $BootstrapPython ($bootstrapArgs + @('-m','venv',$VenvRoot))
}
Run-Step $Python @('-m','pip','install','--upgrade','pip','setuptools','wheel')

if (-not (Test-Path (Join-Path $RepoRoot '.git'))) {
  Run-Step 'git' @('clone','https://github.com/antgroup/echomimic_v3.git',$RepoRoot)
}
Run-Step 'git' @('-C',$RepoRoot,'fetch','origin')
Run-Step 'git' @('-C',$RepoRoot,'checkout','--detach',$UpstreamCommit)

Run-Step $Python @('-m','pip','install','-r',(Join-Path $RepoRoot 'requirements.txt'))
Run-Step $Python @('-m','pip','install','--upgrade','torch==2.8.0','torchvision==0.23.0','torchaudio==2.8.0','--index-url','https://download.pytorch.org/whl/cu128')
Run-Step $Python @('-m','pip','install','huggingface_hub[cli]','modelscope')

$FlashRoot = Join-Path $RuntimeRoot 'flash'
$WanRoot = Join-Path $FlashRoot 'Wan2.1-Fun-V1.1-1.3B-InP'
$AudioRoot = Join-Path $FlashRoot 'chinese-wav2vec2-base'
$TransformerRoot = Join-Path $FlashRoot 'transformer'
New-Item -ItemType Directory -Force -Path $FlashRoot,$TransformerRoot | Out-Null

if (-not (Test-Path (Join-Path $WanRoot 'model_index.json'))) {
  Run-Step $Python @('-m','huggingface_hub.commands.huggingface_cli','download','alibaba-pai/Wan2.1-Fun-V1.1-1.3B-InP','--local-dir',$WanRoot)
}
if (-not (Test-Path (Join-Path $TransformerRoot 'diffusion_pytorch_model.safetensors'))) {
  Run-Step $Python @('-m','huggingface_hub.commands.huggingface_cli','download','BadToBest/EchoMimicV3','echomimicv3-flash-pro/diffusion_pytorch_model.safetensors','--local-dir',$RuntimeRoot)
  $downloaded = Join-Path $RuntimeRoot 'echomimicv3-flash-pro\diffusion_pytorch_model.safetensors'
  if (Test-Path $downloaded) { Move-Item -Force $downloaded (Join-Path $TransformerRoot 'diffusion_pytorch_model.safetensors') }
}
if (-not (Test-Path (Join-Path $AudioRoot 'config.json'))) {
  $code = "from modelscope import snapshot_download; snapshot_download('TencentGameMate/chinese-wav2vec2-base', local_dir=r'$AudioRoot')"
  Run-Step $Python @('-c',$code)
}

Run-Step $Python @('-c','import torch; print("torch",torch.__version__,"cuda",torch.version.cuda,"available",torch.cuda.is_available()); assert torch.cuda.is_available(); print("gpu",torch.cuda.get_device_name(0)); print("vram_gb",round(torch.cuda.get_device_properties(0).total_memory/1024**3,1))')

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
