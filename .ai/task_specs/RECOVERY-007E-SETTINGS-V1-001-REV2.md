# RECOVERY-007E-SETTINGS-V1-001-REV2

## Objective
Implement Settings V1 on the accepted Owner runtime baseline with a narrow, reviewable diff and no execution-control violations.

## Source authority
Canonical product baseline branch:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Exact source basis SHA:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV2`

Invalidated work that MUST NOT be reused:
- PR #32
- PR #33
- commits from those implementations
- normalized/rewritten copies of index.html/settings.js/docs produced by those attempts

## Allowed source files
- `src/renderer/index.html`
- `src/renderer/styles/main.css`
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js` only if a narrow wrapper for an already-existing backend endpoint is genuinely needed

## Forbidden source files
- `api/server.py`
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- Electron main/preload
- package/dependency files
- scratch/patch/backup/test-media files

No new backend endpoints.

## Required Settings structure
One scrollable page with these groups:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

Preserve the existing visual system. Do not redesign unrelated Home/Pipeline UI.

### General
- Keep existing output directory picker.
- Current path must remain visible but truncation-safe.
- Add narrow CSS only as needed, e.g. a wrapper/class with `min-width:0`, overflow hidden, text-overflow ellipsis, and nowrap where appropriate.
- Narrow screen must not cause horizontal overflow.

### AI Provider
Providers: Gemini / DeepSeek / Ollama.

Persisted contracts:
- selected provider: `ai_provider`
- provider API key arrays: `ai_api_keys_gemini`, `ai_api_keys_deepseek`
- selected model: `ai_model_<provider>`
- Ollama endpoint: `ai_endpoint`
- legacy global `ai_api_key` may remain only as backward compatibility for the CURRENT selected cloud provider when loading old state

Provider isolation is mandatory:
- Switching from Gemini to DeepSeek must never display Gemini's key when DeepSeek has no provider-specific key.
- Switching from DeepSeek to Gemini must never display DeepSeek's key when Gemini has no provider-specific key.
- If the selected cloud provider lacks `ai_api_keys_<provider>`, use the legacy global `ai_api_key` only when it can safely be attributed to the same selected provider from existing state; otherwise show blank.
- Saving provider A must not delete/overwrite provider B's stored key/model.
- Ollama must not use/store an API key as its model.
- Models must persist only in `ai_model_gemini`, `ai_model_deepseek`, `ai_model_ollama`.
- DOM IDs may be `ai-cloud-model` and `ai-ollama-model`, but do not persist `ai_cloud_model` or `ai_ollama_model`.

No fake test connection or model discovery.

### Pipeline 1 Defaults
Preserve active contracts and behavior:
- `ai_prompt`
- `tts_voice`
- `tts_language`
- `tts_bg_volume`
- `tts_remove_vocal`

### Voice Cloning
Preserve current working behavior and existing IDs/functions:
- reference audio picker
- clone name/action
- saved voices list/delete
- test TTS playback

Do not change backend TTS contracts.

### System / Diagnostics
Use only existing APIs:
- `window.api.health()`
- `window.api.gpuInfo()`
- `window.api.getTTSStatus()`

Required states: checking / success / error.

GPU payload handling:
- `gpu_available`
- `gpu_name`
- `cuda_version`
- CPU-only is valid, not offline.

Failures must stay contained to diagnostic chips and must not break Settings initialization.

## Functional acceptance criteria
1. Settings opens with no JS error.
2. Five required groups are visible and understandable.
3. Gemini/DeepSeek show API key + model; Ollama shows endpoint + model and no API key.
4. Provider switching does not leak another provider's key into the field.
5. Save/reload restores provider-specific key/model values correctly.
6. Pipeline 1 can consume `ai_model_<provider>` without changing pipeline1-ai.js.
7. Output directory picker still works and long path truncates without horizontal overflow.
8. Existing TTS and voice-clone behavior remains functional.
9. Backend/GPU/TTS diagnostics represent real response shapes correctly.
10. No source changes outside allowed source files.
11. No backend/Pipeline 2/Pipeline 3/dependency changes.

