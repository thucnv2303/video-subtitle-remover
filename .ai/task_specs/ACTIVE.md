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

Active amendments:
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5-AMENDMENT-01.md` — historical first retry authority, consumed.
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5-AMENDMENT-02.md` — CURRENT retry authority.

Current PM authority basis:
The second local REV5 attempt is INVALIDATED. It failed mandatory DOM uniqueness after applying a candidate patch. Its transcript also used forbidden `git reset --hard`, `git clean -fd`, `git restore .`, and `git add .` in scratch Git repositories, and ran `npm run test || echo "NONE FOUND"`, masking the expected npm error even though canonical `package.json` has no `test` script. GitHub remote remained unchanged by the failed implementation attempt before Amendment 02 publication.

Invalidated implementation authority includes:
- failed local REV5 worktree `E:\Project AI\Video-sub-remove-clean-3`
- failed local REV5 worktree `E:\Project AI\Video-sub-remove-clean-5`
- `C:\Users\thucn\.gemini\antigravity\scratch\rev5\`
- `C:\Users\thucn\.gemini\antigravity\scratch\rev5_clean\`
- patches/candidates/source copies from either failed REV5 attempt
- PR #35 / REV4 branch and all REV4 implementation commits
- REV3 / REV2 / PR #32 / PR #33 implementation source
- local stopped retries, stashes, patches, scratch scripts, normalization artifacts

Owner product baseline remains accepted. Do not ask Owner to reconfirm baseline.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
3. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5.md` from the same remote ref.
4. Read Amendment 01 from the same remote ref for historical context.
5. Read `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5-AMENDMENT-02.md` from the same remote ref as CURRENT authority.
6. Record exact remote HEAD from `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
7. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals that canonical source basis.
8. Use a NEW isolated clean worktree from the CURRENT remote REV5 head.
9. Verify source files are canonical-baseline source, not copied invalidated content.

Hard STOP:
- no reuse/copy/cherry-pick/apply of invalidated Settings implementation;
- no Python/Node.js/PowerShell/sed/perl source rewrite or string-replacement scripts;
- no generated patch-helper scripts;
- no `git checkout <path>`, restore, reset, clean, rebase, amend, force push, history rewrite;
- no line-ending conversion/normalization or mixed-EOL manipulation;
- no `git add .` or `git add -A`;
- no `--no-verify` or hook bypass;
- no shell fallback such as `||` to mask a required command failure;
- any required check warning/error/failure => STOP before commit and LEAVE THE TASK WORKTREE UNTOUCHED;
- unexpected broad/full-file/EOL churn, missing required DOM, or duplicate DOM => STOP; no self-repair.

Amendment 02 authorizes the fresh-candidate workflow described there. Follow it exactly. Do not initialize a Git repository in the candidate workspace.

Canonical `package.json` has no `test` script. Do not run nonexistent npm test commands merely to prove absence. Inspect test availability read-only and record `Applicable Settings tests: NONE FOUND` if appropriate.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
