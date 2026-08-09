# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Approved UI + Ollama Model Discovery

## Status
WAITING_OWNER_RETEST

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Review state
- Draft PR: #38.
- Owner-approved Settings visual architecture is implemented and runtime screenshot is acceptable.
- Remaining owner-reported issue: Ollama model list was not discoverable from the Settings AI page.
- Ollama official list-model endpoint is `GET /api/tags`.
- Fix published through `src/main/main.js` and `src/main/preload.js` only; approved Settings layout is unchanged.

## Ollama discovery behavior
- When provider is Ollama, a `Quét model Ollama` control appears below the Model field.
- Scan uses Electron main-process IPC; renderer does not perform direct Ollama fetch.
- The saved Ollama chat endpoint is normalized to `/api/tags` for discovery.
- Only local loopback Ollama endpoints are accepted.
- Installed model names populate a selectable dropdown and the existing model datalist.
- Selecting a scanned model copies its exact name into the existing `ai-model` field.
- Manual model entry remains supported.
- Existing `ai_model_ollama` persistence and Pipeline 1 contracts remain unchanged.

## Gates
- Approved UI runtime review: PASS for visual direction based on owner screenshot.
- Ollama discovery implementation: PUBLISHED / WAITING OWNER RUNTIME RETEST.
- Code review: WAITING final Ollama runtime proof.
- Owner manual app verification: RETEST AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Owner retest focus
Select Ollama, click `Quét model Ollama`, confirm locally installed models appear, select one, save, reopen Settings, and confirm the exact model remains selected. Also confirm manual entry still works if scanning fails.
