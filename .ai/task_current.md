# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
PERIOD_ONLY_CHUNK_BOUNDARY_CORRECTION_PUBLISHED_OWNER_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- PM direct-edit only.

## Verified defect
The previous 450-character splitter cut the Owner-supplied Vietnamese narration inside sentences. Owner clarified the exact rule: a chunk boundary may occur only after sentence-ending period `.`. Character targets must never cut at comma, semicolon, colon, dash or whitespace.

## Current source state
Latest application-source correction: `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- sentence units are recognized from terminating `.` boundaries only;
- 300/450/600 are soft target sizes for packing complete sentences;
- a sentence may exceed the target until its terminating period;
- no clause/whitespace emergency splitter remains;
- paragraph preservation only closes a chunk after a period-terminated sentence;
- an unterminated final tail remains intact as the last chunk;
- previous native OmniVoice speed/headroom correction remains in place;
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
4. Verify every audible outer transition occurs only after `.` and never after a partial phrase.
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
