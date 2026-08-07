# PM Execution Spec

## Task
RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-OWNER-PASS-CLOSEOUT

## Status
AUTHORIZED_FOR_EXECUTION

## Objective
Record the Owner's direct runtime verdict that `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` is OK/PASS, synchronize the canonical project knowledge, and publish a documentation-only closeout update on PR #14.

This task must not modify application source or tests. It does not authorize merge.

## Owner evidence basis
Direct Owner report in Project Control on 2026-08-07:

`task 34 đã oke`

Project Manager interpretation for the active product task:

- Owner Manual App Verification for `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`: PASS.
- This is an overall Owner PASS for task 034-REV2.
- Do not invent additional detailed runtime observations that the Owner did not separately state.
- Where the task-specific 034-REV2 QA checklist contains the exact required owner criteria for this task, it may be marked complete as covered by the accepted overall Owner PASS. Add a note that the Owner reported overall PASS and did not provide separate per-item prose in the final message.

## Reviewed GitHub basis
Repository:
`thucnv2303/video-subtitle-remover`

Active PR:
`#14`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

PR base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner-test environment evidence:
`.ai/evidence/RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-OWNER-TEST-PREP/verification.txt`

Owner-test environment:
`E:\Project AI\_owner_test\034-rev2`

Owner-test environment source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

PR HEAD immediately before this closeout spec was authored:
`e516c98cfe5196f8749397667708c6efdc87d52f`

## Gate transition required
Before this closeout:

- Execution: PASS
- Automated verification: PASS
- Code review: PASS
- Owner-test environment preparation: PASS
- Owner manual app verification: WAITING
- Documentation synchronization: PASS for pre-owner state, but owner result not yet recorded
- Merge permission: BLOCKED

After the Owner result is correctly recorded:

- Execution: PASS
- Automated verification: PASS
- Code review: PASS
- Owner-test environment preparation: PASS
- Owner manual app verification: PASS
- Documentation synchronization: PASS only after Project Manager verifies the resulting GitHub docs
- Merge permission: BLOCKED until explicit Project Manager merge approval

Do not mark merge allowed/approved in this task.

## Allowed files
Documentation-only scope:

1. `.ai/current_state.md`
2. `.ai/task_current.md`
3. `.ai/handoff.md`
4. `.ai/qa_checklist.md`
5. `.ai/bugs.md` only if an existing bug entry explicitly tracks the 034-REV2 provider/model failure and must be updated to reflect Owner PASS; otherwise leave it unchanged.

PR #14 body may also be updated after the documentation commit is pushed.

No other repository file is authorized.

## Required canonical updates

### 1. `.ai/current_state.md`
Update the active/current section so it no longer says Owner WAITING for 034-REV2.

Required current facts:

- Active/current product task: `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- Status: completed/owner-verified PASS wording that is consistent with the file's existing conventions
- Reviewed Source SHA remains `ea9521f6fe957e24e49cc5d090e275511d91141d`
- Code review: PASS
- Automated verification: PASS
- Owner manual app verification / Owner retest: PASS
- Owner evidence: direct Owner report on 2026-08-07, `task 34 đã oke`
- Documentation synchronization must not claim final PASS until the documentation commit exists; after commit publication it may be recorded as PASS in the final file state
- Merge: BLOCKED / merge permission BLOCKED pending explicit PM approval

Do not rewrite historical WAITING statuses that belong to archived tasks merely because they contain the same word.

### 2. `.ai/task_current.md`
Close out the active 034-REV2 task.

Required facts:

- Task ID remains `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- Status becomes `COMPLETED` or the repository's equivalent completed-owner-verified state
- Source SHA remains `ea9521f6fe957e24e49cc5d090e275511d91141d`
- Code review: PASS
- Automated verification: PASS
- Owner manual verification: PASS
- Record the Owner's direct final statement and date without embellishing item-level observations
- Merge remains BLOCKED pending explicit PM approval
- Next product task is not to be invented or activated by Anti; leave next-task selection to Project Manager

### 3. `.ai/handoff.md`
Update handoff so it no longer instructs the Owner to test 034-REV2.

Required facts:

- 034-REV2 owner verification: PASS
- Source identity remains `ea9521f6fe957e24e49cc5d090e275511d91141d`
- PR #14 remains authoritative review context
- Task 034-REV2 closeout is awaiting only PM verification of documentation and explicit merge decision, not another Owner test
- No Anti implementation task should be implied after this docs-only closeout
- Merge remains BLOCKED

Remove or supersede current statements such as `Owner manual verification ... WAITING`, `NOT STARTED`, or `Next permitted action: Owner manual verification` only where they refer to the current 034-REV2 task. Preserve historical records for older tasks.

### 4. `.ai/qa_checklist.md`
In section `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 QA`:

- Record Owner overall PASS on 2026-08-07.
- Mark the task-specific Owner criteria complete because the Project Manager accepts the Owner's overall task PASS as covering the 034-REV2 verification gate.
- Add a concise note that the final Owner message was an overall PASS statement and did not separately enumerate per-item prose.

