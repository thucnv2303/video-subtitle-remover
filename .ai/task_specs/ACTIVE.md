# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV6`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical source basis:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

Trusted project-state ancestor:
`b772a7ad132fd0c3e591a632843a7b56a45eba8e`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV6`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6.md`

Incident disposition:
- INCIDENT-REV5-003 evidence publication: PASS.
- Evidence PR #36 closed unmerged; evidence-only, not an implementation candidate.
- REV5 source commit `0b3a81ec7532913146232ac1259f8bbdb9bd9ef2` and docs commit `f852446802483c5677667d8a3075fb0d593ce5d4` are INVALIDATED and forbidden as implementation input.
- GitHub verified trusted source blobs at `b772a7ad...` match canonical source `cf20a02...` for the affected Settings source files.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV6`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6.md` from the same remote ref.
4. Record exact remote REV6 HEAD.
5. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals the canonical source basis.
6. Use a NEW isolated clean worktree from the CURRENT remote REV6 HEAD.
7. Verify affected source blobs remain canonical-source blobs before editing.

Hard controls and acceptance criteria are authoritative in the REV6 spec. Any required warning/error/failure => STOP; do not self-repair, commit, or push.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