## Diff preservation requirements
- Preserve existing line endings of every edited file.
- Do not run line-ending conversion or whole-file whitespace normalization.
- Edit only the required Settings region/symbols.
- Before source commit, `git diff --stat` and `git diff --numstat` must show a plausible narrow Settings diff, not near-whole-file replacement.
- If either `index.html` or `settings.js` shows hundreds of unrelated changed lines from line endings/whitespace, STOP.

## Required verification before source commit
- `node --check src/renderer/js/components/settings.js`
- `node --check src/renderer/js/api.js` only if changed
- applicable existing renderer/settings tests if they exist; if none exist, explicitly report NONE FOUND
- `git diff --check`
- targeted static search confirming persisted model keys are `ai_model_<provider>` and no `localStorage.setItem('ai_cloud_model'...)` / `localStorage.setItem('ai_ollama_model'...)`
- inspect provider-switch code proving no cross-provider global-key fallback
- inspect changed-file list and diff stat

## Executor manual Settings verification
Anti MUST launch the app after static checks PASS and verify only the Settings page, without running video pipelines:
- Settings page opens without JS error
- switch Gemini -> DeepSeek -> Ollama -> Gemini
- save/reload provider-specific model/key for cloud providers and model/endpoint for Ollama using non-secret dummy values only
- confirm provider A value does not appear under provider B
- click diagnostics refresh and confirm backend/GPU/TTS chips settle to contained states
- verify CPU-only response is not shown as connection failure if applicable
- exercise output directory picker enough to confirm UI binding remains functional; do not change/delete user files
- verify long output path presentation does not horizontally overflow
- verify voice controls render and saved voice list remains intact; do not perform destructive voice deletion unless using a disposable test entry

If app launch/manual verification cannot be performed, report WAITING_EVIDENCE and DO NOT PUSH implementation.

## Execution safety
Forbidden:
- `git reset --hard`
- `git clean`
- destructive restore/checkout
- force push/rebase/amend/history rewrite
- `git add .`
- `git add -A`
- `git commit --no-verify`
- any hook bypass (`HUSKY=0`, etc.)
- broad Python/PowerShell/sed/perl whole-file rewrite scripts
- broad docs rewrite scripts
- line-ending normalization

First failed required command, commit hook, or gate => STOP. Do not self-repair by bypassing the failure.

## Staging / commits
Source commit:
- stage exact changed source files by explicit path only
- run `git diff --cached --name-only`
- run `git diff --cached`
- commit normally with hooks enabled

Documentation commit:
- only after source/manual verification succeeds
- update `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`
- make minimal targeted edits preserving historical context; do not replace whole documents with shortened summaries
- stage these three files by explicit path only
- inspect cached diff before commit
- commit normally with hooks enabled

If a normal commit fails: STOP and report the hook/error. Do not retry with bypass flags.

## Pre-push hard gate
Diff against source basis must contain only:
- PM task specs already present on branch
- approved source files actually changed
- three approved dynamic `.ai` docs if updated

Must also satisfy:
- no scratch/patch/backup/test-media
- forbidden source files = NONE
- no secret material
- required static checks PASS
- executor manual Settings verification PASS
- no broad formatting/line-ending churn
- source and docs commits separated

Any failure => `STOP — PUSH NOT AUTHORIZED`.

## Draft PR delivery
- Head: `review/RECOVERY-007E-SETTINGS-V1-001-REV2`
- Base: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Draft only
- Owner test: `NOT STARTED — WAITING FOR PM CODE REVIEW`
- Merge: BLOCKED

## Final executor report
Return only:

STATUS: IMPLEMENTATION_COMPLETE / WAITING_EVIDENCE / BLOCKED / IMPLEMENTATION_FAILED
Repository:
Branch:
Execution-spec remote HEAD:
Source-basis SHA:
Source commit SHA:
Docs commit SHA:
HEAD SHA:
Draft PR URL:
Draft PR base:
Changed source files:
Changed knowledge files:
Diff stat:
Verification commands/results:
Existing renderer/settings tests: PASS / NONE FOUND / NOT APPLICABLE
Executor manual Settings verification:
Known gaps:
Owner test: NOT STARTED
Merge: BLOCKED
NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