Do not mark unrelated older Credential Hardening / RECOVERY-007 / other task checkboxes complete.

### 5. `.ai/bugs.md` conditional rule
Read the file first.

If there is an entry specifically tracking the task-034 per-job provider/model failure that 034-REV2 resolves, update only that entry to reflect candidate/verified resolution as supported by the Owner PASS.

If BUG-001..BUG-007 or other entries are unrelated, do not touch them.

## Preflight required
Before editing:

1. `git fetch origin`
2. Read `.ai/task_specs/ACTIVE.md` from `origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`.
3. Read this entire spec from the same remote branch.
4. Verify PR/review branch exists.
5. Record exact remote review-branch HEAD.
6. Verify reviewed source SHA `ea9521f6fe957e24e49cc5d090e275511d91141d` still exists in ancestry/source history.
7. Read current full contents of:
   - `.ai/current_state.md`
   - `.ai/task_current.md`
   - `.ai/handoff.md`
   - `.ai/qa_checklist.md`
   - `.ai/bugs.md`
8. Verify no newer GitHub source commit has superseded the reviewed 034-REV2 application source.

If the active product task/source identity has changed, STOP with `SPEC BASE MOVED`.

## Worktree safety
Do not use the historical dirty main working tree for publication if it cannot isolate these docs safely.

Preferred method:

- use an existing clean review worktree for `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`, or
- create/use a clean isolated documentation worktree based on the current remote review branch.

Do not checkout/reset/restore/clean the existing main `E:\Project AI\Video-sub-remove` working tree.

## Forbidden actions
Do NOT:

- modify application source;
- modify tests;
- modify `.ai/task_specs/ACTIVE.md`;
- modify this PM spec;
- create a new product implementation task;
- start Task 035 or Task 036;
- claim detailed Owner observations that were not supplied;
- run `git add .`;
- run `git add -A`;
- reset/restore/clean/rebase/amend;
- force push;
- rewrite history;
- merge PR #14;
- mark merge permission PASS/APPROVED;
- install/update dependencies.

## Verification required
Before commit:

1. Inspect `git diff -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md .ai/bugs.md`.
2. Confirm only authorized files contain task-closeout changes.
3. Search current sections for contradictory 034-REV2 state, including:
   - `WAITING_OWNER_VERIFICATION`
   - `Owner retest: WAITING`
   - `Owner: WAITING`
   - `Owner manual app verification: WAITING`
   - `Owner manual verification: NOT STARTED`
   - `Next permitted action` pointing to Owner verification of 034-REV2
4. Historical occurrences for superseded/older tasks are allowed and must not be blindly rewritten.
5. Run `git diff --check`.

## Git publication
Create exactly one documentation-only commit for this closeout.

Suggested commit message:

`docs: record owner PASS for 034-REV2`

Stage only authorized files explicitly. Do not use broad staging.

Before commit:

`git diff --cached --name-only`

must contain only the allowed documentation files actually changed.

Push only to:

`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Do not push to the recovery base branch.

## PR #14 body update
After push, update PR #14 body so it accurately records:

- Active/closed product task: `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- Owner Manual App Verification: PASS
- Automated Verification: PASS
- Code Review: PASS
- Owner-test prep: PASS
- Documentation closeout commit SHA: exact new docs commit
- Documentation synchronization: WAITING PM VERIFICATION until PM reviews the GitHub commit; do not claim PM verification yourself
- Merge: BLOCKED
- Next permitted action: Project Manager verifies documentation closeout and decides whether 034-REV2 can be formally closed / whether a next task may be activated

Do not activate Task 035/036 in the PR body.

## Stop conditions

`SPEC BASE MOVED`
- current GitHub task/source identity no longer matches this spec.

`BLOCKED — CANNOT ISOLATE REVIEW DIFF SAFELY`
- docs hunks cannot be isolated without risking unrelated local changes.

`SPEC SCOPE INSUFFICIENT`
- a required correction falls outside the allowed documentation files.

`BLOCKED — PROJECT KNOWLEDGE OUT OF SYNC`
- current_state/task_current/handoff cannot be made consistent within allowed scope.

## Required final report
Return:

- Active spec read: YES/NO
- Remote review branch
- Starting remote HEAD
- Reviewed source SHA
- Owner result recorded: PASS
- Exact files modified
- `git diff --check` result
- `git diff --cached --name-only` before commit
- Documentation commit SHA
- Remote HEAD after push
- PR #14 body updated: YES/NO
- Application source changed: NONE
- Tests changed: NONE
- Owner status in current_state/task_current/handoff: exact values
- Documentation synchronization: WAITING_PM_VERIFICATION
- Merge: BLOCKED
- Any remaining current/active 034-REV2 WAITING-owner contradictions: exact list or NONE

## Merge permission
BLOCKED.

This task records the Owner PASS and synchronizes canonical knowledge only. It does not authorize merge and it does not authorize the next implementation task.
