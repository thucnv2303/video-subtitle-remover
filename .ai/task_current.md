# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_CORE_RUNTIME_PASS_TRANSCRIPT_EDITOR_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render mounts/navigation.
- preview/render core and long-text merge work for valid voice data.

Latest UX FAIL:
- previous transcript controls were poorly placed in both Voice Render and Settings;
- previous remediation was not usable enough for runtime testing.

## Published correction
- transcript editing is centralized in Voice Render only;
- clone rows missing transcript replace their normal `Nghe thử` action with `Transcript`;
- no extra full-width yellow row is added;
- Settings receives no transcript button;
- `Transcript` opens an app-native modal with reference-audio playback, exact transcript textarea, Save and Cancel;
- saved transcript updates shared `localStorage.tts_voices` fields `referenceTranscript/transcript`;
- after save the row returns to normal preview behavior;
- clone generation remains fail-closed until exact transcript exists.

Reference-transcript conditioning in `api/tts_engine.py` remains active and sends exact `ref_text` to OmniVoice while preserving target text.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-reference-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Launch final exact PR #50 HEAD.
2. Settings must no longer show a transcript button beside Adam.
3. Voice Render must show `Thiếu transcript mẫu`; the right-side action for Adam must read `Transcript`.
4. Click it; modal must open and play Adam reference audio.
5. Enter exact spoken reference transcript and save; row must return to `Nghe thử`.
6. Preview/render a short target at least 3 times and verify every finished audio contains all first words.

## Gates
- Execution: PASS — UX correction published.
- Automated/static: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; transcript-editor UX + leading-word retention RETEST WAITING.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.
