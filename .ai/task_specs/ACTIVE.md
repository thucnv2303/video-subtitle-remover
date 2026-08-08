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

Invalidated execution authority:
- REV3 source commit `2494cc2a85293565303e00a3afcd728f42bd65d8`
- REV3 docs commit `866a3a86655f81ea964b50e8c84a61698092e41d`
- all earlier Settings attempts, stashes, local patches, scratch scripts, normalized files, copied source hunks, PR #32 and PR #33

Reason REV3 invalidated:
1. execution used broad Python patch scripts / line-ending manipulation despite explicit prohibition;
2. source diff showed broad churn in `settings.js`;
3. duplicate Settings DOM IDs were introduced by adding new General/System cards without removing/reconciling the old Storage/Hardware cards;
4. provider legacy-key isolation did not meet the persisted-provider-only migration contract;
5. CPU-only GPU state was rendered as `offline` rather than a valid non-error state;
6. TTS diagnostics included a direct-fetch fallback outside the required renderer API-only contract;
7. required Draft PR was not opened.

Owner product baseline remains accepted. Do not ask Owner to reconfirm baseline.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
3. Read the exact REV4 spec from the same remote ref.
4. Record exact remote HEAD from `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
5. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals that canonical source basis.
6. Start from a clean worktree only.
7. Verify current source files match canonical baseline, not REV3 content.

Hard STOP:
- no stash apply/pop or reuse of invalidated Settings work;
- no Python/PowerShell/sed/perl source rewrite scripts;
- no generated patch scripts;
- no line-ending conversion/normalization or mixed-EOL manipulation;
- no reset --hard / clean / destructive restore / rebase / amend / force push;
- no git add . / git add -A;
- no --no-verify / hook bypass;
- first unexpected required command/test/hook failure => STOP and report;
- if diff shows broad/full-file churn => STOP; do not self-repair with scripts.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
