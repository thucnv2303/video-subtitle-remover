param(
  [string]$InstallRoot = "",
  [string]$CondaEnv = "joyvasa"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$JoyVasaCommit = "916a90f8de490e8648fee460c1200bd5d9a795af"
$RepoUrl = "https://github.com/jdh-algo/JoyVASA.git"
$MinicondaUrl = "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"

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
$ToolsRoot = Join-Path $RepoRoot "tools"
$MinicondaRoot = Join-Path $ToolsRoot "miniconda3"
$CondaExe = Join-Path $MinicondaRoot "Scripts\conda.exe"
$EnvPython = Join-Path $MinicondaRoot "envs\$CondaEnv\python.exe"
$Installer = Join-Path $env:TEMP "vsr-miniconda-installer.exe"

New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null

if (-not (Test-Path $CondaExe)) {
  Write-Host "[JoyVASA] Conda not found. Installing project-local Miniconda..."
  Invoke-WebRequest -Uri $MinicondaUrl -OutFile $Installer -UseBasicParsing
  $proc = Start-Process -FilePath $Installer -ArgumentList @('/InstallationType=JustMe', '/RegisterPython=0', '/AddToPath=0', '/S', "/D=$MinicondaRoot") -Wait -PassThru
  if ($proc.ExitCode -ne 0 -or -not (Test-Path $CondaExe)) {
    throw "Local Miniconda installation failed with exit code $($proc.ExitCode)."
  }
  Remove-Item $Installer -Force -ErrorAction SilentlyContinue
}

Write-Host "[JoyVASA] target: $InstallRoot"
Write-Host "[JoyVASA] upstream commit: $JoyVasaCommit"
Write-Host "[JoyVASA] local conda: $CondaExe"

if (-not (Test-Path (Join-Path $InstallRoot ".git"))) {
  if (Test-Path $InstallRoot) {
    throw "JoyVASA target exists but is not a git checkout: $InstallRoot"
  }
  Invoke-Checked git @('clone', $RepoUrl, $InstallRoot)
}

Push-Location $InstallRoot
try {
  Invoke-Checked git @('fetch', 'origin')
  Invoke-Checked git @('checkout', '--detach', $JoyVasaCommit)

  if (-not (Test-Path $EnvPython)) {
    Invoke-Checked $CondaExe @('create', '-y', '-n', $CondaEnv, 'python=3.10', 'ffmpeg', '-c', 'conda-forge')
  }

  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'python', '-m', 'pip', 'install', '--upgrade', 'pip')
  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'python', '-m', 'pip', 'install', '-r', 'requirements.txt')
  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'python', '-m', 'pip', 'install', 'huggingface_hub[cli]')

  $WeightsRoot = Join-Path $InstallRoot "pretrained_weights"
  New-Item -ItemType Directory -Force -Path $WeightsRoot | Out-Null

  $JoyWeights = Join-Path $WeightsRoot "JoyVASA"
  $HubertWeights = Join-Path $WeightsRoot "chinese-hubert-base"

  Write-Host "[JoyVASA] Downloading motion generator weights..."
  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'huggingface-cli', 'download', 'jdh-algo/JoyVASA', '--local-dir', $JoyWeights)

  Write-Host "[JoyVASA] Downloading Chinese HuBERT audio encoder..."
  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'huggingface-cli', 'download', 'TencentGameMate/chinese-hubert-base', '--local-dir', $HubertWeights)

  Write-Host "[JoyVASA] Downloading LivePortrait weights..."
  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'huggingface-cli', 'download', 'KwaiVGI/LivePortrait', '--local-dir', $WeightsRoot, '--exclude', '*.git*', 'README.md', 'docs/*')

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

  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'python', '--version')
  Invoke-Checked $CondaExe @('run', '-n', $CondaEnv, 'ffmpeg', '-version')

  Write-Host ""
  Write-Host "[JoyVASA] READY" -ForegroundColor Green
  Write-Host "[JoyVASA] Engine: $InstallRoot"
  Write-Host "[JoyVASA] Python: $EnvPython"
  Write-Host "[JoyVASA] App will auto-detect this project-local runtime."
} finally {
  Pop-Location
}
