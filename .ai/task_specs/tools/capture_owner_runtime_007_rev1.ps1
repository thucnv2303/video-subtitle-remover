$ErrorActionPreference = 'Stop'

$root = 'E:\Project AI'
$runtime = 'E:\Project AI\Video-sub-remove'
$canonicalBasis = 'fd880a625ba6a43acf25f5556f6c97ba20c84026'
$outputRel = '.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1.json'
$outputPath = Join-Path (Get-Location) $outputRel

function Invoke-GitLines {
    param([string[]]$Args)
    $result = & git -C $runtime @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git failed: git -C $runtime $($Args -join ' ') :: $($result -join ' | ')"
    }
    return @($result | ForEach-Object { [string]$_ })
}

if (-not (Test-Path -LiteralPath $runtime -PathType Container)) {
    throw "Owner runtime not found: $runtime"
}

$head = (Invoke-GitLines @('rev-parse','HEAD'))[0]
$branchRaw = ((Invoke-GitLines @('branch','--show-current')) -join '').Trim()
$branchState = if ([string]::IsNullOrWhiteSpace($branchRaw)) { 'DETACHED' } else { $branchRaw }

$critical = @(
    'package.json',
    'src/main/main.js',
    'src/main/preload.js',
    'src/renderer/index.html',
    'src/renderer/styles/main.css',
    'src/renderer/js/app.js',
    'src/renderer/js/components/settings.js',
    'src/renderer/js/pipelines/pipeline1-ai.js',
    'src/renderer/js/pipelines/pipeline2-remove.js',
    'src/renderer/js/pipelines/pipeline3-finalize.js',
    'api/server.py'
)

$criticalResults = foreach ($rel in $critical) {
    $abs = Join-Path $runtime $rel
    if (Test-Path -LiteralPath $abs -PathType Leaf) {
        $hash = (& git -C $runtime hash-object -- $rel 2>&1)
        if ($LASTEXITCODE -ne 0) { throw "hash-object failed: $rel" }
        [ordered]@{ path = $rel; exists = $true; git_blob = ([string]$hash).Trim() }
    } else {
        [ordered]@{ path = $rel; exists = $false; git_blob = $null }
    }
}

$topDirs = Get-ChildItem -LiteralPath $root -Directory -Force -ErrorAction Stop |
    Sort-Object FullName |
    ForEach-Object {
        [ordered]@{
            name = $_.Name
            full_path = $_.FullName
            last_write_utc = $_.LastWriteTimeUtc.ToString('o')
        }
    }

$packageFiles = Get-ChildItem -LiteralPath $root -Filter package.json -File -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\' -and
        $_.FullName -notmatch '\\.git\\' -and
        $_.FullName -notmatch '\\.venv\\' -and
        $_.FullName -notmatch '\\venv\\'
    } |
    Sort-Object FullName

$runnableCandidates = foreach ($file in $packageFiles) {
    $name = $null
    $parseError = $null
    try {
        $json = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        $name = [string]$json.name
    } catch {
        $parseError = $_.Exception.Message
    }
    if ($name -eq 'video-subtitle-remover' -or $file.FullName -match '(?i)video-sub-remove|video-subtitle-remover') {
        [ordered]@{
            package_json = $file.FullName
            project_root = $file.Directory.FullName
            package_name = $name
            parse_error = $parseError
            is_owner_runtime = ($file.Directory.FullName.TrimEnd('\\') -ieq $runtime.TrimEnd('\\'))
        }
    }
}

$record = [ordered]@{
    schema_version = 1
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    root = $root
    owner_runtime = [ordered]@{
        path = $runtime
        head = $head
        branch_or_detached = $branchState
        remotes = (Invoke-GitLines @('remote','-v'))
        status_porcelain_v2 = (Invoke-GitLines @('status','--porcelain=v2','--branch'))
        unstaged_name_status = (Invoke-GitLines @('diff','--name-status'))
        staged_name_status = (Invoke-GitLines @('diff','--cached','--name-status'))
        untracked = (Invoke-GitLines @('ls-files','--others','--exclude-standard'))
        worktrees = (Invoke-GitLines @('worktree','list','--porcelain'))
        local_branches = (Invoke-GitLines @('branch','--format=%(refname:short) %(objectname)'))
        remote_branches = (Invoke-GitLines @('branch','-r','--format=%(refname:short) %(objectname)'))
        diff_name_status_vs_canonical_basis = (Invoke-GitLines @('diff','--name-status',$canonicalBasis))
        runtime_critical = $criticalResults
    }
    canonical_basis = $canonicalBasis
    top_level_directories = @($topDirs)
    vsr_runnable_candidates = @($runnableCandidates)
    safety = [ordered]@{
        no_cleanup_performed = $true
        owner_runtime_must_not_be_deleted = $true
        non_vsr_projects_default = 'DO_NOT_TOUCH'
    }
}

$outDir = Split-Path -Parent $outputPath
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
$jsonText = $record | ConvertTo-Json -Depth 12
[System.IO.File]::WriteAllText($outputPath, $jsonText, [System.Text.UTF8Encoding]::new($false))
Write-Output $outputRel
