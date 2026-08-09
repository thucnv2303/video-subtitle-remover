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

Active amendment:
`.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV4-AMENDMENT-01.md`

Amendment authority:
- The normal editor repeatedly damaged repetitive HTML while attempting the PM-requested PR #35 revision.
- A one-time deterministic `git apply --check` + `git apply` workflow is authorized by Amendment 01.
- Python/Node.js/PowerShell/sed/perl source rewrite or string-replacement scripts remain forbidden.
- Any patch file must stay outside the repository and must never be staged or committed.
- Continue only from a new isolated clean worktree based on the current remote REV4 head; preserve the stopped dirty worktree unchanged.

Invalidated execution authority:
- REV3 source commit `2494cc2a85293565303e00a3afcd728f42bd65d8`
- REV3 docs commit `866a3a86655f81ea964b50e8c84a61698092e41d`
- local stopped-retry commits/work `2ead767`, `a126aa9`, and generated patch/script work
- all earlier Settings attempts, stashes, local patches, scratch scripts, normalized files, copied source hunks, PR #32 and PR #33

Current PM code-review blockers on Draft PR #35:
1. implement canonical provider model persistence `ai_model_<provider>` for Gemini, DeepSeek, and Ollama;
2. remove unused parallel state `p1_default_ai_model` and `p1_default_tts_voice`;
3. remove noncanonical `ai_endpoint_deepseek`;
4. preserve strict provider-key isolation / one-time legacy migration;
5. preserve five-section Settings structure, unique hard-gate DOM IDs, API-only diagnostics, CPU-only non-error state, TTS/voice-clone contracts, and Pipeline boundaries.

Owner product baseline remains accepted. Do not ask Owner to reconfirm baseline.

Required startup:
1. `git fetch origin`
2. Read this ACTIVE file from `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
3. Read the exact REV4 spec from the same remote ref.
4. Read Amendment 01 from the same remote ref.
5. Record exact current remote HEAD from `git rev-parse origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
6. Verify merge-base with `cf20a02f1e7491fddf7f05dab98fae12050460bb` equals that canonical source basis.
7. Create/use a new isolated clean git worktree from the CURRENT remote REV4 head; do not overwrite or clean the stopped dirty worktree.

Hard STOP:
- no stash apply/pop or reuse of invalidated Settings work;
- no Python/Node.js/PowerShell/sed/perl source rewrite or string-replacement scripts;
- no generated patch scripts;
- no line-ending conversion/normalization or mixed-EOL manipulation;
- no reset --hard / clean / destructive restore / rebase / amend / force push;
- no git add . / git add -A;
- no --no-verify / hook bypass;
- first unexpected required command/test/hook failure => STOP and report;
- patch-check failure, patch-application mismatch, remote-head movement after startup, broad/full-file churn, or EOL churn => STOP; no self-repair.

Owner app verification:
NOT STARTED — only after PM GitHub code-review PASS.

Merge permission:
BLOCKED.
