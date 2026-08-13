# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
SENTENCE_SAFE_CHUNK_CORRECTION_PUBLISHED_OWNER_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- PM direct-edit only.

## Verified defect
Using the Owner-supplied Vietnamese script with the previous 450-character splitter reproduced 12 chunks, with 11/12 chunk boundaries inside sentences. The old `chooseSplitPoint()` gathered sentence and whitespace candidates then selected the furthest candidate, so a whitespace near the hard limit overrode the earlier sentence ending.

## Current source state
Latest application-source correction: `16ed7a2a27aea639332eaba8f0fb921cfe6f7446`.
- Voice Render chunks sentence units first.
- 300/450/600 are soft target sizes; complete sentences are packed without cutting normal sentences.
- `Intl.Segmenter` sentence segmentation is used when available, with punctuation fallback.
- emergency splitting of a single pathological run-on sentence uses clause punctuation first and whitespace only as the final fallback.
- previous native OmniVoice speed/headroom correction remains in place.
- transcript/ref_text conditioning remains removed.

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
2. Use Adam and the same supplied Vietnamese script.
3. Keep chunk target at 450.
4. Verify audible transitions happen only after complete sentences, not after partial phrases.
5. Confirm content/timbre remain correct and no obvious crackling/clipped syllables return.
6. Check whether first 3–5 target words are retained.
7. Confirm final merge/playback remains successful.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.
