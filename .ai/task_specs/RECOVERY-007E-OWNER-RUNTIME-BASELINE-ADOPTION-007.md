# RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007

## Status
ACTIVE — READ-ONLY CAPTURE + EVIDENCE PUBLICATION ONLY

## Owner decision
The Owner explicitly chooses the app currently launched from:

`E:\Project AI\Video-sub-remove`

as the candidate product baseline to continue from.

The goal is to stop switching between multiple local/test versions. After this capture is reviewed, a separate cleanup/adoption task will make one runtime copy authoritative and remove/archive obsolete test copies only from an approved manifest.

## Hard boundary
This task DOES NOT delete, clean, repair, checkout, restore, reset, move, rename, overwrite, or modify the current runtime folder.

This task DOES NOT modify application source, tests, dependencies, configuration, canonical dynamic docs, or existing local files.

This task DOES NOT run the app.

This task DOES NOT start 036-A/B/C/D.

If any command fails unexpectedly, STOP. Do not self-repair.

## Authority
Repository: `thucnv2303/video-subtitle-remover`

Canonical branch entering this task:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical GitHub basis:
`fd880a625ba6a43acf25f5556f6c97ba20c84026`

Review branch:
`review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007`

Local runtime candidate:
`E:\Project AI\Video-sub-remove`

Evidence publication worktree:
`E:\Project AI\_evidence\007-owner-runtime-baseline-adoption`

Evidence report:
`.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007.md`

## Required capture
Capture and report, without changing anything:

1. Exact local runtime repository identity:
   - absolute path;
   - current HEAD;
   - current branch or detached state;
   - origin remotes;
   - full `git status --porcelain=v2 --branch`;
   - unstaged changed-file names;
   - staged changed-file names;
   - untracked file names.

2. Exact runtime-critical file identity for the local copy:
   - `package.json`
   - `src/main/main.js`
   - `src/main/preload.js`
   - `src/renderer/index.html`
   - `src/renderer/styles/main.css`
   - `src/renderer/js/app.js`
   - `src/renderer/js/components/settings.js`
   - `src/renderer/js/pipelines/pipeline1-ai.js`
   - `src/renderer/js/pipelines/pipeline2-remove.js`
   - `src/renderer/js/pipelines/pipeline3-finalize.js`
   - `api/server.py`

   Record existence and Git blob/hash where possible. Do not edit missing files.

3. Compare the local runtime candidate against canonical GitHub basis only to identify divergence. Do NOT treat canonical content as preferred over the Owner-selected local runtime. The Owner-selected local runtime is the candidate baseline subject to PM review.

4. Inventory all linked Git worktrees from the local repository.

5. Inventory top-level directories under `E:\Project AI` and locate other `package.json` files under `E:\Project AI` that could represent runnable/test copies.

6. Inventory local branches and remote-tracking branches.

7. Build cleanup classification. Every discovered runtime/test copy, worktree, obvious temporary recovery copy, and untracked test/patch artifact must be classified as one of:
   - KEEP — candidate runtime or required evidence;
   - ARCHIVE — preserve but not runnable;
   - DELETE-CANDIDATE — may be removed only in a later approved cleanup task;
   - UNKNOWN — needs PM decision.

8. The report must explicitly state:
   - whether `E:\Project AI\Video-sub-remove` is internally self-consistent enough to preserve as the candidate baseline;
   - whether its visible Settings UI can be explained by its own local files;
   - whether there are multiple runnable copies/worktrees that can cause version confusion;
   - exact items proposed for later cleanup;
   - any item that must NOT be deleted.

## Single-version target policy to include in the report
Propose this forward policy, with any evidence-based caveats:

- Owner runtime directory: exactly `E:\Project AI\Video-sub-remove`.
- Owner launches the app only from that directory.
- One canonical product branch will be designated after the local candidate is safely captured and promoted.
- Review/audit worktrees are temporary executor workspaces and are never used by the Owner to launch the app.
- Old test/recovery copies are archived or deleted only from an explicit reviewed manifest.
- Historical Git commits/closed PRs remain history; they are not runtime versions and are not rewritten.
- No future task may silently switch the Owner runtime directory or canonical product branch.

