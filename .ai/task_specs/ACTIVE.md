# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV1`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical product baseline:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Source basis SHA:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV1`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV1.md`

Supersedes / invalidates:
- `RECOVERY-007E-SETTINGS-V1-001`
- PR #32
- implementation commit `bd6730840cb609b4e0c3d47d78aee7ceee0637cd`

Owner decision:
- Current Owner runtime baseline is already accepted.
- Do NOT request baseline confirmation again.
- Settings V1 remains the active product request.

Anti authorization:
Implement only this exact remote REV1 spec from a clean isolated worktree/ref.
Do not reuse files, commits, patches, scratch artifacts, or documentation from invalidated PR #32.

Owner app verification:
NOT AUTHORIZED until PM code review PASS.

Merge permission:
BLOCKED.

Required startup:
1. `git fetch origin`
2. Read this file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV1`.
3. Read the exact execution spec from the same remote ref.
4. Record exact remote HEAD as spec basis.
5. Verify review branch ancestry reaches source basis `14807ee8f716a131a0565c0c77e5cb8f8e8cca29`.

Hard STOP rules:
- Do not run `git reset --hard`, `git clean`, destructive restore/checkout, force push, or history rewrite.
- Do not use `git add .` or `git add -A`.
- Do not generate or rewrite canonical docs with shell broad-rewrite commands.
- Do not continue after a failed pre-push gate.
- Do not target `main` or `dev` for the Draft PR.

If the remote ACTIVE/spec cannot be read or ancestry is wrong:
`STOP — ACTIVE SPEC / SOURCE BASIS INVALID`
