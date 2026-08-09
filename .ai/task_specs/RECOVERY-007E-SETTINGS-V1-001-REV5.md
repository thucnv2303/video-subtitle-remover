# RECOVERY-007E-SETTINGS-V1-001-REV5

## Objective
Implement Settings V1 from the canonical post-governance baseline after REV4 was invalidated by PM review.

REV5 is a fresh implementation authority. REV4 and all earlier Settings implementations are defect evidence only and MUST NOT be reused as source input.

## Canonical source basis
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Exact source basis: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Review branch: `review/RECOVERY-007E-SETTINGS-V1-001-REV5`

## Invalidated sources — DO NOT REUSE
Do not copy, cherry-pick, restore, apply, translate, or use as source input:
- PR #35 / branch `review/RECOVERY-007E-SETTINGS-V1-001-REV4` implementation commits;
- REV4 source commits including `7ba7c4579aabec91aa4a36ad8eb8f9be6b40c9aa`, `150ca386fe709ee089ec3439165bd275fadc8a4e`, `c724bd77f8997c91d626335c7f6e062040ba98a5`;
- REV4 docs commits including `25acd4a6c259fe75cebf104b294e93c6b7cac6c4`, `ec63fc8b861cf37c7a8595c7a776a87010222e9f`, `d0934681bb6477671adf72cea3b696f5f2e2ecda`;
- local stopped retry commits `2ead767` / `a126aa9`;
- REV3/REV2/PR #32/PR #33 implementation source;
- any Settings patch/scratch/normalization script or generated normalized copy.

REV4 may be read only as defect evidence.

## Why REV4 was invalidated
1. Executor continued after required `git diff --check` reported warnings despite explicit STOP-on-failure authority.
2. Final GitHub source contradicted executor PASS claims: duplicate `ai-model` / `ai-model-group`, duplicate `tts-status-chip`, Ollama model still hidden, and blank model still not persisted.
3. Automated/static PASS and documentation PASS claims were therefore unsupported.
4. Owner test was never authorized.

