# RECOVERY-007E-SETTINGS-V1-001

## Objective
Rebuild the Settings tab so the primary configuration flow is clear, grouped by user task, and uses only real supported capabilities from the current runtime baseline.

## Product intent
The Owner already approved the Settings V1 direction. This task must improve the existing Settings UX without inventing fake backend capabilities or expanding into unrelated pipeline logic.

## Source basis
`14807ee8f716a131a0565c0c77e5cb8f8e8cca29`

## Allowed source files
- `src/renderer/index.html`
- `src/renderer/styles/main.css`
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js` only if a small APIClient wrapper is needed for an endpoint that already exists in backend

## Forbidden source files
- `api/server.py`
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- dependencies/package files
- Electron main/preload

Do not create new backend endpoints in this task.

## Required UI structure
Use one scrollable Settings page with clear hierarchy and consistent spacing. Do not create many equal-weight decorative cards.

### 1. General
- Output directory using the existing real directory picker.
- Keep the current directory value visible and truncation-safe.
- Do NOT add "open output folder when completed" or autosave behavior unless the codebase already has a working path for it. These are not required in V1.

### 2. AI Provider
- Provider selector: Gemini / DeepSeek / Ollama, preserving current supported providers.
- Separate provider credentials/model fields. Do not use one field labeled "API Key / Model".
- Gemini/DeepSeek: API key field + model field/select if existing runtime storage already supports `ai_model_<provider>`.
- Ollama: endpoint + model field/select. Ollama must not require an API key.
- Preserve current storage contracts used by Pipeline 1; no migration that breaks current keys.
- Do not invent a fake test connection. A test/scan button is allowed only if it calls a real existing endpoint/client method. If no real model-discovery endpoint exists on the source basis, omit the button and record the gap.

### 3. Pipeline 1 defaults
- Default AI rewrite prompt if the existing `ai_prompt` contract is active.
- TTS voice selector.
- TTS language.
- Background volume.
- Remove-original-vocal toggle if it is currently wired.
- Keep these settings visually grouped as defaults used by Pipeline 1.
- Do not add retry-policy controls or unsupported language/pipeline controls.

### 4. Voice cloning
Preserve the currently working voice-clone functionality:
- reference audio picker;
- clone name;
- clone action;
- saved voices list/delete;
- test TTS playback.

Do not regress existing IDs/functions used by current code unless the corresponding JS is updated in the same task.

### 5. System / Diagnostics
- Backend status using the existing `/api/health` capability through APIClient where practical.
- GPU/CUDA status using the existing `/api/gpu-info` capability.
- TTS status using the existing `/api/tts/status` capability.
- Provide one refresh/health action only if it uses these real endpoints.
- No fake FFmpeg/Python status unless a real endpoint/data source already exists.
- No reset cache/settings destructive action in V1.

## UX requirements
- Page title and short purpose text.
- One dominant hierarchy; section headings must be scannable within 3 seconds.
- Desktop layout may use a 2-column grid for compact sections, but fields inside a task group must remain readable and aligned.
- Responsive fallback to one column for narrow widths.
- Consistent input, helper text, buttons, status chips, focus states.
- Explicit loading/checking/success/error states for diagnostics.
- Destructive voice delete must remain visually secondary/destructive.
- Avoid emojis as primary information carriers; existing labels may retain them only where not disruptive.

## Logic requirements
- `loadSettingsValues()` must render persisted values correctly for each provider.
- Saving must not overwrite unrelated provider settings.
- Provider switching must show/hide the correct fields without deleting stored values.
- Ollama config must persist model separately from endpoint and must not be stored as an API key.
- Existing TTS and voice-clone behavior must continue to work.
- Diagnostics failures must be contained to the status UI and must not break Settings initialization.
- No direct hard-coded backend fetch should be newly introduced in Settings if an APIClient method already exists.

## Security / privacy
- Do not log raw API keys.
- Do not include secrets in screenshots, test fixtures, evidence, PR body, or console output.
- Do not broaden credential-storage architecture in this task; preserve the current baseline contract unless a minimal UI compatibility fix is required.

## Acceptance criteria
1. Settings opens with no JS error.
2. General / AI Provider / Pipeline 1 Defaults / Voice Cloning / System & Diagnostics hierarchy is visible and understandable.
3. Provider switch renders provider-specific fields correctly.
4. Gemini and DeepSeek credentials are separate from model selection.
5. Ollama endpoint and model are separate; no Ollama API-key requirement.
6. Save + reload restores each provider's relevant persisted values without cross-provider overwrite.
7. Output directory picker still works.
8. TTS status, voice clone, saved voices, voice deletion, and TTS test remain functional.
9. Backend/GPU/TTS diagnostics have checking/success/error states using only existing real capabilities.
10. No changes to Pipeline 2 or Pipeline 3 source.
11. No new backend endpoint or dependency.
12. Narrow-screen Settings layout remains usable without horizontal overflow.

## Required verification
- `node --check src/renderer/js/components/settings.js`
- `node --check src/renderer/js/api.js` if changed
- run any existing renderer DOM/settings tests that cover these files
- `git diff --check`
- launch Electron only after static checks pass; verify Settings page loads and provider switching/save/reload/diagnostics/voice controls do not throw

If an existing test is not applicable, report it; do not silently replace it with an invented assertion.

## Pre-push hard gate
Before push:
- changed source files must be a subset of the allowed source files;
- forbidden source files changed = NONE;
- no package/dependency changes;
- no secret material in diff;
- required static checks PASS;
- diff must not contain broad formatting/line-ending churn;
- remote review branch HEAD must still match the execution basis before the first implementation commit.

If any gate fails:
`STOP — PUSH NOT AUTHORIZED`

## GitHub delivery
- Work only on `review/RECOVERY-007E-SETTINGS-V1-001`.
- Keep source changes focused.
- Update affected canonical `.ai` state/docs only after implementation evidence is available.
- Push the branch and open/update a Draft PR.
- Owner test status in PR: `NOT STARTED — WAITING FOR PM CODE REVIEW`.
- Merge: `BLOCKED`.

## Final executor report
Return only:

STATUS: IMPLEMENTATION_COMPLETE / WAITING_EVIDENCE / BLOCKED / IMPLEMENTATION_FAILED
Repository:
Branch:
Execution-basis SHA:
HEAD SHA:
Draft PR URL:
Changed source files:
Changed knowledge files:
Verification commands/results:
Manual Settings verification:
Known gaps:
Owner test: NOT STARTED
Merge: BLOCKED
NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
