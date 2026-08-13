# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — PERIOD-ONLY CHUNK BOUNDARY CORRECTION PUBLISHED / OWNER RETEST WAITING

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
- Owner supplied a 303.92s / 24 kHz mono WAV and the exact Vietnamese script used for that render.
- WAV peak is about 0.92, so the prior full-scale clipping defect is no longer the dominant current issue.
- replay of the earlier 450-char splitter on the exact script produced 12 chunks with 11/12 boundaries inside sentences.
- Owner clarified the required invariant: chunk boundaries must occur at sentence-ending period `.`; comma, semicolon, colon, dash and whitespace must never authorize a chunk cut.

## Period-only chunk correction
Latest application-source correction: `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- `src/renderer/js/voice-render.js` now identifies sentence units only from terminating `.` boundaries.
- 300/450/600 remain soft target sizes used only to decide how many complete period-terminated sentences fit in a chunk.
- if a sentence passes the target before reaching `.`, the chunk is allowed to exceed the target until that sentence ends.
- no fallback cut at comma/semicolon/colon/dash/whitespace remains.
- paragraph preservation can end a chunk only after a period-terminated sentence.
- an unterminated final tail is kept intact as the final chunk rather than being split mid-sentence.

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
- Execution: PASS — period-only splitter source published and unrelated queue-markup drift removed during self-review.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact HEAD and static evidence.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task/handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.

## Next permitted action
After docs sync, Owner fetches final exact PR #50 HEAD and rerenders the same supplied script with Adam at 450-char target. Confirm every outer transition occurs after a period-ended sentence, no locally distorted/crackling syllables recur, leading words are retained, and final merge/playback succeeds.
