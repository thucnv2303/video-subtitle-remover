# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — SENTENCE-SAFE CHUNK CORRECTION PUBLISHED / OWNER RETEST WAITING

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

Latest Owner evidence:
- Owner supplied a new 303.92s / 24 kHz mono WAV generated after the audio-quality correction and the exact Vietnamese script used for that render.
- the new WAV peaks at about 0.92, confirming the headroom correction is active and the previous near-full-scale clipping pattern is no longer the dominant failure.
- source-level replay of the exact script with the previous 450-char splitter produced 12 chunks; 11 of 12 chunk boundaries landed inside a sentence because the splitter chose the furthest candidate and a whitespace near the hard character limit outranked the earlier sentence boundary.

## Sentence-safe chunk correction
Latest application-source correction: `16ed7a2a27aea639332eaba8f0fb921cfe6f7446`.
- `src/renderer/js/voice-render.js` now segments text into complete sentence units first, using `Intl.Segmenter(..., { granularity: 'sentence' })` with a punctuation fallback.
- 300/450/600 are soft target sizes, not hard knives: complete sentences are packed until adding the next sentence would exceed the selected target.
- normal sentences are allowed to exceed the target rather than being cut.
- only pathological single run-on sentences beyond a large hard limit use emergency fallback at clause punctuation (comma/semicolon/colon/dash), then whitespace as last resort.
- paragraph preservation remains supported.

## Prior quality correction retained
- OmniVoice clone speed is native model speed, not post-WAV time-stretch.
- generated OmniVoice PCM receives a 0.92 peak ceiling.
- legacy synthetic clone speed is neutralized to 1.00x unless explicitly user-created.
- Edge built-in voice tempo behavior remains separate.
- transcript/ref_text conditioning remains removed.

## Remaining defects / evidence gaps
- Owner runtime must confirm the same script no longer audibly breaks mid-sentence at outer chunk joins.
- earlier intermittent omission of roughly the first 3–5 target words is not yet proven fixed.
- exact-head static command output and final PM code review are still WAITING.

## Gates
- Execution: PASS — sentence-safe splitter source published.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact HEAD.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task/handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.

## Next permitted action
After docs sync, Owner fetches final exact PR #50 HEAD and rerenders the same supplied script with Adam at 450-char target. Confirm every audible outer transition occurs after a completed sentence, no locally distorted/crackling syllables recur, leading words are retained, and final merge/playback succeeds.
