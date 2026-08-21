$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$InferFlash = Join-Path $RepoRoot 'infer_flash.py'
$Transform = Join-Path $PSScriptRoot 'echomimicv3-mmgp-v521-index-fix.py'

if (-not (Test-Path $Python)) { throw 'EchoMimicV3 runtime missing.' }
if (-not (Test-Path $InferFlash)) { throw "Missing runtime infer_flash.py: $InferFlash" }
if (-not (Test-Path $Transform)) { throw "Missing V5.2.1 transform: $Transform" }
if (-not (Select-String -Path $InferFlash -Pattern 'VSR_MMGP_V52' -Quiet)) { throw 'MMGP V5.2 runtime is not installed.' }

& $Python $Transform $InferFlash
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.1 index fix failed ($LASTEXITCODE)." }

& $Python -m py_compile $InferFlash
if ($LASTEXITCODE -ne 0) { throw "infer_flash.py compile failed ($LASTEXITCODE)." }

if (-not (Select-String -Path $InferFlash -Pattern 'VSR_MMGP_V521_CPU_INDICES' -Quiet)) { throw 'V5.2.1 marker missing after transform.' }

Write-Host '[EchoMimicV3] MMGP V5.2.1 READY'
Write-Host '[EchoMimicV3] Wav2Vec indexing remains on CPU; only gathered audio embeddings transfer to CUDA.'
