# PM Execution Spec

## 0. HARD EXECUTION CONTRACT

Task ID: `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-PM-VERIFIED-CLOSEOUT-006`
Mode: `DETERMINISTIC BYTE-PRESERVING DOCUMENTATION CLOSEOUT`
Executor: Anti
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`
PR: `#14`
Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`
Accepted documentation correction SHA: `7d2e108a3fe57b6cdbc55f31b966bb633894f772`

PM verification result for `7d2e108...`: PASS.

The correction commit is verified on GitHub as exactly one commit after its execution basis and modifies only:
- `.ai/current_state.md` — 6 additions / 6 deletions;
- `.ai/handoff.md` — 2 additions / 2 deletions;
- `.ai/task_current.md` — 1 addition / 1 deletion.

The current 034-REV2 state now correctly records:
- reviewed source `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- automated verification PASS;
- code review PASS;
- Owner manual verification PASS;
- direct Owner report on 2026-08-07: `task 34 đã oke`;
- no malformed TAB/backslash Owner fragment;
- merge still BLOCKED.

This task records the completed PM documentation verification into the canonical dynamic files. It does NOT merge PR #14 and does NOT authorize Task 035/036.

ANTI MUST NOT EDIT TEXT MANUALLY.
ANTI MUST NOT INVENT ANY REPAIR COMMAND.
ANTI MUST ONLY RUN THE COMMANDS/COMMAND CLASSES EXPLICITLY AUTHORIZED BELOW.

On the first unexpected result, failed command, failed assertion, dirty path, moved remote head, or helper non-zero exit:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

## 1. Objective

Publish one narrow docs-only commit that changes the PM-verification placeholders to final Task 034 documentation PASS state while preserving existing bytes/line endings.

Required final current state:
- `.ai/current_state.md` top status: `COMPLETED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- `.ai/current_state.md` current Documentation gate: `PASS`
- `.ai/current_state.md` lower 034-REV2 Documentation synchronization: `PASS`
- `.ai/task_current.md` both current Documentation synchronization entries: `PASS`
- `.ai/handoff.md` Last completed task: 034-REV2 PM VERIFIED
- `.ai/handoff.md` Active Task: 034-REV2 COMPLETED — PM VERIFIED
- `.ai/handoff.md` Documentation synchronization: `PASS`
- `.ai/handoff.md` next action: PM final merge decision; no further Anti implementation or Owner retest for Task 034
- merge remains BLOCKED until explicit PM merge approval

## 2. Exact verified input blobs

Before helper execution these exact blob SHAs MUST match:
- `.ai/current_state.md`: `33eff07b417340218f4a61e37b761b452289cc31`
- `.ai/task_current.md`: `e79abcc3a4022af835bc086c843688bdff6fc7f9`
- `.ai/handoff.md`: `d5f264d3b8cbcb0ea29d015d04e147b65cbaab09`
- `.ai/qa_checklist.md`: `54903913a2e5862297847e23328b0b6af9a36d2e`
- PM helper `.ai/task_specs/tools/finalize_034_pm_verified_006.py`: `7d82d422568b42dd486e220b27acbcc9faf7cc52`

Any mismatch:

`STOP — VERIFIED CLOSEOUT BASIS MISMATCH`

Do not edit, regenerate, or adapt the helper.

## 3. Remote-only authority

First:

```powershell
git fetch origin
```

Read ACTIVE only from:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
```

Read this full spec only from the exact path referenced by remote ACTIVE, from the same remote ref.

Local ACTIVE/spec copies are not authority.

Capture:

```powershell
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

as `EXECUTION_BASE_HEAD`.

## 4. Source identity guard

Run:

```powershell
git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
git diff --name-only "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

All paths after reviewed source must remain under `.ai/` only.

If application source, tests, package/dependency manifests, Python production code, renderer/main/preload production code, or other runtime paths appear:

`STOP — REVIEWED SOURCE SUPERSEDED`

## 5. Isolated worktree

Approved new path:

