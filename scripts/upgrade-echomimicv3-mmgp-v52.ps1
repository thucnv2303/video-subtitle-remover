$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$InferFlash = Join-Path $RepoRoot 'infer_flash.py'
$Transform = Join-Path $PSScriptRoot 'echomimicv3-mmgp-v52.py'

if (-not (Test-Path $Python)) { throw 'EchoMimicV3 runtime missing. Run scripts/setup-echomimicv3.ps1 first.' }
if (-not (Test-Path $InferFlash)) { throw "Missing runtime infer_flash.py: $InferFlash" }
if (-not (Test-Path $Transform)) { throw "Missing V5.2 transform: $Transform" }

Write-Host '[EchoMimicV3] Installing MMGP for V5.2 benchmark.'
& $Python -m pip install --upgrade "mmgp>=3.6.4"
if ($LASTEXITCODE -ne 0) { throw "MMGP install failed ($LASTEXITCODE)." }

& $Python -c "import mmgp; print('[EchoMimicV3] mmgp import OK')"
if ($LASTEXITCODE -ne 0) { throw "MMGP import failed ($LASTEXITCODE)." }

& $Python $Transform $InferFlash
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2 transform failed ($LASTEXITCODE)." }

& $Python -m py_compile $InferFlash
if ($LASTEXITCODE -ne 0) { throw "infer_flash.py compile failed ($LASTEXITCODE)." }

if (-not (Select-String -Path $InferFlash -Pattern 'VSR_MMGP_V52' -Quiet)) { throw 'MMGP V5.2 marker missing after transform.' }

Write-Host '[EchoMimicV3] MMGP V5.2 READY'
Write-Host '[EchoMimicV3] Benchmark mode: LowRAM_HighVRAM, 90% VRAM budget, 49 frames first.'
