# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical branch entering task:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical GitHub basis:
`fd880a625ba6a43acf25f5556f6c97ba20c84026`

Review branch:
`review/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007`

Execution spec:
`.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-BASELINE-ADOPTION-007.md`

Owner decision:
The app currently launched from `E:\Project AI\Video-sub-remove` is the candidate forward baseline. The project will move to one Owner runtime copy only after this candidate is captured and PM-reviewed.

Execution type:
READ-ONLY LOCAL PROJECT/RUNTIME INVENTORY + ONE EVIDENCE REPORT.

Anti authorization:
Read-only capture and evidence publication exactly as defined by the remote spec.

Application source/test/dependency edits:
NONE.

Local deletion/cleanup:
NONE in this task.

Owner app verification:
NOT REQUIRED for this inventory task.

036-A/B/C/D:
NOT AUTHORIZED.

Current gates:
- Candidate runtime capture: WAITING
- Full local/worktree inventory: WAITING
- Cleanup manifest: WAITING
- Candidate baseline PM review: WAITING
- Cleanup/adoption execution: NOT STARTED
- Product implementation: FROZEN
- Merge permission: BLOCKED

Hard rule:
Do not delete any test/recovery copy yet. First identify and classify every candidate. Destructive cleanup requires a separate PM-approved task after this evidence is reviewed.

Forward governance:
D-015 Single Owner Runtime Baseline is proposed on this review branch. The Owner runtime target is exactly `E:\Project AI\Video-sub-remove`; review/audit worktrees must never be used to launch the Owner app.

Next permitted action:
Anti reads this remote ACTIVE and the full remote task spec, performs read-only capture of the current local runtime/project/worktrees, publishes exactly one evidence report to this review branch, and stops at `WAITING_PM_REVIEW`.
