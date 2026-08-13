# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
CLONE_REF_TEXT_REGRESSION_ROLLED_BACK_OWNER_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- PM direct-edit only.

## Verified Owner observations
Previously PASS:
- Voice Render UI/navigation.
- preview/render/long-text queue/final WAV merge.
- shared voice list/global status/log UI.
- per-voice speed/prosody behavior.

Latest FAIL:
- clone output after reference-transcript conditioning can speak incorrect content and sound unlike the previously working clone voice.
- Owner supplied a generated WAV demonstrating the regression.

## Decision
Rollback the reference-transcript experiment. Do not require transcript for existing clones and do not inject `ref_text` unless a future design can guarantee exact audio/text pairing.

## Published rollback
- `api/tts_engine.py`: restored reference-audio-only OmniVoice clone path.
- `src/main/preload.js`: removed transcript-wrapper injection.
- `src/renderer/js/voice-render-reference-fix.js`: deleted.
- Existing Voice Render queue/merge/profile features retained.

## Remaining issue
Intermittent omission of roughly the first 3–5 target words remains unresolved and must be investigated separately after clone quality/content restoration is confirmed.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Launch final exact PR #50 HEAD.
2. Adam must no longer require transcript.
3. Preview/render a short known sentence with Adam.
4. Verify requested content is spoken correctly and Adam sounds like the previously accepted clone behavior.
5. If restoration PASS, retest the leading 3–5-word omission separately.

## Gates
- Execution: PASS rollback published.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.