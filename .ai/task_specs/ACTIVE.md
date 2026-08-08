# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`

Repository:
`thucnv2303/video-subtitle-remover`

Control authority branch:
`control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`

Execution spec:
`.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2.md`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Expected local branch:
`rescue/wip-20260803`

Expected local/upstream HEAD before snapshot:
`d67a427f1c90a2e98da560977736ead80637db3a`

Expected staged state:
Exactly the 21 source paths defined in the REV2 spec.

Review branch to publish:
`review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`

Execution type:
VERIFY EXISTING STAGED OWNER-RUNTIME BYTES, COMMIT WITH EXPLICIT ONE-TIME HOOK BYPASS, AND PUBLISH ONLY

Application source authorization:
No source edit. Commit only the already-staged exact 21 paths after working-file hashes and index blob hashes match the pinned REV2 values.

Pre-commit hook exception:
Only the exact `git commit --no-verify` command in the REV2 spec is authorized because the local hook requires `.ai` updates that are forbidden during this source-only preservation snapshot. This exception applies only to this one snapshot commit.

Documentation authorization in Owner runtime:
NONE.

Cleanup/deletion/archive authorization:
NONE.

Owner app verification:
NOT AUTHORIZED until Project Manager verifies the pushed snapshot.

036-A/B/C/D authorization:
NONE.

Merge permission:
BLOCKED.

Next permitted action:
Anti reads this ACTIVE and the full REV2 spec from the remote control branch, re-verifies the exact staged state and hashes, commits the preserved bytes using only the explicitly authorized one-time hook bypass, and pushes only to the REV2 review branch. Project Manager then verifies the snapshot and opens the Draft PR. No cleanup occurs before snapshot review and Owner verification.
