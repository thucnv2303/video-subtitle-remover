$ErrorActionPreference = "Stop"

$Root = "C:\VSR-EchoMimicV3"
$Repo = Join-Path $Root "repo"
$VenvPython = Join-Path $Root "venv\Scripts\python.exe"
$Infer = Join-Path $Repo "infer_flash.py"
$Pipeline = Join-Path $Repo "src\pipeline_wan_fun_inpaint_audio_2512.py"
$Patcher = Join-Path $PSScriptRoot "echomimicv3-mmgp-v524-return-fix.py"

foreach ($Path in @($VenvPython, $Infer, $Pipeline, $Patcher)) {
    if (-not (Test-Path $Path)) { throw "Missing required path: $Path" }
}

& $VenvPython $Patcher $Infer $Pipeline
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.4 patch failed with exit code $LASTEXITCODE" }

& $VenvPython -m py_compile $Infer $Pipeline
if ($LASTEXITCODE -ne 0) { throw "MMGP V5.2.4 syntax verification failed" }

$InferText = Get-Content -Raw -LiteralPath $Infer
$PipelineText = Get-Content -Raw -LiteralPath $Pipeline
if ($InferText -notmatch "VSR_MMGP_V524_TUPLE_RETURN") { throw "Infer V5.2.4 marker missing" }
if ($PipelineText -notmatch "VSR_MMGP_V524_TUPLE_RETURN") { throw "Pipeline V5.2.4 marker missing" }

Write-Host "[EchoMimicV3] MMGP V5.2.4 RETURN FIX READY"
Write-Host "[EchoMimicV3] MMGP benchmark now bypasses Diffusers BaseOutput and returns the decoded tensor tuple directly."
