param(
  [Parameter(Mandatory=$true)][string]$VideoPath,
  [Parameter(Mandatory=$true)][string]$ReferenceImage,
  [string]$WanRoot = "C:\VSR-Wan2.2",
  [string]$CheckpointDir = "C:\VSR-Wan2.2-Animate-14B",
  [string]$OutputRoot = "",
  [int]$Seed = 42,
  [int]$SampleSteps = 20
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Require-File([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "$Label not found: $Path" }
}
function Require-Dir([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "$Label not found: $Path" }
}
function Invoke-Checked([string]$Exe, [string[]]$Args) {
  Write-Host "[WAN037] $Exe $($Args -join ' ')"
  & $Exe @Args
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Exe" }
}

Require-File $VideoPath "Input video"
Require-File $ReferenceImage "Reference image"
Require-Dir $WanRoot "Wan2.2 checkout"
Require-Dir $CheckpointDir "Wan2.2-Animate-14B checkpoint"

$Python = Join-Path $WanRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) { $Python = "python" }
$Generate = Join-Path $WanRoot "generate.py"
$Preprocess = Join-Path $WanRoot "wan\modules\animate\preprocess\preprocess_data.py"
Require-File $Generate "Wan generate.py"
Require-File $Preprocess "Wan Animate preprocessor"

foreach ($cmd in @("ffmpeg", "ffprobe", "nvidia-smi")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "Missing required command: $cmd" }
}

if (-not $OutputRoot) {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $OutputRoot = Join-Path $repoRoot "benchmark-output\wan-animate-037"
}
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$RunDir = Join-Path $OutputRoot $stamp
$ProcessDir = Join-Path $RunDir "process_results"
New-Item -ItemType Directory -Force -Path $ProcessDir | Out-Null

$NormalizedVideo = Join-Path $RunDir "input-480p.mp4"
$RawOutput = Join-Path $RunDir "replace-noaudio.mp4"
$FinalOutput = Join-Path $RunDir "replace-with-source-audio.mp4"
$GpuBefore = Join-Path $RunDir "gpu-before.txt"
$GpuAfter = Join-Path $RunDir "gpu-after.txt"
$Manifest = Join-Path $RunDir "benchmark.json"

$durationText = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 -- "$VideoPath"
$duration = [double]::Parse(($durationText | Select-Object -First 1), [Globalization.CultureInfo]::InvariantCulture)
if ($duration -lt 3.0 -or $duration -gt 5.25) { throw "Benchmark input must be 3-5 seconds (allowing 0.25s container tolerance). Actual: $duration s" }

# 832x480 keeps a 16:9-ish 480p working area while satisfying common latent divisibility.
Invoke-Checked "ffmpeg" @('-y','-i',$VideoPath,'-vf','scale=832:480:force_original_aspect_ratio=decrease,pad=832:480:(ow-iw)/2:(oh-ih)/2','-an','-c:v','libx264','-preset','fast','-crf','18',$NormalizedVideo)

& nvidia-smi | Set-Content -Encoding UTF8 $GpuBefore

Push-Location $WanRoot
try {
  Invoke-Checked $Python @(
    $Preprocess,
    '--ckpt_path',(Join-Path $CheckpointDir 'process_checkpoint'),
    '--video_path',$NormalizedVideo,
    '--refer_path',$ReferenceImage,
    '--save_path',$ProcessDir,
    '--resolution_area','832','480',
    '--iterations','3','--k','7','--w_len','1','--h_len','1','--replace_flag'
  )

  # Official Wan flags are deliberately conservative for 16 GB: CPU T5 + model offload + dtype conversion.
  # This is a benchmark hypothesis, not a claim that 16 GB runtime is already proven.
  Invoke-Checked $Python @(
    $Generate,
    '--task','animate-14B',
    '--ckpt_dir',$CheckpointDir,
    '--src_root_path',$ProcessDir,
    '--refert_num','1',
    '--replace_flag',
    '--use_relighting_lora',
    '--offload_model','True',
    '--convert_model_dtype',
    '--t5_cpu',
    '--sample_steps',"$SampleSteps",
    '--base_seed',"$Seed",
    '--save_file',$RawOutput
  )
} finally {
  Pop-Location
  & nvidia-smi | Set-Content -Encoding UTF8 $GpuAfter
}

Require-File $RawOutput "Wan replacement output"

# Preserve generated video timing; copy source audio without stretching it. -shortest prevents audio overrun.
Invoke-Checked "ffmpeg" @('-y','-i',$RawOutput,'-i',$VideoPath,'-map','0:v:0','-map','1:a?','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',$FinalOutput)
Require-File $FinalOutput "Final benchmark output"

$outDurationText = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 -- "$FinalOutput"
$outDuration = [double]::Parse(($outDurationText | Select-Object -First 1), [Globalization.CultureInfo]::InvariantCulture)
$timingDelta = [math]::Abs($outDuration - $duration)

$gpuName = (& nvidia-smi --query-gpu=name --format=csv,noheader | Select-Object -First 1).Trim()
$manifestObj = [ordered]@{
  task = 'WAN-ANIMATE-BENCHMARK-037'
  mode = 'replace-character'
  backend = 'Wan-Video/Wan2.2 official single-GPU'
  low_vram = @('offload_model=True','convert_model_dtype','t5_cpu','480p working area')
  gpu = $gpuName
  source_duration_seconds = [math]::Round($duration,3)
  output_duration_seconds = [math]::Round($outDuration,3)
  timing_delta_seconds = [math]::Round($timingDelta,3)
  seed = $Seed
  sample_steps = $SampleSteps
  source_video = (Resolve-Path $VideoPath).Path
  reference_image = (Resolve-Path $ReferenceImage).Path
  output_video = (Resolve-Path $FinalOutput).Path
  owner_visual_acceptance = 'WAITING: identity, body motion, background stability require human review'
  oom_acceptance = 'PASS only if this script exits 0 on RTX 5060 Ti 16GB without CUDA OOM'
}
$manifestObj | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $Manifest

Write-Host ""
Write-Host "[WAN037] BENCHMARK OUTPUT READY" -ForegroundColor Green
Write-Host "[WAN037] Video: $FinalOutput"
Write-Host "[WAN037] Manifest: $Manifest"
Write-Host "[WAN037] Timing delta: $([math]::Round($timingDelta,3)) s"
Write-Host "[WAN037] Runtime/quality gates remain WAITING until Owner inspects the real output on RTX 5060 Ti 16GB."
