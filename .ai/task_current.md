# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_CORE_RUNTIME_PASS_TRANSCRIPT_REMEDIATION_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render mounts/navigation.
- preview/render core works for valid voice data.
- `Render toàn bộ` + sequential chunks + final WAV merge work.

Confirmed runtime FAIL:
- Adam is correctly blocked because exact reference transcript is missing.
- promised transcript remediation action was not visible in Voice Render or Settings.

## Published UI correction
Source commit `07e5cd5b68953752817761c479657c13ef76033a` updates `src/renderer/js/voice-render-reference-fix.js` so:
- Voice Render dynamically observes voice rows and always adds `＋ Bổ sung transcript audio mẫu` for clones missing transcript;
- Settings saved-voice rows also receive `＋ Transcript`;
- both actions update the shared `localStorage.tts_voices` record;
- list rerenders recreate the actions;
- clone preview/render remains fail-closed until transcript exists.

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
2. Verify Adam shows `＋ Bổ sung transcript audio mẫu` in Voice Render.
3. Verify Settings shows `＋ Transcript` for Adam.
4. Enter the exact words spoken in Adam's reference audio once; the missing-transcript marker/action must disappear after refresh/rerender.
5. Preview/render a short target at least 3 times and verify the finished audio contains all first words.
6. Reconfirm a normal medium render/merge and speed-profile behavior.

## Gates
- Execution: PASS — UI remediation source published.
- Automated/static: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; remediation UI + leading-word retention RETEST WAITING.
- Documentation synchronization: IN PROGRESS until handoff and PR metadata match final head.
- Merge permission: BLOCKED.
