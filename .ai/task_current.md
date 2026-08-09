# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Approved Demo Rebuild

## Status
WAITING_OWNER_RETEST

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Review state
- Draft PR: #38.
- Previous owner runtime/design result: FAIL.
- Previous stacked five-card implementation is invalidated.
- Authoritative visual acceptance: the five Owner-approved screenshots supplied on 2026-08-09.
- Required IA: one 2x2 Settings overview plus four dedicated detail views: AI & Model, TTS & Giọng đọc, Lưu trữ, Trạng thái hệ thống.
- Design-fail PR comment: `5230793631`.
- Visual-system commit: `248ec0043c35010888590c995d23dea7fd0f8a72`.
- Controller rebuild commit: `279d59f8d430856214b235d26c1cd15e9d403d4e`.
- Settings JS blob: `cbe10df807aad311e1f982ebe4cb8793435bf5ab`.
- Settings CSS blob: `5e83a866c9b4d39fd79d225238a0fa4f21b575c7`.

## Rebuilt UI acceptance
- Settings landing view uses a balanced 2x2 module grid.
- AI & Model is a dedicated view with provider selector, API key, model, Ollama endpoint, default prompt, prompt-management shortcut and connectivity actions.
- TTS & Giọng đọc is a dedicated view with TTS toggle, language, default voice, cloned-voice list/editor, preview, background volume and remove-vocal setting.
- Lưu trữ is a dedicated view with output-directory selection/current path and explicit output-file list.
- Trạng thái hệ thống is a dedicated view with Backend/GPU/TTS service rows, overall health summary and refresh action.
- Settings sidebar expands to match the approved design shell while Settings is active.
- OpenAI is displayed disabled only; runtime provider support remains Gemini / DeepSeek / Ollama.

## Verification
- JavaScript syntax: PASS.
- Static architecture/contract assertions: PASS for available checks.
- Settings diagnostics use `window.api.health()`, `window.api.gpuInfo()`, `window.api.getTTSStatus()`.
- No direct Settings `fetch()`.
- No normal global `ai_api_key` or global `ai_model` writes.
- No `p1_default_ai_model`, `p1_default_tts_voice`, or `ai_endpoint_deepseek`.
- Runtime screenshot parity: WAITING OWNER RETEST.

## Gates
- Execution: PASS for approved-design rebuild publication.
- Automated/static verification: PASS for available static checks.
- Code review: WAITING FINAL RUNTIME VISUAL EVIDENCE.
- Owner manual app verification: RETEST AUTHORIZED.
- Documentation synchronization: PASS after current_state/handoff synchronization.
- Merge permission: BLOCKED.

## Owner retest focus
Compare the running Settings UI directly with the approved screenshots: overview 2x2, all four detail views, sidebar/shell, hierarchy, spacing, content density, provider switching/persistence, output directory, diagnostics, and existing TTS/voice-clone behavior.
