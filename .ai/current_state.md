# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER CORE RUNTIME PASS / TRANSCRIPT REMEDIATION UI FIX PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE; never use for Owner testing.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified Owner runtime evidence
PASS:
- Voice Render mounts/navigation.
- Shared voice list and preview work for voices with valid data.
- `Render toàn bộ` works end-to-end.
- Long text sequential chunk render + final WAV merge works.
- Global status/log UI is visible.

Runtime FAIL still under closure:
- completed clone speech had been observed losing roughly the first 3–5 supplied target words.
- clone reference-transcript guard correctly blocks Adam because its saved legacy record has no exact transcript.
- Owner then verified a UI defect: neither Voice Render nor Settings exposed the promised transcript remediation action.

## Corrected implementation state
Reference transcript remains part of the clone contract:
- `api/tts_engine.py` supplies explicit clone reference transcript to OmniVoice as `ref_text` and strips control metadata before target synthesis.
- generic legacy `note` is not silently trusted as exact transcript.
- clone preview/render fails closed if exact transcript is missing.

UI remediation source commit:
- `07e5cd5b68953752817761c479657c13ef76033a`
- `src/renderer/js/voice-render-reference-fix.js` now persistently observes dynamic voice-list rerenders.
- every clone lacking transcript gets a full-width `＋ Bổ sung transcript audio mẫu` action in Voice Render.
- the same saved clone gets `＋ Transcript` in Settings.
- both actions write the same `referenceTranscript/transcript` fields in `localStorage.tts_voices`.
- transcript actions are recreated if Voice Render/Settings rerender their lists.

## Distinct voice-profile behavior retained
- every Voice Render voice has prosody/intonation + speedFactor metadata;
- selected speed changes real preview/chunk audio before merge;
- duration estimator remains isolated by voice/language;
- shared clone store remains `localStorage.tts_voices`.

## Gates
- Execution: PASS — transcript remediation UI correction published.
- Automated/static verification: WAITING on final exact HEAD.
- Code review: WAITING on final exact HEAD.
- Owner runtime: PARTIAL PASS — remediation UI + clone leading-word retention RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task_current/handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.

## Next permitted action
After docs sync, Owner fetches the final exact PR #50 HEAD. Verify Adam shows `＋ Bổ sung transcript audio mẫu` in Voice Render and `＋ Transcript` in Settings. Enter the exact words spoken in Adam's reference audio, then preview/render a short target repeatedly and confirm no first words are lost. Do not merge before runtime + static + review gates pass.
