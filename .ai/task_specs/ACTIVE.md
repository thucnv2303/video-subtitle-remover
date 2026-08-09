# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV7`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical source basis:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

Trusted project-state basis:
`b88ffc62aec35cb28de7adf7ce70750f478b29f5`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7.md`

Active amendment:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7-AMENDMENT-01.md`

Current authority basis:
- INCIDENT-REV6-004 evidence publication: PASS / RESOLVED; PR #37 closed unmerged.
- REV6 published implementation remains INVALIDATED and forbidden as implementation input.
- First REV7 pre-edit attempt STOPPED correctly before source editing because raw working-tree hashes differed under Windows CRLF checkout.
- GitHub verification proved both remote REV7 source blobs exactly match canonical `cf20a02...`; the failed gate was a local working-tree/EOL false positive, not source contamination.
- Failed local worktree `E:\Project AI\Video-sub-remove-clean-REV7` is not reusable.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV7`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7.md` from the same remote ref.
4. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7-AMENDMENT-01.md` from the same remote ref.
5. Record exact remote REV7 HEAD as execution authority.
6. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals the canonical source basis.
7. Use a NEW isolated clean worktree from that exact remote REV7 HEAD.
8. Apply the corrected pre-edit identity gate from Amendment 01: committed HEAD blob SHAs + clean status + `git diff --quiet`; record EOL separately.
9. Follow all remaining REV7 execution, verification, publication, and STOP rules exactly.

First unexpected required warning/error/nonzero gate => STOP. Do not self-repair after a failed required gate.

Owner app verification:
NOT STARTED / NOT AUTHORIZED until PM GitHub code-review PASS.

Merge permission:
BLOCKED.
