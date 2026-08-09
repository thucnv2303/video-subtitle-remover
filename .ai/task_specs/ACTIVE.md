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

Current authority basis:
- INCIDENT-REV6-004 evidence publication: PASS / RESOLVED.
- Evidence PR #37 closed unmerged.
- REV6 published implementation remains INVALIDATED.
- REV6 source/docs commits and all REV6 implementation artifacts are forbidden as implementation input.
- GitHub comparison verified `b88ffc62...` differs from canonical `cf20a02...` only in `.ai` files; no source changes exist in the trusted project-state basis.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV7`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7.md` from the same remote ref.
4. Record exact remote REV7 HEAD as execution authority.
5. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals the canonical source basis.
6. Use a NEW isolated clean worktree from that exact remote REV7 HEAD.
7. Verify affected source blobs against canonical source before editing.
8. Follow the REV7 execution method exactly.

First unexpected required warning/error/nonzero gate => STOP. Do not self-repair after a failed required gate.

Owner app verification:
NOT STARTED / NOT AUTHORIZED until PM GitHub code-review PASS.

Merge permission:
BLOCKED.
