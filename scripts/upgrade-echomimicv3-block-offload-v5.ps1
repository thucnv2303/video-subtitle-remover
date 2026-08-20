$ErrorActionPreference = 'Stop'

$root = 'C:\VSR-EchoMimicV3'
$repo = Join-Path $root 'repo'
$python = Join-Path $root 'venv\Scripts\python.exe'
$infer = Join-Path $repo 'infer_flash.py'
$pipeline = Join-Path $repo 'src\pipeline_wan_fun_inpaint_audio_2512.py'
$transformer = Join-Path $repo 'src\wan_transformer3d_audio_2512.py'
$patcher = Join-Path $PSScriptRoot 'echomimicv3-block-offload-v5.py'

foreach ($path in @($python, $infer, $pipeline, $transformer, $patcher)) {
    if (-not (Test-Path $path)) { throw "Missing required path: $path" }
}

& $python $patcher $infer $pipeline $transformer
if ($LASTEXITCODE -ne 0) { throw "Block-offload V5 transform failed ($LASTEXITCODE)." }

& $python -m py_compile $infer $pipeline $transformer
if ($LASTEXITCODE -ne 0) { throw "Block-offload V5 compile failed ($LASTEXITCODE)." }

$inferText = Get-Content -Raw $infer
$pipelineText = Get-Content -Raw $pipeline
$transformerText = Get-Content -Raw $transformer
if (-not $inferText.Contains('VSR_BLOCK_OFFLOAD_V5')) { throw 'V5 infer marker missing.' }
if (-not $pipelineText.Contains('VSR_BLOCK_OFFLOAD_V5')) { throw 'V5 pipeline marker missing.' }
if (-not $transformerText.Contains('VSR_BLOCK_OFFLOAD_V5')) { throw 'V5 transformer marker missing.' }

Write-Host '[EchoMimicV3] BLOCK OFFLOAD V5 READY'
Write-Host '[EchoMimicV3] 49-frame Flash benchmark: transformer blocks stream CPU -> CUDA one-at-a-time; VAE/T5/CLIP remain phase-managed.'
