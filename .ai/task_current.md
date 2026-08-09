# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Fresh Clean Retry After INCIDENT-REV6-004

## Status
WAITING_OWNER_TEST

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Review state
- Draft PR: #38
- Current reviewed HEAD: `9db8aa9859b472365be42bf0a72a7b95f29bbe34`
- Product source diff: `src/renderer/js/components/settings.js` only.
- Current Settings blob: `805e58278e75b00ee10b1c47cdc2afff774e567e`.
- JavaScript syntax: PASS.
- Targeted Settings assertions: PASS.
- PM GitHub code review: PASS; PR #38 comment `5230629750`.
- Owner manual app verification: NOT STARTED — AUTHORIZED.
- Documentation synchronization: PASS for owner-test handoff after current_state/handoff are synchronized.
- Merge permission: BLOCKED until owner PASS is recorded and explicit merge approval is given.

## Owner test focus
- Exactly five Settings cards.
- Gemini/DeepSeek/Ollama field visibility.
- Provider-specific API-key/model persistence and blank model clearing.
- Output-directory control.
- Diagnostics including CPU-only state.
- Existing voice-clone/TTS behavior.
