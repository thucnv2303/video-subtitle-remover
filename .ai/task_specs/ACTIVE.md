# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`

Repository:
`thucnv2303/video-subtitle-remover`

Control authority branch:
`control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`

Execution spec:
`.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1.md`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Expected local branch:
`rescue/wip-20260803`

Expected local/upstream HEAD before snapshot:
`d67a427f1c90a2e98da560977736ead80637db3a`

Expected current staged state:
Exactly the 21 source paths defined in the REV1 spec, left staged by the correctly stopped original 008 task.

Review branch to publish:
`review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`

Execution type:
VERIFY EXISTING STAGED OWNER-RUNTIME BYTES, COMMIT, AND PUBLISH ONLY

Application source authorization:
No source edit. Commit only the already-staged exact 21 paths after working-file hashes and index blob hashes match.

Documentation authorization in Owner runtime:
NONE.

Cleanup/deletion/archive authorization:
NONE.

Whitespace cleanup/formatting authorization:
NONE. Pre-existing trailing whitespace must be preserved in this snapshot.

Owner app verification:
NOT AUTHORIZED until Project Manager reviews the pushed snapshot.

036-A/B/C/D authorization:
NONE.

Merge permission:
BLOCKED.

Next permitted action:
Anti reads this ACTIVE and the full REV1 spec from the remote control branch, verifies the stopped staged state, commits the exact bytes, and pushes only to the REV1 review branch. PM then verifies the snapshot and opens the Draft PR. No cleanup occurs before snapshot review and Owner verification.
