# Active PM Execution Spec

Status: ACTIVE

Task:
`GOVERNANCE-AGENTOS-PRECOMMIT-001`

Repository:
`thucnv2303/video-subtitle-remover`

Base branch:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Source basis SHA:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/GOVERNANCE-AGENTOS-PRECOMMIT-001`

Execution spec:
`.ai/task_specs/GOVERNANCE-AGENTOS-PRECOMMIT-001.md`

Reason:
The tracked `.githooks/pre-commit` requires the three dynamic `.ai` files to be staged in the same commit as source code, while the active project workflow requires source and documentation commits to be separate. This is a verified governance conflict.

Product task state:
`RECOVERY-007E-SETTINGS-V1-001-REV2` remains BLOCKED. Do not continue Settings implementation during this governance task.

Owner app verification:
NOT APPLICABLE to this governance-only hook correction. Product Owner test remains NOT STARTED.

Merge permission:
BLOCKED until PM review and explicit merge approval.

Required startup:
1. `git fetch origin`
2. Read this file from `origin/review/GOVERNANCE-AGENTOS-PRECOMMIT-001`.
3. Read the exact execution spec from the same remote ref.
4. Record exact remote HEAD as execution-spec basis.
5. Verify ancestry reaches `14807ee8f716a131a0565c0c77e5cb8f8e8cca29`.
6. Verify clean worktree before editing.

Hard STOP:
- no reset/restore/clean/rebase/amend/force push/history rewrite;
- no `git add .` or `git add -A`;
- no `--no-verify` or hook bypass;
- no product source edits;
- no Settings edits;
- no broad rewrite/line-ending normalization;
- first unexpected command/hook/test failure => STOP and report.