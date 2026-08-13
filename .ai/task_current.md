# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_CORE_RUNTIME_PASS_ADAPTIVE_DURATION_ESTIMATOR_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render tab/page mounts.
- Voice preview works.
- `Render toàn bộ` works.
- 3/3 chunks complete sequentially.
- final WAV merge succeeds and output plays.

FAIL / revision required:
- 1,178-word Adam run estimated `~ 8.1 phút`, actual merged WAV `~ 5:03`.

## Root cause
The base estimator in `voice-render.js` uses a fixed `145 WPM` for every voice. It has no per-voice calibration. The observed Adam run is roughly 233 WPM, so the global 145 WPM assumption is not acceptable for a voice-aware UI.

## Adaptive estimator correction
`voice-render-owner-fixes.js` now:
- persists a rate profile per `voice id + language`;
- learns from preview WAV metadata;
- learns more strongly from actual full merged output duration/text;
- uses learned WPM for whitespace-delimited languages and learned character rate fallback when appropriate;
- starts with language-specific fallback only when no measured rate exists;
- updates the visible duration estimate after voice selection, preview calibration, text/language changes, and completed full render.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Fully close all VSR/Electron instances.
2. Launch exact final PR #50 HEAD.
3. Select Adam.
4. Observe initial estimate; if no Adam rate profile exists it may show the language fallback.
5. Click `Nghe thử` for Adam and wait for preview metadata to load; estimate should recalibrate.
6. Render the same or equivalent long text once; after final WAV metadata loads the Adam profile should update from the full actual output.
7. With the same text still present, estimate must move materially toward actual duration and no longer use the old fixed 145 WPM assumption.
8. Switching to another uncalibrated voice may produce a different fallback/learned estimate; profiles must not leak across voices.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING on estimator correction exact head.
- Owner runtime: PARTIAL PASS; estimator RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
