# RECOVERY-007E-SETTINGS-V1-001-REV4

## Objective
Implement Settings V1 cleanly from canonical post-governance baseline `cf20a02f1e7491fddf7f05dab98fae12050460bb` after REV3 was invalidated for execution-control violations and confirmed UI/logic defects.

REV4 supersedes REV3 and all earlier Settings attempts as implementation authority.

## Canonical source basis
- Base branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Exact source basis: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Review branch: `review/RECOVERY-007E-SETTINGS-V1-001-REV4`

## Invalidated sources — DO NOT REUSE
Do not copy, cherry-pick, restore, apply, translate, or use as source input:
- REV3 source commit `2494cc2a85293565303e00a3afcd728f42bd65d8`
- REV3 docs commit `866a3a86655f81ea964b50e8c84a61698092e41d`
- PR #32 / PR #33 implementations
- REV2 stash or local working-tree edits
- any Settings patch/scratch/normalization script
- any generated normalized copy or mixed-EOL file

REV3 may be read only as defect evidence.

## Allowed source scope
Only:
- `src/renderer/index.html`
- `src/renderer/styles/main.css` only for narrow Settings layout fixes genuinely needed
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js` only if a narrow wrapper around an already-existing endpoint is genuinely required

No backend, Pipeline, Electron main/preload, package, dependency, or unrelated renderer source changes.

## Editing method hard control
Use a normal targeted editor only.

Forbidden:
- Python/PowerShell/sed/perl scripts that rewrite source files;
- generated patch scripts such as `patch_*.py`;
- whole-file replacement scripts;
- line-ending conversion/normalization;
- deliberately creating mixed LF/CRLF regions to satisfy `git diff --check`;
- broad trailing-whitespace cleanup;
- formatting unrelated regions;
- copying prior invalidated implementations.

If a targeted edit unexpectedly creates broad/full-file churn or EOL churn:
STOP immediately and report. Do not restore/rewrite/normalize/retry with scripts.

## Required Settings structure
The Settings page must expose exactly these product sections without duplicate legacy equivalents:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

Existing controls may be reorganized into these sections, but do not leave duplicate legacy Storage/Hardware cards that duplicate the same IDs or contracts.

### DOM uniqueness hard gate
At final source state, each of these IDs must occur exactly once in `index.html`:
- `output-dir-text`
- `btn-output-dir`
- `ai-provider`
- `ai-api-key`
- `ai-endpoint`
- `tts-status-chip`
- `btn-save-ai`
- `backend-status-chip`
- `gpu-status-chip`
- `btn-refresh-diagnostics`

No duplicate DOM IDs introduced by Settings changes.

## General
Use existing output-directory picker contract only.

Requirements:
- selected/current path visible;
- path container `min-width: 0` or equivalent;
- long path ellipsis/wrap safe;
- button remains usable;
- no horizontal overflow from path row;
- exactly one output-directory UI binding.

## AI Provider
Providers:
- Gemini
- DeepSeek
- Ollama

Canonical persistence:
- `ai_provider`
- `ai_api_keys_<provider>`
- `ai_model_<provider>`
- `ai_endpoint`
- `ai_prompt`

### Provider migration/isolation algorithm
On initial load:
1. read persisted `ai_provider` first; default Gemini only if absent;
2. remember this value as the initial persisted provider for this Settings load;
3. for a cloud provider, first read `ai_api_keys_<provider>`;
4. only when provider equals the initial persisted provider AND that provider-specific list is empty/missing may legacy `ai_api_key` populate that provider field;
5. optionally migrate the legacy value into that same provider-specific storage as a targeted compatibility action;
6. after switching provider in the UI, provider-specific storage is the only key source; if empty, show empty field;
7. switching to Gemini or DeepSeek must never reveal another provider's legacy/global key.

Saving provider A:
- write only `ai_api_keys_A` and `ai_model_A`;
- must not mutate provider B storage;
- do NOT keep globally synchronizing `ai_api_key` on every save;
- legacy `ai_api_key` is migration compatibility only, not current storage authority.

Ollama:
- no API-key authority;
- `ai_endpoint`;
- model `ai_model_ollama` through generic model convention.

## Pipeline 1 Defaults
Expose only existing defaults already used by the app. No Pipeline execution changes.
Preserve P1/P2/P3 boundaries.

## Voice Cloning
Preserve current working voice clone and TTS contracts/IDs/functions.
Do not refactor generation, mixing, backend APIs, or pipeline behavior.

## System / Diagnostics
Use only:
- `window.api.health()`
- `window.api.gpuInfo()`
- `window.api.getTTSStatus()`

No direct `fetch()` fallback for diagnostic endpoints.
No added backend route.

Backend:
- own loading/success/error semantics.

GPU:
- use `gpu_available`, `gpu_name`, `cuda_version`;
- `gpu_available === true`: valid GPU/CUDA state;
- `gpu_available === false`: valid CPU-only state, visibly neutral/valid, NOT an error/offline state;
- thrown call / malformed unavailable response: error state.

TTS:
- use response from `window.api.getTTSStatus()` only;
- own loading/available/unavailable/error interpretation;
- no direct-fetch second path.

## Required static verification BEFORE source commit
1. `node --check src/renderer/js/components/settings.js`
2. `node --check src/renderer/js/api.js` only if changed
3. applicable existing Settings tests; otherwise report `NONE FOUND`
4. `git diff --check`
5. inspect `git diff --stat`
6. inspect `git diff --numstat`
7. inspect full source diff
8. verify no forbidden source files
9. verify no generated patch/scratch files
10. verify no broad EOL/format churn
11. verify DOM ID uniqueness for the listed hard-gate IDs
12. inspect provider persistence logic and prove:
    - initial persisted Gemini can migrate legacy Gemini key;
    - initial persisted DeepSeek can migrate legacy DeepSeek key;
    - switching provider with no provider-specific key shows blank;
    - saving A does not write B;
    - normal save does not globally synchronize legacy `ai_api_key`
13. inspect diagnostics and prove:
    - no direct fetch diagnostic fallback;
    - CPU-only is valid non-error state.

If any required check fails: STOP. Do not self-repair through scripts or bypass.

## Source commit gate
Stage exact source paths only.
Inspect:
- `git diff --cached --name-only`
- `git diff --cached`

Normal commit with hooks enabled.
Failure => STOP.

## Documentation commit
After successful source commit, update minimally and exactly:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

Record:
- REV3 INVALIDATED and why at high level;
- REV4 source commit SHA;
- exact static verification results;
- executor GUI result PASS only if actually run, otherwise NOT AVAILABLE;
- code review WAITING;
- Owner app test NOT STARTED — WAITING FOR PM CODE REVIEW;
- docs sync PASS after docs commit;
- merge BLOCKED.

Preserve useful historical context. Do not shorten/rewrite whole canonical docs.
Stage all three together and commit normally.

## Pre-push hard gate
Compare against canonical `cf20a02f1e7491fddf7f05dab98fae12050460bb`.
Allowed differences only:
- PM REV4 task files;
- approved Settings source files actually changed;
- three dynamic docs.

Required:
- source/docs commits separate;
- no forbidden app files;
- no patch/scratch/generated files;
- no broad EOL churn;
- no duplicate hard-gate DOM IDs;
- provider isolation PASS;
- diagnostics semantics PASS;
- Owner test NOT STARTED;
- merge BLOCKED.

Failure => `STOP — PUSH NOT AUTHORIZED`.

## Publication
Push only `review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
Open Draft PR:
- head `review/RECOVERY-007E-SETTINGS-V1-001-REV4`
- base `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Opening the Draft PR is REQUIRED before final executor report.
Do not mark ready.
Do not merge.

## Final executor report
Return:
- STATUS: `IMPLEMENTATION_COMPLETE`, `WAITING_EVIDENCE`, `BLOCKED`, or `IMPLEMENTATION_FAILED`
- execution-spec remote HEAD
- source basis SHA
- source commit SHA
- docs commit SHA
- final branch HEAD
- Draft PR number/URL
- exact changed files
- exact `git diff --stat` and `--numstat` summary
- static checks and outputs
- DOM uniqueness results
- provider isolation verification results
- diagnostics verification results
- executor GUI PASS or NOT AVAILABLE
- Owner test NOT STARTED
- merge BLOCKED
- NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
