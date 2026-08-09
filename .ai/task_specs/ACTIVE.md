# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-SETTINGS-V1-001-REV4`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical source basis:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV4`

Execution spec:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV4.md`

Active amendments:
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV4-AMENDMENT-01.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV4-AMENDMENT-02.md`

Current review basis:
- Draft PR #35
- Reviewed head: `ec63fc8b861cf37c7a8595c7a776a87010222e9f`
- Amendment 01 source commit: `150ca386fe709ee089ec3439165bd275fadc8a4e`
- Amendment 01 docs commit: `ec63fc8b861cf37c7a8595c7a776a87010222e9f`
- PM decision: NEEDS_REVISION

Current PM blockers are defined by Amendment 02:
1. Ollama API-key field hidden, but `ai-model` must remain visible/editable and persist `ai_model_ollama`; endpoint remains visible via `ai_endpoint`.
2. Legacy `ai_api_key` migration must be truly one-time initial-load compatibility; later provider switching cannot resurrect it.
3. Saving a blank model must clear/write blank to `ai_model_<provider>` rather than preserve stale model state.
4. Repair exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`: preserve canonical history/context, remove control-character corruption, record exact verification/gates, and do not whole-file replace them with `Set-Content`.
5. Required verification evidence must be actually executed and recorded before reporting automated/static PASS.

Editing authority:
- Amendment 01 unified-diff workflow remains authorized.
- Inspect full patch before application.
- `git apply --check` must pass before `git apply`.
- Patch files stay outside repository.
- Python/Node.js/PowerShell/sed/perl source/doc rewrite or string-replacement scripts remain forbidden.
- `Set-Content` or equivalent whole-file replacement of canonical `.ai` files is forbidden.

Invalidated execution authority:
- REV3 source commit `2494cc2a85293565303e00a3afcd728f42bd65d8`
- REV3 docs commit `866a3a86655f81ea964b50e8c84a61698092e41d`
- local stopped-retry commits/work `2ead767`, `a126aa9`, and generated patch/script work
- all earlier Settings attempts, stashes, local patches, scratch scripts, normalized files, copied source hunks, PR #32 and PR #33

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
3. Read the exact REV4 spec from the same remote ref.
4. Read Amendment 01 and Amendment 02 from the same remote ref.
5. Record exact current remote HEAD from `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
6. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals that canonical source basis.
7. Use a new isolated clean git worktree from the CURRENT remote REV4 head; preserve existing stopped/dirty worktrees unchanged.

Hard STOP:
- no stash apply/pop or reuse of invalidated Settings work;
- no Python/Node.js/PowerShell/sed/perl rewrite or string-replacement scripts;
- no generated patch scripts;
- no line-ending conversion/normalization or mixed-EOL manipulation;
- no reset --hard / clean / destructive restore / rebase / amend / force push;
- no git add . / git add -A;
- no --no-verify / hook bypass;
- no whole-file `Set-Content` replacement of canonical dynamic docs;
- first unexpected required command/test/hook failure => STOP and report;
- patch-check failure, patch-application mismatch, remote-head movement after startup, broad/full-file churn, or EOL churn => STOP; no self-repair.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
