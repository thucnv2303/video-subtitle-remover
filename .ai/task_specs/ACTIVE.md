# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV3`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical product baseline:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical baseline HEAD / execution source basis:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

Owner runtime source ancestor:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV3`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV3.md`

Supersedes / invalidates as implementation authority:
- `RECOVERY-007E-SETTINGS-V1-001`
- `RECOVERY-007E-SETTINGS-V1-001-REV1`
- `RECOVERY-007E-SETTINGS-V1-001-REV2` local/incomplete execution
- PR #32 and PR #33
- any stash, uncommitted local Settings edits, normalized copies, scratch files, or patches produced during earlier attempts

Governance prerequisite:
- PR #34 merged into canonical baseline as `cf20a02f1e7491fddf7f05dab98fae12050460bb`.
- Corrected tracked pre-commit hook is now canonical.

Owner decision:
- Current Owner runtime baseline remains accepted.
- Do NOT request baseline confirmation again.
- Settings V1 remains the active product request.

Anti authorization:
Implement only the exact REV3 spec from this remote review branch, starting from a clean worktree whose HEAD equals the remote execution-spec HEAD read at startup.
Do not restore/apply/pop/cherry-pick/copy any earlier Settings stash, commit, patch, normalized file, or invalidated PR implementation.

Owner app verification:
NOT STARTED. Owner runtime verification is authorized only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.

Required startup:
1. `git fetch origin`
2. Read this file with `git show "origin/review/RECOVERY-007E-SETTINGS-V1-001-REV3:.ai/task_specs/ACTIVE.md"`.
3. Read the exact execution spec with `git show "origin/review/RECOVERY-007E-SETTINGS-V1-001-REV3:.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV3.md"`.
4. Record `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV3` as execution-spec remote HEAD.
5. Verify ancestry reaches canonical source basis `cf20a02f1e7491fddf7f05dab98fae12050460bb`.
6. Verify worktree is clean before editing.
7. Verify the tracked `.githooks/pre-commit` contains the adopted separate source/docs policy before implementation.

Hard STOP rules:
- no `git reset --hard`, `git clean`, destructive restore/checkout, force push, rebase, amend, or history rewrite;
- no `git add .` or `git add -A`;
- no `git commit --no-verify`, hook bypass, or equivalent;
- no stash apply/pop/restore/copy from earlier Settings attempts;
- no Python/PowerShell/sed/perl scripts that rewrite whole source or canonical doc files;
- no line-ending normalization or broad trailing-whitespace cleanup;
- no continuing after a failed required command, hook, or gate;
- do not target `main` or `dev`.

If remote authority cannot be read, remote HEAD changes during execution, ancestry is wrong, worktree is dirty at startup, or a required gate fails:
`STOP — EXECUTION CONTROL / SOURCE BASIS INVALID`
