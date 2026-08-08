# RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1

## Status
ACTIVE — DETERMINISTIC READ-ONLY INVENTORY

## Goal
Capture the exact local state of the Owner-selected runtime `E:\Project AI\Video-sub-remove` and all Video Subtitle Remover runnable-copy candidates under `E:\Project AI` so Project Manager can approve a later cleanup manifest safely.

This task does NOT clean, delete, repair, checkout, reset, restore, move, rename, or run the app.

## Owner-selected candidate baseline
`E:\Project AI\Video-sub-remove`

This directory is protected. It must not be deleted or modified by this task.

## Authority
Repository: `thucnv2303/video-subtitle-remover`

Canonical basis:
`fd880a625ba6a43acf25f5556f6c97ba20c84026`

Review branch:
`review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1`

Evidence worktree:
`E:\Project AI\_evidence\007-rev1-owner-runtime-inventory`

PM-authored capture tool:
`.ai/task_specs/tools/capture_owner_runtime_007_rev1.ps1`

Required tool blob:
`2e63597d13d6290061c6216f433766d161529163`

Required output:
`.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1.json`

## Important
The previous 007 executor report is INVALIDATED and must not be reused as proof.

Do not manually summarize or classify filesystem state. The PM-authored capture tool produces the evidence. Project Manager will classify exact cleanup targets after review.

## Exact command sequence
Only these commands are authorized, in this order. No decorative output and no extra shell scripting.

1. `git fetch origin`
2. `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1:.ai/task_specs/ACTIVE.md"`
3. `git show "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1.md"`
4. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1"`
5. `Test-Path "E:\Project AI\_evidence\007-rev1-owner-runtime-inventory"`

If step 5 returns `True`, STOP — EVIDENCE WORKTREE PATH ALREADY EXISTS.

6. `git worktree add --detach "E:\Project AI\_evidence\007-rev1-owner-runtime-inventory" <captured execution base HEAD>`
7. `Set-Location "E:\Project AI\_evidence\007-rev1-owner-runtime-inventory"`
8. `git rev-parse HEAD`
9. `git status --short`
10. `git hash-object .ai/task_specs/tools/capture_owner_runtime_007_rev1.ps1`

Step 10 must equal `2e63597d13d6290061c6216f433766d161529163`. Otherwise STOP — CAPTURE TOOL BLOB MISMATCH.

11. `powershell -NoProfile -ExecutionPolicy Bypass -File ".ai/task_specs/tools/capture_owner_runtime_007_rev1.ps1"`
12. `git status --short`
13. `git add ".ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1.json"`
14. `git diff --cached --name-only`
15. `git diff --cached --check`
16. `git fetch origin`
17. `git rev-parse "origin/review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1"`

Step 17 must still equal the captured execution base HEAD. Otherwise STOP — REMOTE HEAD MOVED.

18. `git commit -m "docs: publish deterministic owner runtime inventory 007 rev1"`
19. `git push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1`
20. `git rev-parse HEAD`
21. `git status --short`

## Hard gates
Before commit:
- exactly one executor-created file is staged: `.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV1.json`;
- no Owner runtime file is modified;
- no source/test/config/dependency/dynamic canonical doc is modified;
- `git diff --cached --check` passes;
- remote review head has not moved.

If any command fails or any result is unexpected: STOP immediately. Do not self-repair.

## Forbidden
- no `Remove-Item`, delete, rmdir;
- no `git clean`, reset, restore, checkout, switch, rebase, amend;
- no `git worktree remove`;
- no force push;
- no `git add .` or `git add -A`;
- no manual report writing;
- no `Set-Content`, `Out-File`, ad-hoc Python/Node/PowerShell generator;
- no app launch;
- no npm install/update;
- no product source/test/config/dependency edit;
- no cleanup;
- no 036-A/B/C/D;
- no merge.

The only script execution authorized is the pinned PM-authored capture tool above.

## Final report
Return only:
- Status: `WAITING_PM_REVIEW` or STOP reason;
- execution base HEAD;
- capture tool blob result;
- evidence file path;
- executor commit SHA;
- remote HEAD after push;
- final status clean YES/NO;
- Owner runtime modified NO;
- cleanup performed NO;
- app launched NO.
