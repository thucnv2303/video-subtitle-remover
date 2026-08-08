# RECOVERY-007E-SETTINGS-V1-001-REV1

## Objective
Rebuild the Settings tab on the accepted Owner runtime baseline with a clear task-oriented hierarchy and provider-safe persistence, while preserving working TTS/voice-clone behavior and not touching Pipeline 2/3.

## Source authority
Canonical product baseline branch:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Exact source basis SHA:
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

Review branch:
`review/RECOVERY-007E-SETTINGS-V1-001-REV1`

Invalidated implementation that MUST NOT be reused:
- PR #32
- commit `bd6730840cb609b4e0c3d47d78aee7ceee0637cd`

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

## Required UI structure
One scrollable Settings page with clear hierarchy:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

Use existing design tokens/styles where possible. Avoid decorative card spam. Maintain narrow-screen usability without horizontal overflow.

### General
- Existing output directory picker only.
- Current directory visible and truncation-safe.
- No unsupported autosave/open-folder behavior.

### AI Provider
Providers remain Gemini / DeepSeek / Ollama.

Provider-specific persistence is mandatory:
- Selected provider: `ai_provider`.
- Gemini/DeepSeek API keys: keep current `ai_api_keys_<provider>` array contract and legacy `ai_api_key` compatibility only as needed by current baseline.
- Model MUST persist using the contract already consumed by Pipeline 1: `ai_model_<provider>`.
  - Gemini model => `ai_model_gemini`
  - DeepSeek model => `ai_model_deepseek`
  - Ollama model => `ai_model_ollama`
- Ollama endpoint remains `ai_endpoint`.
- Ollama must never require/store an API key as its model.
- Do NOT invent `ai_cloud_model` or `ai_ollama_model` as runtime-only contracts unless they are purely transient DOM IDs; persisted model authority is `ai_model_<provider>`.
- Switching provider must load that provider's saved key/model without deleting or overwriting other providers' values.

Do not add fake provider testing or fake model discovery. If no real existing discovery endpoint exists on the source basis, omit discovery and report the gap.

### Pipeline 1 Defaults
Preserve active contracts for:
- `ai_prompt`
- TTS voice
- TTS language
- background volume
- remove-original-vocal toggle if currently wired

### Voice Cloning
Preserve all currently working behavior and IDs/functions:
- reference audio picker
- clone name/action
- saved voice list/delete
- test TTS playback

Do not change backend TTS contracts in this task.

### System / Diagnostics
Use only real existing capabilities:
- `window.api.health()` -> `/api/health`
- `window.api.gpuInfo()` -> `/api/gpu-info`
- `window.api.getTTSStatus()` -> `/api/tts/status`

Required UI states: checking / success / error.

GPU diagnostics must interpret the actual source-basis payload:
- `gpu_available`
- `gpu_name`
- `cuda_version`
Do not require `status`, `available`, `healthy`, or `device_name` for GPU success.
CPU-only is a valid diagnostic result, not a connection failure.

Diagnostics failures must stay contained to status chips and must not break Settings initialization.

## Functional acceptance criteria
1. Settings opens without JS error.
2. Required five-section hierarchy is visible and readable.
3. Provider switching shows the correct cloud/Ollama fields.
4. Gemini and DeepSeek API key/model fields are separate.
5. Ollama endpoint/model are separate and no API-key field is required for Ollama.
6. Save/reload restores provider-specific values using `ai_model_<provider>` and existing provider key contract.
7. Switching provider does not overwrite another provider's saved key/model.
8. Pipeline 1 can read the saved selected model without changes to `pipeline1-ai.js`.
9. Output directory picker still works.
10. Existing TTS status, voice clone, saved voices/delete, and TTS test remain functional.
11. Backend/GPU/TTS diagnostics correctly represent real source-basis response shapes.
12. No source changes outside allowed source files.
13. No Pipeline 2/3/backend/dependency changes.
14. Narrow screen has no horizontal overflow.

## Required verification
Run only after implementation:
- `node --check src/renderer/js/components/settings.js`
- `node --check src/renderer/js/api.js` only if changed
- applicable existing renderer DOM/settings tests, if present
- `git diff --check`
- targeted static search proving persisted model keys are exactly `ai_model_<provider>` and that no new `ai_cloud_model` / `ai_ollama_model` persistence remains
- Electron Settings manual verification after static checks PASS: page load, provider switch, save/reload for all 3 providers, diagnostics, output picker, voice controls

If a test is unavailable, report it. Do not invent pass evidence.

## Execution safety
Work from a clean isolated worktree/ref rooted at the exact review branch.

Forbidden commands/actions:
- `git reset --hard`
- `git clean`
- destructive restore/checkout
- force push/history rewrite
- `git add .`
- `git add -A`
- broad shell scripts that rewrite whole source/docs files
- staging unrelated files
- reusing PR #32 commits/files as recovery source

Stage exact approved files only. Inspect `git diff --cached --name-only` and `git diff --cached` before every commit.

## Commit structure
- Source commit: only allowed source files actually changed.
- Documentation commit: only affected canonical `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` after implementation/test evidence exists.
- The PM-authored task-spec commits already on the branch are not executor implementation commits.

## Pre-push hard gate
Before push, verify:
- diff against source basis `14807ee8f716a131a0565c0c77e5cb8f8e8cca29` contains only:
  - PM task-spec files already present,
  - approved source files,
  - the three approved dynamic `.ai` files if updated.
- no scratch/patch/backup/test-media files.
- forbidden source files changed = NONE.
- no secret material.
- required static checks PASS.
- no broad formatting/line-ending churn.

If any condition fails:
`STOP — PUSH NOT AUTHORIZED`

## Draft PR delivery
- Head: `review/RECOVERY-007E-SETTINGS-V1-001-REV1`
- Base MUST be `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Draft PR only.
- Owner test: `NOT STARTED — WAITING FOR PM CODE REVIEW`.
- Merge: BLOCKED.

## Final executor report
Return only:

STATUS: IMPLEMENTATION_COMPLETE / WAITING_EVIDENCE / BLOCKED / IMPLEMENTATION_FAILED
Repository:
Branch:
Execution-spec remote HEAD:
Source-basis SHA:
HEAD SHA:
Draft PR URL:
Draft PR base:
Changed source files:
Changed knowledge files:
Verification commands/results:
Manual Settings verification:
Known gaps:
Owner test: NOT STARTED
Merge: BLOCKED
NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
