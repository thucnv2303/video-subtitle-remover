$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$Infer = Join-Path $RuntimeRoot 'repo\infer_flash.py'
$Pipeline = Join-Path $RuntimeRoot 'repo\src\pipeline_wan_fun_inpaint_audio_2512.py'
$Patch = Join-Path $PSScriptRoot 'echomimicv3-mmgp-v523-hook-fix.py'

foreach ($path in @($Python, $Infer, $Pipeline, $Patch)) {
    if (-not (Test-Path $path)) { throw "Missing required path: $path" }
}

& $Python $Patch $Infer $Pipeline
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.3 hook fix transform failed ($LASTEXITCODE)." }

& $Python -m py_compile $Infer $Pipeline
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.3 compile failed ($LASTEXITCODE)." }

$inferText = Get-Content -Raw $Infer
$pipelineText = Get-Content -Raw $Pipeline
$requiredInferMarkers = @(
    'VSR_MMGP_V523_SKIP_DIFFUSERS_HOOK_CLEANUP',
    'VSR_MMGP_V523: MMGP owns model hooks'
)
$requiredPipelineMarkers = @(
    'VSR_MMGP_V523_SKIP_DIFFUSERS_HOOK_CLEANUP',
    'VSR_MMGP_V523: skip maybe_free_model_hooks',
    'VSR_MMGP_V523: pipeline_return'
)
foreach ($marker in $requiredInferMarkers) {
    if (-not $inferText.Contains($marker)) { throw "Missing V5.2.3 infer marker after transform: $marker" }
}
foreach ($marker in $requiredPipelineMarkers) {
    if (-not $pipelineText.Contains($marker)) { throw "Missing V5.2.3 pipeline marker after transform: $marker" }
}

Write-Host '[EchoMimicV3] MMGP V5.2.3 HOOK FIX READY'
Write-Host '[EchoMimicV3] MMGP path skips Diffusers maybe_free_model_hooks after decode; non-MMGP paths retain original cleanup.'
