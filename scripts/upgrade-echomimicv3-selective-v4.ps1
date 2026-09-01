$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$InferFlash = Join-Path $RepoRoot 'infer_flash.py'
$Pipeline = Join-Path $RepoRoot 'src\pipeline_wan_fun_inpaint_audio_2512.py'
$Transform = Join-Path $PSScriptRoot 'echomimicv3-selective-v4.py'

if (-not (Test-Path $Python)) { throw 'EchoMimicV3 Python runtime missing.' }
if (-not (Test-Path $InferFlash)) { throw "Missing runtime file: $InferFlash" }
if (-not (Test-Path $Pipeline)) { throw "Missing runtime file: $Pipeline" }
if (-not (Test-Path $Transform)) { throw "Missing V4 transform: $Transform" }

$inferSource = Get-Content -Raw $InferFlash
$pipelineSource = Get-Content -Raw $Pipeline
$inferV3 = $inferSource.Contains('VSR_SELECTIVE_GPU_V3')
$inferV4 = $inferSource.Contains('VSR_SELECTIVE_GPU_V4')
$pipelineV3 = $pipelineSource.Contains('VSR_SELECTIVE_GPU_V3')
$pipelineV4 = $pipelineSource.Contains('VSR_SELECTIVE_GPU_V4')

if ($inferV4 -and $pipelineV4) {
  Write-Host '[EchoMimicV3] Selective GPU V4 already applied to infer and pipeline.'
} elseif ($inferV3 -and $pipelineV3) {
  Write-Host '[EchoMimicV3] Migrating recognized V3 runtime -> V4.'
  & $Python $Transform $InferFlash $Pipeline
  if ($LASTEXITCODE -ne 0) { throw "Selective V4 transform failed ($LASTEXITCODE)." }
} elseif ($inferV4 -and $pipelineV3) {
  Write-Host '[EchoMimicV3] Recovering recognized partial V4 migration: infer=V4, pipeline=V3.'
  & $Python $Transform $InferFlash $Pipeline
  if ($LASTEXITCODE -ne 0) { throw "Selective V4 recovery transform failed ($LASTEXITCODE)." }
} else {
  throw "Unrecognized selective runtime state; refusing migration. inferV3=$inferV3 inferV4=$inferV4 pipelineV3=$pipelineV3 pipelineV4=$pipelineV4"
}

& $Python -m py_compile $InferFlash $Pipeline
if ($LASTEXITCODE -ne 0) { throw "Selective V4 py_compile failed ($LASTEXITCODE)." }

$inferSource = Get-Content -Raw $InferFlash
$pipelineSource = Get-Content -Raw $Pipeline
if (-not $inferSource.Contains('VSR_SELECTIVE_GPU_V4')) { throw 'V4 marker missing from infer_flash.py.' }
if (-not $pipelineSource.Contains('VSR_SELECTIVE_GPU_V4')) { throw 'V4 marker missing from pipeline.' }
if ($inferSource.Contains('VSR_SELECTIVE_GPU_V3') -or $pipelineSource.Contains('VSR_SELECTIVE_GPU_V3')) { throw 'Stale V3 marker remains after V4 migration.' }

Write-Host '[EchoMimicV3] SELECTIVE GPU V4 READY'
Write-Host '[EchoMimicV3] T5/CLIP stay on CPU; embeddings/context move to CUDA; VAE is phase-resident; transformer stays on CUDA for denoise.'
