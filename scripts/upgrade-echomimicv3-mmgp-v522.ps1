$ErrorActionPreference = 'Stop'

$RuntimeRoot = 'C:\VSR-EchoMimicV3'
$Python = Join-Path $RuntimeRoot 'venv\Scripts\python.exe'
$Pipeline = Join-Path $RuntimeRoot 'repo\src\pipeline_wan_fun_inpaint_audio_2512.py'
$Probe = Join-Path $PSScriptRoot 'echomimicv3-mmgp-v522-decode-probe.py'

foreach ($path in @($Python, $Pipeline, $Probe)) {
    if (-not (Test-Path $path)) { throw "Missing required path: $path" }
}

& $Python $Probe $Pipeline
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.2 decode probe transform failed ($LASTEXITCODE)." }

& $Python -m py_compile $Pipeline
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.2 pipeline compile failed ($LASTEXITCODE)." }

$pipelineText = Get-Content -Raw $Pipeline
$requiredMarkers = @(
    'VSR_MMGP_V522_DECODE_PROBE',
    'VSR_MMGP_V522: vae_decode_enter',
    'VSR_MMGP_V522: vae_decode_done',
    'VSR_MMGP_V522: frames_cpu_begin',
    'VSR_MMGP_V522: frames_cpu_done'
)
foreach ($marker in $requiredMarkers) {
    if (-not $pipelineText.Contains($marker)) { throw "Missing V5.2.2 marker after transform: $marker" }
}

Write-Host '[EchoMimicV3] MMGP V5.2.2 DECODE PROBE READY'
Write-Host '[EchoMimicV3] Probe only: timestamps VAE decode and GPU->CPU frame materialization; render logic is otherwise unchanged.'
