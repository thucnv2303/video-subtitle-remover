# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001`

Repository:
`thucnv2303/video-subtitle-remover`

Owner decision:
- The Owner has already accepted the current Owner runtime as the forward baseline.
- Do NOT request another baseline confirmation.
- The current product request is to rebuild the Settings tab using the approved Settings V1 direction.

Source basis:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001.md`

Execution type:
SETTINGS V1 UI + NARROW SUPPORTING LOGIC

Anti authorization:
Implement only the exact remote spec on this review branch.

Owner app verification:
NOT AUTHORIZED until PM code review PASS.

Merge permission:
BLOCKED.

Required startup:
1. `git fetch origin`
2. Read `origin/review/RECOVERY-007E-SETTINGS-V1-001:.ai/task_specs/ACTIVE.md`
3. Read `origin/review/RECOVERY-007E-SETTINGS-V1-001:.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001.md`
4. Record exact `origin/review/RECOVERY-007E-SETTINGS-V1-001` HEAD as execution spec basis.

If either remote spec cannot be read:
`STOP — ACTIVE SPEC NOT AVAILABLE ON REMOTE`
