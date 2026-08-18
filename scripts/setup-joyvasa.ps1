param(
  [string]$InstallRoot = "",
  [string]$CondaEnv = "joyvasa"
)

$ErrorActionPreference = "Stop"
$JoyVasaCommit = "916a90f8de490e8648fee460c1200bd5d9a795af"
$RepoUrl = "https://github.com/jdh-algo/JoyVASA.git"
$ModelRepo = "https://huggingface.co/jdh-algo/JoyVASA"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

Require-Command git
Require-Command conda
Require-Command ffmpeg

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not $InstallRoot) { $InstallRoot = Join-Path $RepoRoot "tools\JoyVASA" }
$InstallRoot = [System.IO.Path]::GetFullPath($InstallRoot)

Write-Host "[JoyVASA] target: $InstallRoot"
Write-Host "[JoyVASA] upstream commit: $JoyVasaCommit"

if (-not (Test-Path $InstallRoot)) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $InstallRoot) | Out-Null
  git clone $RepoUrl $InstallRoot
}

Push-Location $InstallRoot
try {
  git fetch origin
  git checkout --detach $JoyVasaCommit

  $envExists = conda env list | Select-String -SimpleMatch $CondaEnv
  if (-not $envExists) {
    conda create -y -n $CondaEnv python=3.10
  }

  conda run -n $CondaEnv python -m pip install --upgrade pip
  conda run -n $CondaEnv python -m pip install -r requirements.txt

  $WeightsRoot = Join-Path $InstallRoot "pretrained_weights"
  New-Item -ItemType Directory -Force -Path $WeightsRoot | Out-Null

  if (-not (Get-Command huggingface-cli -ErrorAction SilentlyContinue)) {
    conda run -n $CondaEnv python -m pip install "huggingface_hub[cli]"
  }

  conda run -n $CondaEnv huggingface-cli download jdh-algo/JoyVASA --local-dir $WeightsRoot

  $Required = @(
    (Join-Path $InstallRoot "inference.py"),
    (Join-Path $WeightsRoot "JoyVASA\motion_generator"),
    (Join-Path $WeightsRoot "liveportrait\base_models")
  )
  foreach ($Item in $Required) {
    if (-not (Test-Path $Item)) { throw "JoyVASA bootstrap incomplete. Missing: $Item" }
  }

  Write-Host "[JoyVASA] READY"
  Write-Host "[JoyVASA] App auto-detect path: $InstallRoot"
  Write-Host "[JoyVASA] Conda environment: $CondaEnv"
} finally {
  Pop-Location
}
