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
- waveform inspection showed near-full-scale/clipping clusters inside rendered speech, not only at outer chunk joins.
- prior transcript/ref_text experiment was already rolled back.

## Quality correction published
Latest application-source correction reaches commit `422595386ae26e081bc1eb0a8068c261491a2ce5`.
- `api/tts_engine.py` applies clone speed natively through `OmniVoice.generate(speed=...)` before waveform generation.
- OmniVoice output is scaled to a 0.92 peak ceiling before PCM16 write without altering timing/content.
- `src/renderer/js/voice-render-quality-fix.js` limits outer chunks to 300 / 450 / 600 chars, default 450, while retaining the existing sentence/paragraph-aware splitter.
- legacy clones that only received synthetic migration speed are neutralized to 1.00x; newly created clone speed remains user-explicit.
- for OmniVoice clone requests, post-WAV FFmpeg `atempo` is bypassed so native model speed is the only speed transform.
- built-in Edge voices retain their existing tempo path to avoid unrelated behavior regression.
- transcript/ref_text conditioning remains removed.

## Remaining defects / evidence gaps
- earlier intermittent omission of roughly the first 3–5 target words is not yet proven fixed; smaller outer chunks reduce long-form risk but Owner runtime evidence is required.
- audio-quality correction has not yet received exact-head static command output or Owner listening PASS.

## Gates
- Execution: PASS — source correction published.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact HEAD.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task/handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.

## Next permitted action
After docs sync, Owner fetches final exact PR #50 HEAD and retests Adam with known medium text. Verify correct content/timbre, absence of distorted sections, chunk completion/merge, and whether any leading words are still omitted. Do not merge before runtime + static + review gates pass.
