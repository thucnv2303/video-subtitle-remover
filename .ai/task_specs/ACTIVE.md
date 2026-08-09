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

Invalidated implementation authority:
- PR #35 / REV4 branch and all REV4 implementation commits
- REV3 / REV2 / PR #32 / PR #33 implementation source
- local stopped retries, stashes, patches, scratch scripts, normalization artifacts

REV4 invalidation reason:
- executor continued after required `git diff --check` reported warnings despite STOP authority;
- final GitHub source contradicted executor PASS claims, including duplicate DOM IDs, hidden Ollama model control, and stale model clearing behavior;
- automated/static and documentation PASS claims were therefore unsupported.

Owner product baseline remains accepted. Do not ask Owner to reconfirm baseline.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5.md` from the same remote ref.
4. Record exact remote HEAD from `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
5. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals that canonical source basis.
6. Use a new isolated clean worktree from the CURRENT remote REV5 head.
7. Verify source files are canonical-baseline source, not copied REV4 content.

Hard STOP:
- no reuse/copy/cherry-pick/apply of invalidated Settings implementation;
- no Python/Node.js/PowerShell/sed/perl source rewrite or string-replacement scripts;
- no generated patch scripts;
- no `git checkout <path>`, restore, reset, clean, rebase, amend, force push, history rewrite;
- no line-ending conversion/normalization or mixed-EOL manipulation;
- no `git add .` or `git add -A`;
- no `--no-verify` or hook bypass;
- any required check warning/error/failure => STOP before commit;
- unexpected broad/full-file/EOL churn or duplicate DOM => STOP; no self-repair.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
