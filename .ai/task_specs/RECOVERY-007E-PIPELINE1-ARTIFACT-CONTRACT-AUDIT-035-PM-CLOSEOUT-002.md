# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002

## 0. Hard rules

This is a documentation-only canonical synchronization task after Project Manager direct source verification of Audit 035.

Application source, tests, dependencies, configuration, audit evidence, incident evidence, task specs and helper files are READ-ONLY for the executor.

Executor may modify exactly:
1. `.ai/current_state.md`
2. `.ai/task_current.md`
3. `.ai/handoff.md`

Those three files may be changed only by the PM-authored helper:

`.ai/task_specs/tools/close_audit035_pm_002.py`

Do not manually edit them.

On the first failed command, failed assertion, blob mismatch, unexpected diff, helper failure, remote-head move or unlisted required command:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

No reset, restore, checkout, clean, revert, rebase, amend, force push, history rewrite, wildcard delete, line-ending conversion, Set-Content, Out-File, whole-file rewrite or ad-hoc repair script is authorized.

IMPORTANT command-whitelist clarification:
- The diagnostic command `echo "Exit: $LASTEXITCODE"` is explicitly authorized immediately after an approved command when the executor wants to display the previous PowerShell exit code.
- `Write-Output "Exit: $LASTEXITCODE"` is also authorized for the same purpose.
- These diagnostic commands do not authorize any other shell operation.

## 1. Task identity

Task ID:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis SHA:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted PM audit evidence:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md`

Incident record:
`.ai/incidents/INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001.md`

PM helper:
`.ai/task_specs/tools/close_audit035_pm_002.py`

Expected PM helper blob:
`41f206d8a212f8f1c41690f162c3e94f4a2060f8`

Selected next implementation candidate:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Task 036-A execution authorization in this task:
NONE.

## 2. Authority

Execution authority is remote only.

Begin with:
1. `git fetch origin`
2. Read remote ACTIVE from `origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`.
3. Read this entire spec from the same remote ref.
4. Capture `EXECUTION_BASE_HEAD = git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`.

Local ACTIVE/spec copies are not authority.

## 3. Required worktree

Use exactly:

`E:\Project AI\_audit\035-pm-closeout-002`

Before creation:
`Test-Path "E:\Project AI\_audit\035-pm-closeout-002"`

Expected: `False`.

If the path exists:
`STOP — AUDIT035 PM CLOSEOUT WORKTREE ALREADY EXISTS`

Create a detached worktree at `EXECUTION_BASE_HEAD` only.

After creation, navigation is authorized only with:
`Set-Location "E:\Project AI\_audit\035-pm-closeout-002"`

or:
`cd "E:\Project AI\_audit\035-pm-closeout-002"`

Do not remove or modify any older Audit 035 worktree.

## 4. Source and PM-control preflight

Verify reviewed source ancestry:

`git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"`

Expected exit 0.

Inspect:

`git diff --name-only "55be60509a94b4e6f18397dd691b42fd95776faa" "$EXECUTION_BASE_HEAD"`

Before executor mutation every returned path must be under `.ai/` and must be PM audit/incident/spec/helper/ACTIVE material only. No application source/test/dependency path may appear.

Inside worktree:
- `$PWD.Path` must be the exact path above;
- `git rev-parse HEAD` must equal `EXECUTION_BASE_HEAD`;
- `git status --short` must be empty.

## 5. Exact blob gate

Run `git hash-object` for exactly:

- `.ai/current_state.md` = `29cdb4357a5f339a4826bb6a7be1c267bf7f148e`
- `.ai/task_current.md` = `07a8e6c3dcd88cc38f213c05638834d829361266`
- `.ai/handoff.md` = `793026f262859719e96080e18cb4d7fb32835016`
- `.ai/task_specs/tools/close_audit035_pm_002.py` = `41f206d8a212f8f1c41690f162c3e94f4a2060f8`

Any mismatch:

`STOP — AUDIT035 PM CLOSEOUT BASIS MISMATCH`

Also verify the following files exist with `git show HEAD:<path>`; they are read-only:
- `.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md`
- `.ai/incidents/INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001.md`

## 6. Authorized shell command whitelist

Only these command families are authorized:

