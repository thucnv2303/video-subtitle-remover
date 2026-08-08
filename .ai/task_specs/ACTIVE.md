# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis:
`fd880a625ba6a43acf25f5556f6c97ba20c84026`

Review branch:
`review/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3`

Execution spec:
`.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV3.md`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Execution type:
READ-ONLY LOCAL INVENTORY + EVIDENCE PUBLICATION ONLY

Anti authorization:
Run only the exact positive-whitelist sequence in the REV3 spec.

Application source/test/dependency authorization:
NONE.

Cleanup/deletion/archive authorization:
NONE.

Owner app verification:
NOT AUTHORIZED / NOT REQUIRED for inventory.

036-A/B/C/D authorization:
NONE.

Merge permission:
BLOCKED.

Next permitted action:
Anti executes REV3 deterministic inventory using the fresh evidence worktree path. PM reviews exact JSON evidence, then creates a separate cleanup/adoption task with an explicit path manifest. No deletion before that review.
