# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
AUDIO_QUALITY_CORRECTION_PUBLISHED_OWNER_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- PM direct-edit only.

## Verified Owner observations
Previously PASS:
- Voice Render UI/navigation, shared voice list, preview/render, long-text queue, final WAV merge/playback, status/log UI.

Current FAIL evidence:
- completed clone audio contains some locally distorted/incorrect-sounding sections.
- supplied WAV analysis showed high peak/clipping clusters within audio sections, not only at final merge boundaries.

## Published correction
- OmniVoice speed is applied during model generation instead of FFmpeg `atempo` after generation.
- OmniVoice output gets 0.92 peak headroom before PCM16 write.
- legacy synthetic migration speeds are reset to neutral 1.00x; newly created clone speed is marked user-explicit.
- Voice Render outer chunks are restricted to 300/450/600 chars, default 450.
- old renderer tempo bridge is a no-op compatibility shim; completed WAV chunks are not time-stretched.
- transcript/ref_text experiment remains removed.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-quality-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Launch final exact PR #50 HEAD.
2. Confirm Adam no longer requires transcript.
3. Verify chunk-size options are 300 / 450 / 600 and default 450.
4. Render a known medium text with Adam and listen through the sections that previously sounded distorted.
5. Confirm requested content/timbre are normal and no obvious crackling/clipped syllables occur.
6. Recheck whether the first 3–5 target words are still omitted.
7. Verify final WAV merge/playback still completes.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match final head.
- Merge permission: BLOCKED.
