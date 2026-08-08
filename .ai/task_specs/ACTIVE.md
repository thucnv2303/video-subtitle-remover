# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`

Repository:
`thucnv2303/video-subtitle-remover`

Control authority branch:
`control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`

Execution spec:
`.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008.md`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Expected local branch:
`rescue/wip-20260803`

Expected local/upstream HEAD before snapshot:
`d67a427f1c90a2e98da560977736ead80637db3a`

Source review branch to publish:
`review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`

Execution type:
PRESERVE EXISTING OWNER-RUNTIME SOURCE BY EXACT STAGING/COMMIT ONLY

Application source authorization:
Exactly the 21 paths listed in the execution spec. Existing bytes only; no source edit is authorized.

Documentation authorization:
NONE in the protected Owner runtime for this task.

Cleanup/deletion/archive authorization:
NONE.

Owner app verification:
NOT AUTHORIZED until Project Manager reviews the pushed source snapshot.

036-A/B/C/D authorization:
NONE.

Merge permission:
BLOCKED.

Next permitted action:
Anti reads this ACTIVE and the full execution spec from this remote control branch, snapshots exactly the approved current source files into one local commit, and pushes that commit only to `review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`. Project Manager then verifies the source on GitHub and opens the Draft PR. No cleanup occurs before snapshot review and Owner verification.