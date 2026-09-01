$ErrorActionPreference = "Stop"

$Root = "C:\VSR-EchoMimicV3"
$Repo = Join-Path $Root "repo"
$VenvPython = Join-Path $Root "venv\Scripts\python.exe"
$Infer = Join-Path $Repo "infer_flash.py"
$Patcher = Join-Path $PSScriptRoot "echomimicv3-mmgp-v525-postreturn-probe.py"

foreach ($Path in @($VenvPython, $Infer, $Patcher)) {
    if (-not (Test-Path $Path)) { throw "Missing required path: $Path" }
}

& $VenvPython $Patcher $Infer
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.5 patch failed with exit code $LASTEXITCODE" }

& $VenvPython -m py_compile $Infer
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.5 syntax verification failed" }

$InferText = Get-Content -Raw -LiteralPath $Infer
if ($InferText -notmatch "VSR_MMGP_V525_POSTRETURN_PROBE") { throw "Infer V5.2.5 marker missing" }

Write-Host "[EchoMimicV3] MMGP V5.2.5 POST-RETURN PROBE READY"
Write-Host "[EchoMimicV3] Benchmark stops after chunk 1 before postprocess and flushes timing/peak markers."
