$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$RepoRoot = Join-Path $RuntimeRoot 'repo'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$InferFlash = Join-Path $RepoRoot 'infer_flash.py'
$Pipeline = Join-Path $RepoRoot 'src\pipeline_wan_fun_inpaint_audio_2512.py'
$Transform = Join-Path $PSScriptRoot 'echomimicv3-selective-v3.py'

if (-not (Test-Path $Python)) { throw 'EchoMimicV3 Python runtime missing. Run setup-echomimicv3.ps1 first.' }
if (-not (Test-Path $InferFlash)) { throw "Missing runtime file: $InferFlash" }
if (-not (Test-Path $Pipeline)) { throw "Missing pipeline file: $Pipeline" }
if (-not (Test-Path $Transform)) { throw "Missing V3 transform: $Transform" }

$inferSource = Get-Content -Raw $InferFlash
if (-not $inferSource.Contains('VSR_LOW_VRAM_OFFLOAD_V2') -or -not $inferSource.Contains('VSR_LONG_AUDIO_V2')) {
  throw 'Selective V3 requires the recognized V2 long-audio runtime. Run setup-echomimicv3.ps1 first.'
}

& $Python $Transform $InferFlash $Pipeline
if ($LASTEXITCODE -ne 0) { throw "Selective V3 transform failed ($LASTEXITCODE)." }
& $Python -m py_compile $InferFlash $Pipeline
if ($LASTEXITCODE -ne 0) { throw "Selective V3 py_compile failed ($LASTEXITCODE)." }

$inferSource = Get-Content -Raw $InferFlash
$pipelineSource = Get-Content -Raw $Pipeline
if (-not $inferSource.Contains('VSR_SELECTIVE_GPU_V3')) { throw 'V3 marker missing from infer_flash.py.' }
if (-not $pipelineSource.Contains('VSR_SELECTIVE_GPU_V3')) { throw 'V3 marker missing from pipeline.' }

Write-Host '[EchoMimicV3] SELECTIVE GPU V3 READY'
Write-Host '[EchoMimicV3] T5/VAE/CLIP are phase-resident; transformer stays on CUDA for the denoise loop.'
