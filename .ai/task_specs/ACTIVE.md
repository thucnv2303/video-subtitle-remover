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

Active amendment:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6-AMENDMENT-01.md`

Current authority basis:
- INCIDENT-REV5-003 evidence publication: PASS; PR #36 closed unmerged.
- REV5 implementation commits remain INVALIDATED and forbidden as implementation input.
- First local REV6 attempt is INVALIDATED because executor used forbidden `git checkout <path>` and later `git diff --check` failed with trailing-whitespace errors.
- GitHub remote REV6 was verified unchanged after that failed local attempt.
- Failed worktree `E:\Project AI\Video-sub-remove-clean-REV6` is preserved/untouched and is not implementation input.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV6`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6.md` from the same remote ref.
4. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6-AMENDMENT-01.md` from the same remote ref.
5. Record exact remote REV6 HEAD.
6. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals the canonical source basis.
7. Use a NEW isolated clean worktree from the CURRENT remote REV6 HEAD.
8. Verify affected source blobs remain canonical-source blobs before editing.
9. Follow the Amendment 01 fresh-candidate/EOL-safe workflow exactly.

Hard controls and acceptance criteria in the base REV6 spec and Amendment 01 are authoritative. Any required warning/error/failure => STOP; do not self-repair, commit, or push.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
