# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
SENTENCE-SAFE CHUNK CORRECTION PUBLISHED / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified evidence
Previously working: Voice Render mount/navigation, shared voice list, preview, sequential long-text render, final WAV merge/playback, status/log UI.

Latest Owner result:
- supplied render WAV is 303.92s, 24 kHz mono, peak about 0.92; the prior clipping/headroom defect is not the dominant current issue.
- supplied exact Vietnamese narration script reproduces a chunk-boundary defect in the old splitter: at 450 chars it produced 12 chunks and 11/12 boundaries were inside sentences.
- root cause in `chooseSplitPoint()`: sentence and whitespace candidates were combined and the furthest candidate was selected, allowing whitespace near the target limit to override a valid earlier sentence end.

## Published correction
Application source commit: `16ed7a2a27aea639332eaba8f0fb921cfe6f7446`.
- sentence segmentation occurs before chunk packing;
- 300/450/600 are soft target sizes;
- complete normal sentences are never cut solely to hit a target size;
- `Intl.Segmenter` is preferred, punctuation fallback retained;
- only pathological run-on sentences beyond a large hard limit can fall back to clause punctuation, then whitespace;
- paragraph preservation remains available.

Prior audio-quality correction remains:
- OmniVoice clone native speed;
- no post-WAV time-stretch for clone output;
- 0.92 peak headroom;
- legacy synthetic speed neutralized;
- transcript/ref_text removed.

## Retest sequence
1. Fetch final exact PR #50 HEAD and fully restart VSR.
2. Select Adam, no transcript requirement.
3. Use the same Owner-supplied Vietnamese script and 450-char target.
4. Verify every outer chunk transition is heard only after a complete sentence.
5. Verify content/timbre and absence of obvious crackling/clipped syllables.
6. Check whether the earlier first-3–5-word omission still reproduces.
7. Reconfirm final merge/playback.

## Static verification
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-quality-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: PASS once PR metadata points at the final docs head.
- Merge permission: BLOCKED.
