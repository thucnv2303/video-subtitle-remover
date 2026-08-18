param(
  [string]$InstallRoot = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$JoyVasaCommit = "916a90f8de490e8648fee460c1200bd5d9a795af"
$RepoUrl = "https://github.com/jdh-algo/JoyVASA.git"
$PythonUrl = "https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe"
$TorchVersion = "2.8.0"
$TorchVisionVersion = "0.23.0"
$TorchAudioVersion = "2.8.0"
$TorchIndex = "https://download.pytorch.org/whl/cu128"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Invoke-Checked([string]$FilePath, [string[]]$Arguments) {
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')"
  }
}

Require-Command git

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not $InstallRoot) { $InstallRoot = Join-Path $RepoRoot "tools\JoyVASA" }
$InstallRoot = [System.IO.Path]::GetFullPath($InstallRoot)
$RuntimeRoot = "C:\VSR-JoyVASA"
$PythonRoot = Join-Path $RuntimeRoot "python310"
$PythonExe = Join-Path $PythonRoot "python.exe"
$VenvRoot = Join-Path $RuntimeRoot "venv"
$VenvPython = Join-Path $VenvRoot "Scripts\python.exe"
$Installer = Join-Path $env:TEMP "vsr-python310-installer.exe"
$HfExe = Join-Path $VenvRoot "Scripts\huggingface-cli.exe"
$FilteredRequirements = Join-Path $RuntimeRoot "joyvasa-requirements-runtime.txt"

New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null

if (-not (Test-Path $PythonExe)) {
  Write-Host "[JoyVASA] Python 3.10 not found. Installing runtime to $PythonRoot ..."
  Invoke-WebRequest -Uri $PythonUrl -OutFile $Installer -UseBasicParsing
  $args = @('/quiet', 'InstallAllUsers=0', 'PrependPath=0', 'Include_test=0', 'Include_launcher=0', "TargetDir=$PythonRoot")
  $proc = Start-Process -FilePath $Installer -ArgumentList $args -Wait -PassThru
  if ($proc.ExitCode -ne 0 -or -not (Test-Path $PythonExe)) {
    throw "Local Python 3.10 installation failed with exit code $($proc.ExitCode)."
  }
  Remove-Item $Installer -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path $VenvPython)) {
  Write-Host "[JoyVASA] Creating isolated venv..."
  Invoke-Checked $PythonExe @('-m', 'venv', $VenvRoot)
}

Write-Host "[JoyVASA] target: $InstallRoot"
Write-Host "[JoyVASA] upstream commit: $JoyVasaCommit"
Write-Host "[JoyVASA] runtime python: $VenvPython"
Write-Host "[JoyVASA] Blackwell torch: $TorchVersion + CUDA 12.8"

if (-not (Test-Path (Join-Path $InstallRoot ".git"))) {
  if (Test-Path $InstallRoot) {
    throw "JoyVASA target exists but is not a git checkout: $InstallRoot"
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $InstallRoot) | Out-Null
  Invoke-Checked git @('clone', $RepoUrl, $InstallRoot)
}

Push-Location $InstallRoot
try {
  Invoke-Checked git @('fetch', 'origin')
  Invoke-Checked git @('checkout', '--detach', $JoyVasaCommit)

  Invoke-Checked $VenvPython @('-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel')

  # JoyVASA upstream pins torch 2.2.2 / xformers 0.0.25 / bitsandbytes 0.43.1.
  # Those pins predate RTX 50-series Blackwell (sm_120). Install all non-Torch deps,
  # then install an official CUDA 12.8 PyTorch wheel that supports Blackwell.
  $skip = '^(torch|torchvision|torchaudio|xformers|bitsandbytes)([=<>!~ ].*)?$'
  Get-Content (Join-Path $InstallRoot 'requirements.txt') |
    Where-Object { $_.Trim() -and $_.Trim() -notmatch '^--find-links' -and $_.Trim() -notmatch $skip } |
    Set-Content -Encoding UTF8 $FilteredRequirements

  Write-Host "[JoyVASA] Installing upstream dependencies without legacy Torch pins..."
  Invoke-Checked $VenvPython @('-m', 'pip', 'install', '-r', $FilteredRequirements)

  Write-Host "[JoyVASA] Installing official PyTorch CUDA 12.8 for RTX 50-series..."
  Invoke-Checked $VenvPython @('-m', 'pip', 'install', '--upgrade', '--force-reinstall', "torch==$TorchVersion", "torchvision==$TorchVisionVersion", "torchaudio==$TorchAudioVersion", '--index-url', $TorchIndex)
  Invoke-Checked $VenvPython @('-m', 'pip', 'install', 'huggingface_hub[cli]')

  $WeightsRoot = Join-Path $InstallRoot "pretrained_weights"
  $JoyWeights = Join-Path $WeightsRoot "JoyVASA"
  $HubertWeights = Join-Path $WeightsRoot "chinese-hubert-base"
  New-Item -ItemType Directory -Force -Path $WeightsRoot | Out-Null

  Write-Host "[JoyVASA] Downloading motion generator weights..."
  Invoke-Checked $HfExe @('download', 'jdh-algo/JoyVASA', '--local-dir', $JoyWeights)

  Write-Host "[JoyVASA] Downloading Chinese HuBERT audio encoder..."
  Invoke-Checked $HfExe @('download', 'TencentGameMate/chinese-hubert-base', '--local-dir', $HubertWeights)

  Write-Host "[JoyVASA] Downloading LivePortrait weights..."
  Invoke-Checked $HfExe @('download', 'KwaiVGI/LivePortrait', '--local-dir', $WeightsRoot, '--exclude', '*.git*', 'README.md', 'docs/*')

  $Required = @(
    (Join-Path $InstallRoot "inference.py"),
    (Join-Path $JoyWeights "motion_generator"),
    (Join-Path $JoyWeights "motion_template"),
    (Join-Path $HubertWeights "config.json"),
    (Join-Path $WeightsRoot "liveportrait\base_models"),
    (Join-Path $WeightsRoot "liveportrait\retargeting_models")
  )
  foreach ($Item in $Required) {
    if (-not (Test-Path $Item)) { throw "JoyVASA bootstrap incomplete. Missing: $Item" }
  }

  Write-Host "[JoyVASA] Verifying CUDA runtime..."
  Invoke-Checked $VenvPython @('-c', 'import torch; print("torch", torch.__version__, "cuda", torch.version.cuda, "available", torch.cuda.is_available()); assert torch.cuda.is_available(); print("gpu", torch.cuda.get_device_name(0)); print("capability", torch.cuda.get_device_capability(0)); x=torch.ones(1, device="cuda"); print("cuda-smoke", x.item())')

  Write-Host ""
  Write-Host "[JoyVASA] READY" -ForegroundColor Green
  Write-Host "[JoyVASA] Engine: $InstallRoot"
  Write-Host "[JoyVASA] Python: $VenvPython"
  Write-Host "[JoyVASA] Torch: $TorchVersion / cu128"
} finally {
  Pop-Location
}