## Positive command whitelist
Only the following command forms are authorized. No decorative output commands.

### Remote authority
- `git fetch origin`
- `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007:.ai/task_specs/ACTIVE.md"`
- `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007.md"`
- `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007"`

### Read-only local runtime capture
- `Test-Path "E:\Project AI\Video-sub-remove"`
- `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`
- `git -C "E:\Project AI\Video-sub-remove" branch --show-current`
- `git -C "E:\Project AI\Video-sub-remove" remote -v`
- `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`
- `git -C "E:\Project AI\Video-sub-remove" diff --name-status`
- `git -C "E:\Project AI\Video-sub-remove" diff --cached --name-status`
- `git -C "E:\Project AI\Video-sub-remove" ls-files --others --exclude-standard`
- `git -C "E:\Project AI\Video-sub-remove" worktree list --porcelain`
- `git -C "E:\Project AI\Video-sub-remove" branch --format="%(refname:short) %(objectname)"`
- `git -C "E:\Project AI\Video-sub-remove" branch -r --format="%(refname:short) %(objectname)"`
- `git -C "E:\Project AI\Video-sub-remove" diff --name-status fd880a625ba6a43acf25f5556f6c97ba20c84026`
- `git -C "E:\Project AI\Video-sub-remove" hash-object <one exact runtime-critical path listed in this spec>`
- `Test-Path <one exact runtime-critical path listed in this spec>`
- `Get-ChildItem -Path "E:\Project AI" -Directory | Select-Object FullName,LastWriteTime`
- `Get-ChildItem -Path "E:\Project AI" -Filter package.json -File -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName`

Do not expand filesystem search outside `E:\Project AI`.

### Evidence publication
- `Test-Path "E:\Project AI\_evidence\007-owner-runtime-baseline-adoption"`
- `git worktree add --detach "E:\Project AI\_evidence\007-owner-runtime-baseline-adoption" <captured remote review HEAD>`
- `Set-Location "E:\Project AI\_evidence\007-owner-runtime-baseline-adoption"`
- `$PWD.Path`
- `git rev-parse HEAD`
- `git status --short`
- `git add ".ai/incidents/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007.md"`
- `git diff --cached --name-only`
- `git diff --cached --check`
- `git fetch origin`
- `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007"`
- `git commit -m "docs: publish owner runtime baseline adoption 007 inventory"`
- `git push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007`

The evidence report itself must be created with editor/write-file capability, not shell redirection, `Set-Content`, `Out-File`, Python/Node/PowerShell generator, or whole-file replacement script.

## Publication gates
Before commit:
- exactly one executor-created file is changed: `.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007.md`;
- no application source/test/config/dependency/dynamic canonical doc changed;
- cached diff check passes;
- remote review HEAD still equals the captured execution base.

Push must be normal fast-forward only. No force push.

## Forbidden actions
- no delete/remove/rmdir/Remove-Item;
- no `git clean`;
- no `git reset`;
- no `git restore`;
- no `git checkout`;
- no `git switch`;
- no `git rebase`;
- no `git amend`;
- no `git worktree remove`;
- no force push;
- no `git add .` or `git add -A`;
- no application launch;
- no npm install/update;
- no source/test/config/dependency edits;
- no cleanup yet;
- no 036-A/B/C/D;
- no merge.

## Final report schema
Return:
- Status: `WAITING_PM_REVIEW` or STOP reason;
- remote ACTIVE/spec read: YES/NO;
- execution base HEAD;
- local runtime path;
- local HEAD/branch/status summary;
- runtime-critical hash summary;
- local vs canonical divergence summary;
- number/list of linked worktrees;
- number/list of other runnable-copy candidates;
- cleanup classification counts: KEEP / ARCHIVE / DELETE-CANDIDATE / UNKNOWN;
- evidence report path;
- executor commit SHA;
- remote HEAD after push;
- any forbidden command used: NO;
- any file deleted/modified in current runtime folder: NO;
- app launched: NO;
- cleanup performed: NO;
- Owner action required now: NO.
