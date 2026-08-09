# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Owner Runtime Correction

## Status
WAITING_OWNER_RETEST

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Review state
- Draft PR: #38
- Owner runtime test on 2026-08-09: FAIL.
- Owner screenshot evidence: `Pipeline 1 Defaults` empty; Voice Cloning controls missing; visual result did not match intended Settings design quality.
- Root cause: `aiCard.replaceChildren()` detached TTS / voice-clone controls before those nodes were captured.
- Previous PM code-review PASS is invalidated.
- PR FAIL comment: `5230662730`.
- Repair source commit: `e556fa5ae9420a858d7c5f2eddcfdec07375f619`.
- Current Settings blob: `a47ca49f6fb7fdec5b5546cc5034d71f6f896084`.
- Product source diff: `src/renderer/js/components/settings.js` only.

## Repaired behavior
- Capture all required original controls before modifying the combined legacy AI/TTS card.
- Exactly five top-level Settings cards remain: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System / Diagnostics.
- Pipeline 1 Defaults contains TTS status, voice, language, background volume, and remove-vocal control.
- Voice Cloning contains name, sample-audio chooser, clone button, saved voices, and test-voice controls.
- AI Provider preserves provider-specific key/model behavior and Ollama endpoint visibility.
- Save action is a single full-width action after the five cards.
- Diagnostics remain via approved `window.api` wrappers.

## Gates
- Execution: PASS for repair publication.
- Automated/static verification: WAITING fresh runtime confirmation; source inspection confirms the known detach-order defect is corrected.
- Code review: WAITING RUNTIME CONFIRMATION.
- Owner manual app verification: RETEST AUTHORIZED.
- Documentation synchronization: PASS for current correction state.
- Merge permission: BLOCKED.

## Owner retest focus
- No empty Settings cards.
- All Pipeline 1 Defaults controls visible.
- All Voice Cloning controls visible.
- Five-card visual hierarchy is coherent and usable.
- Gemini / DeepSeek / Ollama field visibility works.
- Provider-specific key/model persistence and blank clearing work.
- Output directory, diagnostics, voice clone and TTS still work.
