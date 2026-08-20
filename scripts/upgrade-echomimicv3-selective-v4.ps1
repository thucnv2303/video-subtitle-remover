$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$InferFlash = Join-Path $RepoRoot 'infer_flash.py'
$Pipeline = Join-Path $RepoRoot 'src\pipeline_wan_fun_inpaint_audio_2512.py'
$Transform = Join-Path $PSScriptRoot 'echomimicv3-selective-v4.py'

if (-not (Test-Path $Python)) { throw 'EchoMimicV3 Python runtime missing.' }
if (-not (Test-Path $InferFlash)) { throw "Missing runtime file: $InferFlash" }
if (-not (Test-Path $Pipeline)) { throw "Missing pipeline file: $Pipeline" }
if (-not (Test-Path $Transform)) { throw "Missing V4 transform: $Transform" }

$inferSource = Get-Content -Raw $InferFlash
$pipelineSource = Get-Content -Raw $Pipeline
if (-not $inferSource.Contains('VSR_SELECTIVE_GPU_V3') -or -not $pipelineSource.Contains('VSR_SELECTIVE_GPU_V3')) {
  throw 'Selective V4 requires the recognized V3 runtime. Run upgrade-echomimicv3-selective-v3.ps1 first.'
}

& $Python $Transform $InferFlash $Pipeline
if ($LASTEXITCODE -ne 0) { throw "Selective V4 transform failed ($LASTEXITCODE)." }
& $Python -m py_compile $InferFlash $Pipeline
if ($LASTEXITCODE -ne 0) { throw "Selective V4 py_compile failed ($LASTEXITCODE)." }

$inferSource = Get-Content -Raw $InferFlash
$pipelineSource = Get-Content -Raw $Pipeline
if (-not $inferSource.Contains('VSR_SELECTIVE_GPU_V4')) { throw 'V4 marker missing from infer_flash.py.' }
if (-not $pipelineSource.Contains('VSR_SELECTIVE_GPU_V4')) { throw 'V4 marker missing from pipeline.' }
if ($inferSource.Contains('VSR_SELECTIVE_GPU_V3') -or $pipelineSource.Contains('VSR_SELECTIVE_GPU_V3')) { throw 'Stale V3 marker remains after V4 migration.' }

Write-Host '[EchoMimicV3] SELECTIVE GPU V4 READY'
Write-Host '[EchoMimicV3] T5/CLIP stay on CPU; embeddings/context move to CUDA; VAE is phase-resident; transformer stays on CUDA for denoise.'
