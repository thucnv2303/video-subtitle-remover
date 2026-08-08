# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV2`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical product baseline:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Source basis SHA:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV2`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV2.md`

Supersedes / invalidates:
- `RECOVERY-007E-SETTINGS-V1-001`
- `RECOVERY-007E-SETTINGS-V1-001-REV1`
- PR #32
- PR #33
- commits `bd6730840cb609b4e0c3d47d78aee7ceee0637cd`, `8c2a90204a20718a577100df22f65cd5cb3695db`, `56159e667b34b2736b617bb6650941dd62cffabb`

Owner decision:
- Current Owner runtime baseline is already accepted.
- Do NOT request baseline confirmation again.
- Settings V1 remains the active product request.

Anti authorization:
Implement only this exact remote REV2 spec from a clean isolated worktree/ref.
Do not reuse code, commits, patches, scratch artifacts, normalized files, or documentation from invalidated PR #32/#33.

Owner app verification:
NOT AUTHORIZED until PM code review PASS.

Merge permission:
BLOCKED.

Required startup:
1. `git fetch origin`
2. Read this file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV2`.
3. Read the exact REV2 execution spec from the same remote ref.
4. Record exact remote HEAD as execution-spec basis.
5. Verify ancestry reaches source basis `14807ee8f716a131a0565c0c77e5cb8f8e8cca29`.
6. Verify the worktree is clean before editing.

Hard STOP rules:
- Do not run `git reset --hard`, `git clean`, destructive restore/checkout, force push, rebase, amend, or history rewrite.
- Do not use `git add .` or `git add -A`.
- Do not use `git commit --no-verify`, `HUSKY=0`, hook bypasses, or any equivalent bypass.
- Do not use Python/PowerShell/sed/perl scripts that rewrite whole source or canonical doc files.
- Do not normalize line endings or trailing whitespace across whole files.
- Do not continue after ANY failed required command or commit hook. First unexpected failure => STOP and report.
- Do not target `main` or `dev` for the Draft PR.

If remote ACTIVE/spec cannot be read, ancestry is wrong, worktree is not clean, or a required command fails:
`STOP — EXECUTION CONTROL / SOURCE BASIS INVALID`
