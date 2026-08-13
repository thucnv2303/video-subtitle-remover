# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — PERIOD-ONLY CHUNK BOUNDARY IMPROVED / RESIDUAL STUTTER UNDER DIAGNOSIS

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

Period-only chunk retest on exact HEAD `5241007de1f541132784d6a81c093858e3f138b6`:
- Owner reports the result is substantially improved / generally stable.
- Owner still hears some residual speech stutter (`nói lắp`) in parts of the generated narration, so Owner verification is not PASS.
- supplied retest WAV is 303.42s, 24 kHz mono, PCM16, peak about 0.92.
- waveform inspection found no non-silent exact PCM segment duplication in the final WAV at the tested repeat-window resolution; repeated exact windows were silence only.

## Verified source findings
Latest application-source correction remains `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- `src/renderer/js/voice-render.js` derives outer chunk boundaries from terminating `.` only.
- 300/450/600 are soft packing targets and never authorize a mid-sentence cut.
- each successful renderer chunk is appended once to `completedChunkPaths`.
- `src/main/main.js` builds the FFmpeg concat manifest from that input list once and does not intentionally duplicate an input chunk.
- therefore current evidence does not support final concat as the cause of the residual stutter.

## Working diagnosis
- residual stutter is most likely being produced inside an OmniVoice generation request rather than by outer-text overlap or final WAV concat.
- the current clone-safe UI offers 300/450/600 with default 450.
- next diagnostic is the same script / same Adam clone / same exact source state at target 300. Period-only behavior must remain unchanged.
- if 300 materially reduces or removes stutter, PM may change the clone default from 450 to 300 in a dedicated source correction; do not change source before this runtime comparison establishes the effect.

## Prior quality correction retained
- OmniVoice clone speed is native model speed, not post-WAV time-stretch.
- generated OmniVoice PCM receives a 0.92 peak ceiling.
- legacy synthetic clone speed is neutralized to 1.00x unless explicitly user-created.
- Edge built-in voice tempo behavior remains separate.
- transcript/ref_text conditioning remains removed.

## Remaining defects / evidence gaps
- residual spoken stutter remains in the latest Owner render.
- 300-vs-450 controlled runtime comparison is not yet available.
- earlier intermittent omission of roughly the first 3-5 target words is not yet proven fixed unless Owner explicitly confirms it in this exact-head run.
- exact-head static command output and final PM code review are still WAITING.

## Gates
- Execution: PASS — current period-only splitter source is published.
- Automated/static verification: WAITING.
- Code review: WAITING for final task correction state.
- Owner runtime: FAIL — improved but residual stutter remains.
- Documentation synchronization: IN PROGRESS until task/handoff/PR metadata match final docs head.
- Merge permission: BLOCKED.

## Next permitted action
Owner rerenders the same supplied script with Adam at 300-char target on the same exact application source. Compare residual stutter against the 450-char render. Do not merge and do not broaden source changes before this comparison is available.
