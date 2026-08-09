# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV5`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical source basis:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV5`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5.md`

Active amendment:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5-AMENDMENT-01.md`

Current PM authority basis:
The first local REV5 attempt is INVALIDATED after `git diff --check` failed and executor then used forbidden `git checkout src\renderer\index.html`. GitHub remote remained unchanged. Retry must use a NEW isolated clean worktree from the current remote REV5 HEAD and must read both the base REV5 spec and Amendment 01.

Invalidated implementation authority:
- failed local REV5 worktree `E:\Project AI\Video-sub-remove-clean-3`
- PR #35 / REV4 branch and all REV4 implementation commits
- REV3 / REV2 / PR #32 / PR #33 implementation source
- local stopped retries, stashes, patches, scratch scripts, normalization artifacts

Owner product baseline remains accepted. Do not ask Owner to reconfirm baseline.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5.md` from the same remote ref.
4. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5-AMENDMENT-01.md` from the same remote ref.
5. Record exact remote HEAD from `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
6. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals that canonical source basis.
7. Use a new isolated clean worktree from the CURRENT remote REV5 head.
8. Verify source files are canonical-baseline source, not copied invalidated content.

Hard STOP:
- no reuse/copy/cherry-pick/apply of invalidated Settings implementation;
- no Python/Node.js/PowerShell/sed/perl source rewrite or string-replacement scripts;
- no generated patch scripts;
- no `git checkout <path>`, restore, reset, clean, rebase, amend, force push, history rewrite;
- no line-ending conversion/normalization or mixed-EOL manipulation;
- no `git add .` or `git add -A`;
- no `--no-verify` or hook bypass;
- any required check warning/error/failure => STOP before commit and LEAVE THE WORKTREE UNTOUCHED;
- unexpected broad/full-file/EOL churn or duplicate DOM => STOP; no self-repair.

Amendment 01 authorizes one deterministic standard unified-diff workflow for approved source paths to avoid editor-induced EOL churn. Follow the amendment exactly.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