`E:\Project AI\_closeout\034-pm-verified-closeout-006`

Check:

```powershell
Test-Path "E:\Project AI\_closeout\034-pm-verified-closeout-006"
```

It MUST return False.

If it exists:

`STOP — CLOSEOUT 006 WORKTREE EXISTS`

Do not remove/reuse it.
Do not touch any prior Finalize-004/005/005-REV1 worktree.

Create:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-pm-verified-closeout-006" "$EXECUTION_BASE_HEAD"
```

Inside the new worktree prove exact path, HEAD and clean status.

## 6. Required blob preflight

Inside the new worktree run exactly:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/qa_checklist.md
git hash-object .ai/task_specs/tools/finalize_034_pm_verified_006.py
```

All five must exactly match Section 2.

## 7. Execute PM helper exactly once

Run exactly once:

```powershell
python .ai/task_specs/tools/finalize_034_pm_verified_006.py
```

If exit code != 0:

`STOP — PM VERIFIED CLOSEOUT HELPER FAILED`

Do not run it again.
Do not manually repair.

## 8. Verify before staging

Run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git -c core.whitespace=cr-at-eol diff --check
```

Acceptance:
- exact modified file set is only:
  - `.ai/current_state.md`
  - `.ai/task_current.md`
  - `.ai/handoff.md`
- `.ai/qa_checklist.md` unchanged;
- no source/test/task-spec/helper change;
- diff is narrow, not full-file churn;
- whitespace check empty.

Then verify text:

```powershell
git grep -n "COMPLETED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2" -- .ai/current_state.md
git grep -n "Documentation synchronization: PASS" -- .ai/current_state.md .ai/task_current.md
git grep -n "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2: COMPLETED — PM VERIFIED" -- .ai/handoff.md
git grep -n "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 (COMPLETED — PM VERIFIED)" -- .ai/handoff.md
git grep -n "## Documentation synchronization" -- .ai/handoff.md
git grep -n "PASS" -- .ai/handoff.md
```

If scope expands or churn appears:

`STOP — CLOSEOUT 006 SCOPE OR CHURN FAILURE`

## 9. Stage exactly three canonical docs

```powershell
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
```

Cached file set must be exactly those three files.

## 10. Remote move guard

Before commit:

```powershell
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

It must still equal `EXECUTION_BASE_HEAD`.

Else:

`STOP — CLOSEOUT 006 BASE MOVED`

## 11. Commit and push

Create exactly one commit:

```powershell
git commit -m "docs: record PM verification PASS for 034-REV2"
```

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force push.

After push verify local HEAD equals remote HEAD and worktree is clean.

## 12. Strictly forbidden

Do NOT:
- manually edit any canonical file;
- use editor replace, `Set-Content`, `Out-File`, Python/Node/PowerShell rewrite scripts other than the exact PM helper;
- execute helper more than once;
- use reset/restore/checkout/clean/revert/rebase/amend;
- remove any worktree;
- convert CRLF/LF;
- modify `.ai/qa_checklist.md`;
- modify `.ai/task_specs/*` or helper files;
- modify application source/tests/dependencies;
- start Task 035/036;
- force push;
- merge PR #14.

## 13. Final report schema

Return:
- Active spec read directly from remote ref: YES/NO
- Task ID
- `EXECUTION_BASE_HEAD`
- isolated worktree path
- initial HEAD and initial `git status --short`
- reviewed-source ancestry result
- post-source changed paths
- five `git hash-object` results
- PM helper exit code and full output
- exact modified files
- `git diff --name-status`
- `git diff --numstat`
- whitespace check result
- required text-check outputs
- cached name-only/numstat/whitespace result
- documentation commit SHA
- remote HEAD after push
- final `git status --short`
- application source changed: YES/NO
- tests changed: YES/NO
- `.ai/qa_checklist.md` changed: YES/NO
- documentation synchronization: PASS_PENDING_PM_REMOTE_CONFIRMATION
- Task 035/036 started: YES/NO
- forbidden commands used: YES/NO
- merge: BLOCKED