Remote/preflight:
- `git fetch origin`
- `git show <approved-ref>:<approved-path>`
- `git show HEAD:<approved-path>` for the two PM evidence files in Section 5
- `git rev-parse <approved-ref-or-HEAD>`
- `git merge-base --is-ancestor <approved-sha> <approved-sha>`
- `git diff --name-only <approved-sha> <approved-sha>`
- `Test-Path <exact worktree path>`
- `git worktree add --detach <exact worktree path> <EXECUTION_BASE_HEAD>`
- exact `Set-Location` / `cd` from Section 3
- `$PWD.Path`
- `git status --short`
- `git hash-object <exact file named in Section 5>`

Helper:
- `python -m py_compile .ai/task_specs/tools/close_audit035_pm_002.py`
- `python .ai/task_specs/tools/close_audit035_pm_002.py` exactly once

Verification/publication:
- `git diff --name-status`
- `git diff --numstat`
- `git -c core.whitespace=cr-at-eol diff --check`
- `git grep -n` for these exact verification terms and only within `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`:
  - `COMPLETED — PM VERIFIED — RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`
  - `RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`
  - `PR #16: INVALIDATED / CLOSED / NOT MERGED`
  - `PR #17: INVALIDATED / CLOSED / NOT MERGED`
  - `Documentation synchronization: PASS`
  - `NOT REQUIRED — read-only audit`
- `git add .ai/current_state.md .ai/task_current.md .ai/handoff.md`
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- `git -c core.whitespace=cr-at-eol diff --cached --check`
- `git fetch origin`
- `git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`
- `git commit -m "docs: synchronize PM-verified Audit 035 closeout"`
- `git push origin HEAD:review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`
- post-push `git rev-parse HEAD`, `git fetch origin`, remote `git rev-parse`, `git status --short`

Exit-code diagnostic exception:
- exact `echo "Exit: $LASTEXITCODE"` after an approved command;
- exact `Write-Output "Exit: $LASTEXITCODE"` after an approved command.

No other shell command is authorized.

## 7. Helper gate

First run:

`python -m py_compile .ai/task_specs/tools/close_audit035_pm_002.py`

Expected exit 0.

If syntax gate fails:
`STOP — AUDIT035 PM CLOSEOUT HELPER SYNTAX INVALID`

Then run exactly once:

`python .ai/task_specs/tools/close_audit035_pm_002.py`

Expected exit 0.

If it fails:
`STOP — AUDIT035 PM CLOSEOUT HELPER FAILED`

Do not run it again.
Do not manually repair any file.

## 8. Expected result

Exactly these three files must change:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

No other file may be modified/untracked by executor activity.

The helper must preserve existing CRLF/LF counts in each file.

Required semantic state after helper:
- Audit 035 = `COMPLETED — PM VERIFIED`.
- accepted evidence points to the PM-verified audit file;
- executor PR #16 and #17 are recorded as invalidated/closed/not merged;
- Owner verification is NOT REQUIRED for this read-only audit;
- Documentation synchronization = PASS;
- next implementation candidate is `RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`;
- Task 036-A remains NOT AUTHORIZED until separate ACTIVE/spec publication;
- product merge permission remains BLOCKED.

## 9. Pre-stage and stage gates

Before staging:
- `git status --short`
- exact changed set = three approved files;
- `git diff --name-status`
- `git diff --numstat` must be narrow;
- whitespace check exit 0.

Stage exactly the three approved files with the command in Section 6.

Cached checks must show exactly those three files and whitespace exit 0.

Any mismatch:
`STOP — PUSH NOT AUTHORIZED`

Do not unstage or repair.

## 10. Remote-head guard

Immediately before commit:
1. `git fetch origin`
2. remote review head must equal `EXECUTION_BASE_HEAD`.

If moved:
`STOP — SPEC BASE MOVED`

No rebase, reset or repair.

## 11. Commit and push

Commit message exactly:

`docs: synchronize PM-verified Audit 035 closeout`

Push fast-forward only to:

`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`

Do not merge the PR.
Do not start Task 036-A.

## 12. Final report

Report:
- ACTIVE read from remote: YES/NO
- task ID
- EXECUTION_BASE_HEAD
- worktree path
- initial HEAD/status
- source ancestry result
- PM-control preflight changed paths
- four blob-gate results
- helper syntax-gate exit
- helper exit + full output
- exact modified files
- diff name-status/numstat/whitespace result
- required text-check outputs
- cached name-only/numstat/whitespace
- documentation commit SHA
- remote head after push
- final status
- application source changed YES/NO
- tests/dependencies changed YES/NO
- forbidden command used YES/NO
- Task 036-A started YES/NO
- merge performed YES/NO
- final status `WAITING_PM_REVIEW`
