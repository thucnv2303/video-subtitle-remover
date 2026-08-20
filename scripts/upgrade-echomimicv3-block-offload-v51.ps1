$ErrorActionPreference = 'Stop'

$root = 'C:\VSR-EchoMimicV3'
$repo = Join-Path $root 'repo'
$python = Join-Path $root 'venv\Scripts\python.exe'
$pipeline = Join-Path $repo 'src\pipeline_wan_fun_inpaint_audio_2512.py'
$patcher = Join-Path $PSScriptRoot 'echomimicv3-block-offload-v51.py'

foreach ($path in @($python, $pipeline, $patcher)) {
    if (-not (Test-Path $path)) { throw "Missing required path: $path" }
}

& $python $patcher $pipeline
if ($LASTEXITCODE -ne 0) { throw "Block-offload V5.1 transform failed ($LASTEXITCODE)." }

& $python -m py_compile $pipeline
if ($LASTEXITCODE -ne 0) { throw "Block-offload V5.1 compile failed ($LASTEXITCODE)." }

$pipelineText = Get-Content -Raw $pipeline
if (-not $pipelineText.Contains('VSR_BLOCK_OFFLOAD_V5')) { throw 'V5 pipeline marker missing.' }
if (-not $pipelineText.Contains('VSR_BLOCK_OFFLOAD_V51_CLIP_GPU')) { throw 'V5.1 CLIP GPU marker missing.' }

Write-Host '[EchoMimicV3] BLOCK OFFLOAD V5.1 READY'
Write-Host '[EchoMimicV3] CLIP is CUDA phase-resident, then returned to CPU before transformer block streaming.'
