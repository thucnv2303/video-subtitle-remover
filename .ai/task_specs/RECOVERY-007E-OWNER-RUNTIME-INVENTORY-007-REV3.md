# RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3

## Status
ACTIVE — READ-ONLY INVENTORY + EVIDENCE PUBLICATION ONLY

## Owner decision
The protected candidate product baseline is exactly:
`E:\Project AI\Video-sub-remove`

The project must converge to one Owner runtime copy. Cleanup/deletion is NOT part of this task. PM will authorize cleanup only after reviewing exact REV3 evidence.

## Supersedes
- PR #26 / task 007: INVALIDATED.
- PR #27 / 007-REV1: INVALIDATED.
- PR #28 / 007-REV2: SUPERSEDED because its evidence worktree path already existed.

Do not reuse prior task branches, worktrees, tools, or reports as execution authority.

## Authority
Repository: `thucnv2303/video-subtitle-remover`

Canonical branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis:
`fd880a625ba6a43acf25f5556f6c97ba20c84026`

Review branch:
`review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Required fresh evidence worktree:
`E:\Project AI\_evidence\007-rev3-owner-runtime-inventory-20260808-1500`

Required evidence file:
`.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3.json`

PM-authored capture tool:
`.ai/task_specs/tools/capture_owner_runtime_007_rev3.py`

Required tool blob:
`275b6cec11961799e549eb89fa605d3be7df7077`

## Hard boundary
This task is read-only against the Owner runtime and all existing project copies.

It MUST NOT:
- edit, delete, rename, move, overwrite, restore, reset, checkout, switch, clean, or repair anything under `E:\Project AI\Video-sub-remove`;
- delete/archive/remove any existing worktree or test/recovery/review copy;
- run the application;
- modify product source, tests, dependencies, configuration, or canonical dynamic docs;
- start 036-A/B/C/D;
- merge any PR;
- self-repair after a failure.

On the first unexpected failure or mismatch:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR`

## Positive command whitelist
No command outside this list is authorized.

1. `git fetch origin`
2. `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3:.ai/task_specs/ACTIVE.md"`
3. `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3.md"`
4. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3"`

Capture command 4 as `EXECUTION_BASE_HEAD`.

5. `Test-Path "E:\Project AI\_evidence\007-rev3-owner-runtime-inventory-20260808-1500"`
Expected: `False`. If `True`, STOP.

6. `git worktree add --detach "E:\Project AI\_evidence\007-rev3-owner-runtime-inventory-20260808-1500" <EXECUTION_BASE_HEAD>`
7. `Set-Location "E:\Project AI\_evidence\007-rev3-owner-runtime-inventory-20260808-1500"`
8. `git rev-parse HEAD`
9. `git status --short`
10. `git hash-object .ai/task_specs/tools/capture_owner_runtime_007_rev3.py`

Command 8 must equal `EXECUTION_BASE_HEAD`.
Command 9 must be empty.
Command 10 must equal `275b6cec11961799e549eb89fa605d3be7df7077`.
Otherwise STOP.

11. `python -m py_compile .ai/task_specs/tools/capture_owner_runtime_007_rev3.py`
12. `python .ai/task_specs/tools/capture_owner_runtime_007_rev3.py`

Each must exit 0. If either fails, STOP. Do not repair or rerun.

13. `git status --short`
Expected exact changed path only:
`?? .ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3.json`

14. `git add ".ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3.json"`
15. `git diff --cached --name-only`
16. `git diff --cached --check`
17. `git fetch origin`
18. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3"`

Command 15 must show exactly the required JSON.
Command 16 must exit 0.
Command 18 must still equal `EXECUTION_BASE_HEAD`.
Otherwise STOP.

19. `git commit -m "docs: publish Owner runtime inventory 007 REV3"`
20. `git push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3`
21. `git rev-parse HEAD`
22. `git fetch origin`
23. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3"`
24. `git status --short`

Command 24 must be empty. Local and remote HEAD must match.

## Forbidden actions
No `git add .`, `git add -A`, force push, reset, restore, checkout, switch, clean, rebase, amend, worktree removal, source edits, deletion, cleanup, archive, app launch, dependency changes, alternative report generation, decorative output commands, or 036-A/B/C/D work.

## Final status
`WAITING_PM_REVIEW`

## Final report schema
Return only:
- Status;
- remote ACTIVE/spec read: YES/NO;
- EXECUTION_BASE_HEAD;
- evidence worktree path;
- capture tool blob;
- capture tool syntax gate: PASS/FAIL;
- capture tool execution: PASS/FAIL;
- evidence JSON path;
- tool-reported Owner runtime HEAD;
- tool-reported Owner runtime branch/detached state;
- tool-reported VSR runnable candidate count;
- executor commit SHA;
- remote HEAD after push;
- final worktree clean: YES/NO;
- Owner runtime modified: NO;
- cleanup performed: NO;
- app launched: NO;
- Owner action required now: NO.
