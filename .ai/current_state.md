# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — AUDIO QUALITY CORRECTION PUBLISHED / OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified Owner runtime evidence
Previously PASS:
- Voice Render mount/navigation, shared voice list, preview, sequential long-text render, final WAV merge/playback, status/log UI.

Latest FAIL evidence:
- Owner supplied a completed clone WAV with locally distorted/incorrect-sounding sections.
- waveform inspection showed near-full-scale/clipping clusters inside the body of audio, not only at outer chunk joins.
- prior transcript/ref_text experiment was already rolled back.

## Quality correction published
- `api/tts_engine.py` now accepts Voice Render native speed control and passes it to `OmniVoice.generate(speed=...)` before waveform generation.
- generated OmniVoice audio is peak-limited to 0.92 before PCM16 write; timing/content are not time-stretched afterward.
- `src/renderer/js/voice-render-quality-fix.js` added.
- legacy clones that only received synthetic migration speed are neutralized to `1.00x`; new user-created clone speed remains explicit.
- Voice Render chunk options are reduced to 300 / 450 / 600 chars, default 450, while preserving sentence/paragraph-aware splitting from the existing splitter.
- post-render FFmpeg tempo is bypassed in the renderer path; preload keeps only a no-op compatibility shim so older owner-fix diagnostics do not block rendering.
- transcript/ref_text conditioning remains removed.

## Remaining defects / evidence gaps
- earlier intermittent omission of roughly the first 3–5 target words is not yet proven fixed; smaller chunks reduce the long-form risk but Owner runtime evidence is required.
- built-in Edge voices still use their existing backend path; this correction specifically targets OmniVoice/default/clone quality.

## Gates
- Execution: PASS — quality correction source published.
- Automated/static verification: WAITING on final exact HEAD command output.
- Code review: WAITING on final exact HEAD.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task/handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.

## Next permitted action
After docs sync, Owner fetches final exact PR #50 HEAD and retests Adam with the same/known text. Verify content/timbre, absence of distorted sections, chunk completion/merge, and whether any leading words are still omitted. Do not merge before runtime + static + review gates pass.
