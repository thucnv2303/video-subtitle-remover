# RECOVERY-007E-SETTINGS-V1-001-REV6

Status: READY_FOR_EXECUTION

## Goal
Implement Settings V1 from the trusted canonical source state after INCIDENT-REV5-003. This is a fresh implementation. Do not reuse any REV2/REV3/REV4/REV5 implementation, scratch source, patch, stash, or candidate artifact.

## Trusted basis
- Canonical source code: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Trusted project-state ancestor: `b772a7ad132fd0c3e591a632843a7b56a45eba8e`
- Review branch: `review/RECOVERY-007E-SETTINGS-V1-001-REV6`

GitHub verification established that `src/renderer/index.html` and `src/renderer/js/components/settings.js` at the trusted project-state ancestor have the same blob SHAs as the canonical source basis.

## Allowed source scope
Only:
- `src/renderer/index.html`
- `src/renderer/styles/main.css` only if narrowly required for Settings layout
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js` only if an existing renderer API wrapper must be used; no new transport architecture

## Required Settings product sections
Exactly five top-level `.settings-card` product sections inside the Settings page:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

Do not merely rename headings inside a shared card.

## Required unique IDs
Exactly once each:
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

## Provider behavior
Gemini and DeepSeek:
- API key visible
- model visible
- endpoint hidden

Ollama:
- API key hidden
- model visible
- endpoint visible

Provider-specific authority:
- API keys: `ai_api_keys_<provider>`
- models: `ai_model_<provider>`
- Ollama endpoint: `ai_endpoint`

Do not introduce `ai_endpoint_deepseek`.
Do not use a global `ai_model` as normal model authority.
Do not normally write legacy global `ai_api_key`.

Saving a blank model MUST store blank for the current provider so clearing persists.
Saving provider A MUST NOT mutate provider B.

## Legacy migration
Legacy `ai_api_key` may migrate only during initial load for the persisted cloud provider (Gemini or DeepSeek), and only when that provider's own key list is missing/empty. Ordinary provider switching must never migrate or resurrect legacy data.

## Pipeline 1 persistence
Do not create or use:
- `p1_default_ai_model`
- `p1_default_tts_voice`

Preserve existing TTS, voice-clone, and P1/P2/P3 boundaries.

## Diagnostics
Use only:
- `window.api.health()`
- `window.api.gpuInfo()`
- `window.api.getTTSStatus()`

No direct `fetch` for Settings diagnostics.
CPU-only (`cuda_available === false`) is a valid non-error state.

## Execution controls
Use a NEW isolated clean worktree from the CURRENT remote REV6 HEAD.

Forbidden:
- reuse/copy/cherry-pick/apply of invalidated implementation source
- reading previous scratch candidate source as implementation input
- Python/Node/PowerShell/sed/perl source rewrite or string-replacement scripts
- generated patch-helper scripts
- `git checkout <path>`
- `git restore`
- `git reset`
- `git clean`
- rebase/amend/force push/history rewrite
- `git add .`
- `git add -A`
- `--no-verify`
- shell fallbacks that mask failures
- line-ending normalization/conversion

Editing must be targeted. If the editor produces broad full-file/EOL churn, STOP before further edits.

## Required verification before commit
1. `node --check src/renderer/js/components/settings.js`
2. Inspect `package.json` and test locations read-only. Canonical package has no test script; if no applicable Settings tests exist, record `Applicable Settings tests: NONE FOUND` without running a nonexistent command.
3. `git diff --check` -> exit 0, no output
4. `git diff --stat`
5. `git diff --numstat`
6. inspect full diff
7. verify exactly five top-level Settings cards
8. verify every required hard-gate ID exactly once
9. verify provider visibility logic for Gemini, DeepSeek, Ollama
10. verify provider-specific key/model storage and blank model clearing
11. verify legacy migration conditions and no resurrection on switching
12. verify no normal global legacy key write and no global model authority
13. verify forbidden/dead keys absent
14. verify diagnostics use approved `window.api` methods only and no direct fetch
15. verify CPU-only neutral/non-error handling
16. verify TTS/voice-clone and pipeline boundaries are preserved

If ANY required verification prints a warning/error, exits nonzero, or reveals a failed acceptance condition: STOP immediately. Leave the task worktree untouched. Do not self-repair after the failed gate in the same execution. Do not commit or push.

## Publication
Only after all source gates PASS:
- stage exact approved source paths only
- inspect `git diff --cached --name-only` and full cached diff
- create one source commit with normal hooks
- minimally update exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`
- create a separate docs commit
- fetch origin again; if remote REV6 moved from startup authority, STOP
- fast-forward push only
- open a NEW Draft PR to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- do not mark Ready
- do not merge

Owner manual app verification: NOT STARTED until PM GitHub code-review PASS.
Merge permission: BLOCKED.
