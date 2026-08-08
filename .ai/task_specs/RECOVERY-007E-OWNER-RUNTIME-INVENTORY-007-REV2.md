# RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2

## Status
ACTIVE — READ-ONLY INVENTORY + EVIDENCE PUBLICATION ONLY

## Owner decision
The protected candidate product baseline is the app currently launched from:

`E:\Project AI\Video-sub-remove`

The project must converge to exactly one Owner runtime copy. Cleanup/deletion is NOT part of this task; cleanup will be authorized only after PM reviews the exact REV2 inventory.

## Supersedes
- PR #26 / task 007: INVALIDATED — incomplete/non-compliant inventory.
- PR #27 / task 007-REV1: INVALIDATED — PM-authored capture tool failed.

Do not reuse either task, worktree, tool, report, or branch as execution authority.

## Authority
Repository: `thucnv2303/video-subtitle-remover`

Canonical branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis:
`fd880a625ba6a43acf25f5556f6c97ba20c84026`

Review branch:
`review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Required evidence worktree:
`E:\Project AI\_evidence\007-rev2-owner-runtime-inventory`

Required evidence file:
`.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2.json`

PM-authored capture tool:
`.ai/task_specs/tools/capture_owner_runtime_007_rev2.py`

Required tool blob:
`18d70b185a970ac1e12ada0e30782608c57a66ab`

## Hard boundary
This task is read-only against the Owner runtime and all existing project copies.

It MUST NOT:
- edit, delete, rename, move, overwrite, restore, reset, checkout, switch, clean or repair anything under `E:\Project AI\Video-sub-remove`;
- delete or archive any test/recovery/review copy;
- run the application;
- modify product source, tests, dependencies, configuration, or canonical dynamic docs;
- start 036-A/B/C/D;
- merge any PR;
- self-repair after a failure.

On the first unexpected failure or mismatch:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR`

## Purpose of REV2 evidence
The PM-authored tool will generate exact JSON evidence containing:
- local runtime HEAD and branch/detached state;
- remotes;
- full Git status;
- unstaged/staged/untracked path lists;
- linked worktrees;
- local and remote branches;
- exact divergence path list vs canonical basis;
- hashes/existence of runtime-critical files;
- all top-level directories under `E:\Project AI`;
- all discovered `package.json` files excluding dependency/VCS/venv directories;
- exact Video Subtitle Remover runnable-copy candidates;
- explicit safety flags showing cleanup was not performed.

Anti does NOT manually classify or rewrite the evidence. PM will classify KEEP / ARCHIVE / DELETE-CANDIDATE / DO-NOT-TOUCH after reviewing the exact JSON from GitHub.

## Positive command whitelist
No command outside this list is authorized.

### Remote authority
1. `git fetch origin`
2. `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2:.ai/task_specs/ACTIVE.md"`
3. `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2.md"`
4. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2"`

Capture the result of command 4 as `EXECUTION_BASE_HEAD`.

### Evidence worktree
5. `Test-Path "E:\Project AI\_evidence\007-rev2-owner-runtime-inventory"`

Expected: `False`.
If `True`: `STOP — REV2 EVIDENCE WORKTREE ALREADY EXISTS`.

6. `git worktree add --detach "E:\Project AI\_evidence\007-rev2-owner-runtime-inventory" <EXECUTION_BASE_HEAD>`
7. `Set-Location "E:\Project AI\_evidence\007-rev2-owner-runtime-inventory"`
8. `git rev-parse HEAD`
9. `git status --short`
10. `git hash-object .ai/task_specs/tools/capture_owner_runtime_007_rev2.py`

Command 8 must equal `EXECUTION_BASE_HEAD`.
Command 9 must be empty.
Command 10 must equal `18d70b185a970ac1e12ada0e30782608c57a66ab`.
Otherwise STOP.

### Tool verification and capture
11. `python -m py_compile .ai/task_specs/tools/capture_owner_runtime_007_rev2.py`
12. `python .ai/task_specs/tools/capture_owner_runtime_007_rev2.py`

Each must exit 0. If either fails, STOP. Do not edit or rerun after repair.

### Publication gate
13. `git status --short`

Expected exact changed path: only
`?? .ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2.json`

No other changed/untracked path is allowed.

14. `git add ".ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2.json"`
15. `git diff --cached --name-only`
16. `git diff --cached --check`
17. `git fetch origin`
18. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2"`

Command 15 must show exactly the one required evidence JSON.
Command 16 must exit 0.
Command 18 must still equal `EXECUTION_BASE_HEAD`.
Otherwise STOP.

### Commit and push
19. `git commit -m "docs: publish Owner runtime inventory 007 REV2"`
20. `git push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2`
21. `git rev-parse HEAD`
22. `git fetch origin`
23. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2"`
24. `git status --short`

Command 24 must be empty.
Local HEAD and remote review HEAD must match.

## Forbidden actions
No `git add .`, `git add -A`, force push, reset, restore, checkout, switch, clean, rebase, amend, worktree removal, source edits, shell-generated alternate report, application launch, deletion, cleanup, archive, dependency changes, or 036-A/B/C/D work.

Do not run decorative output commands or alternative diagnostics.

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