## Allowed source scope
Only:
- `src/renderer/index.html`
- `src/renderer/styles/main.css` only if a narrow Settings layout fix is genuinely required
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js` only if a narrow wrapper around an already-existing endpoint is genuinely required

No backend, Pipeline, Electron main/preload, package, dependency, or unrelated renderer source changes.

## Editing controls
Use a normal targeted editor only.

Forbidden:
- Python/Node.js/PowerShell/sed/perl scripts that rewrite or string-replace source files;
- generated patch scripts;
- whole-file replacement scripts;
- `git checkout <path>`, `git restore`, reset/clean/rebase/amend/force-push for repair;
- line-ending conversion/normalization or deliberately mixed EOL;
- broad formatting/trailing-whitespace cleanup;
- copying any invalidated implementation.

If any targeted edit causes unexpected broad/full-file churn, EOL churn, duplicate DOM, or a required check fails: STOP immediately. Do not self-repair in the same execution.

## Required Settings structure
Exactly five product sections:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

No duplicate legacy Storage/Hardware equivalents.

### DOM uniqueness hard gate
Each must occur exactly once:
- `output-dir-text`
- `btn-output-dir`
- `ai-provider`
- `ai-api-key`
- `ai-model`
- `ai-endpoint`
- `tts-status-chip`
- `btn-save-ai`
- `backend-status-chip`
- `gpu-status-chip`
- `btn-refresh-diagnostics`

## General
Preserve existing output-directory picker contract. Long paths must not break narrow layout. Exactly one output-directory binding.

## AI Provider
Providers: Gemini, DeepSeek, Ollama.

Canonical persistence:
- `ai_provider`
- `ai_api_keys_<provider>`
- `ai_model_<provider>`
- `ai_endpoint`
- `ai_prompt`

### Provider-specific behavior
Gemini / DeepSeek:
- API-key field visible;
- model field visible;
- endpoint field hidden;
- load/save provider-specific `ai_api_keys_<provider>` and `ai_model_<provider>`.

Ollama:
- API-key field hidden;
- model field visible;
- endpoint field visible;
- model authority `ai_model_ollama`;
- endpoint authority `ai_endpoint`;
- no API-key authority.

Saving provider A:
- write `ai_api_keys_A` for cloud providers only;
- write `ai_model_A` unconditionally, including blank string when user clears the field;
- must not mutate provider B key/model;
- normal save must not write legacy `ai_api_key`.

### One-time legacy migration
On initial Settings load only:
1. read persisted `ai_provider` first; default Gemini if absent;
2. if initial persisted provider is Gemini or DeepSeek and its provider-specific key storage is missing/empty, legacy `ai_api_key` may be migrated to that provider-specific storage;
3. after that initial load/migration step, provider UI switching must read provider-specific storage only;
4. switching away and back must never resurrect legacy `ai_api_key`;
5. legacy `ai_api_key` is migration compatibility only, not current authority.

## Pipeline 1 Defaults
Expose/reorganize only existing defaults already consumed by the app. No parallel `p1_default_*` state. No Pipeline execution changes.

## Voice Cloning
Preserve existing working voice clone/TTS contracts, IDs, generation, mixing, and backend behavior.

## System / Diagnostics
Use only:
- `window.api.health()`
- `window.api.gpuInfo()`
- `window.api.getTTSStatus()`

No direct diagnostic `fetch()` fallback.

GPU:
- `gpu_available === true`: valid GPU state;
- `gpu_available === false`: valid CPU-only, visibly non-error;
- thrown/malformed response: error.

## Required verification before source commit
Record actual command output/evidence.

1. `node --check src/renderer/js/components/settings.js`
2. `node --check src/renderer/js/api.js` only if changed
3. applicable existing Settings tests; otherwise report `NONE FOUND`
4. `git diff --check` — MUST exit 0 with no warnings/errors
5. `git diff --stat`
6. `git diff --numstat`
7. inspect full source diff
8. verify no forbidden/generated/scratch files
9. verify no broad EOL/format churn
10. verify all listed DOM IDs exactly once
11. verify Gemini: API key visible, model visible, endpoint hidden
12. verify DeepSeek: API key visible, model visible, endpoint hidden
13. verify Ollama: API key hidden, model visible, endpoint visible
14. verify `ai_model_gemini`, `ai_model_deepseek`, `ai_model_ollama` load/save
15. verify blank model save clears/writes blank current-provider model
16. verify initial persisted Gemini legacy migration once
17. verify initial persisted DeepSeek legacy migration once
18. verify switching provider with no provider-specific key shows blank
19. verify switching away/back does not resurrect legacy key
20. verify saving A does not mutate B
21. verify normal save does not write `ai_api_key`
22. verify absent `p1_default_ai_model`, `p1_default_tts_voice`, `ai_endpoint_deepseek`
23. verify no direct diagnostic `fetch()`
24. verify CPU-only state non-error

Any failed required check => STOP. No commit, no docs update, no push.

## Source commit gate
Stage exact approved source paths only. Never `git add .` or `git add -A`.

Inspect:
- `git diff --cached --name-only`
- `git diff --cached`

Commit normally with hooks enabled. Hook failure => STOP.

## Documentation commit
Only after source commit succeeds, minimally update exactly:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

Preserve useful canonical history. Record:
- REV4 INVALIDATED at high level;
- exact REV5 source SHA;
- actual verification results;
- executor GUI PASS only if actually run, otherwise NOT AVAILABLE;
- code review WAITING;
- Owner test NOT STARTED — WAITING FOR PM CODE REVIEW;
- documentation synchronization PASS only after docs commit;
- merge BLOCKED.

Stage those three exact files together and commit normally.

## Pre-push gate
Fetch origin. If remote review branch moved from startup basis: STOP.

Compare against canonical `cf20a02f1e7491fddf7f05dab98fae12050460bb`.
Allowed differences only:
- PM REV5 authority/spec files;
- approved Settings source files;
- three dynamic docs.

Required:
- source/docs commits separate;
- no forbidden files;
- no patch/scratch files;
- `git diff --check` clean;
- DOM uniqueness PASS;
- provider isolation/model PASS;
- diagnostics PASS;
- Owner test NOT STARTED;
- merge BLOCKED.

## Publication
Fast-forward push only to `review/RECOVERY-007E-SETTINGS-V1-001-REV5`.
Open a new Draft PR:
- head `review/RECOVERY-007E-SETTINGS-V1-001-REV5`
- base `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Do not mark Ready. Do not merge.

## Final executor report
Return:
- STATUS: `IMPLEMENTATION_COMPLETE`, `WAITING_EVIDENCE`, `BLOCKED`, or `IMPLEMENTATION_FAILED`
- startup execution-spec remote HEAD
- source basis SHA
- source commit SHA
- docs commit SHA
- final remote HEAD
- Draft PR number/URL
- exact changed files
- actual diff stat/numstat
- verbatim verification results sufficient to substantiate all gates
- executor GUI PASS or NOT AVAILABLE
- Owner test NOT STARTED
- merge BLOCKED
- NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
