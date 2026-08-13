# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Name
Voice Render Shared Library + Long Text

## Status
BOOTSTRAP_CORRECTION_PUBLISHED_STATIC_AND_OWNER_RETEST_WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Superseded PR #49: CLOSED; never use as Owner-test target.
- Exact spec: `.ai/task_specs/VOICE-RENDER-SHARED-LIBRARY-009.md`.
- Latest application-source commit: `4e7b17a773f7602fa9cfce697cdffcca2b72e7d3`.
- Execution: Project Manager direct GitHub edits; no Anti/external executor.

## Owner runtime finding
Previous Owner launch showed neither the Voice Render nav item nor the persistent global status card. The previous preload-only dynamic bootstrap therefore failed real-app verification.

## Corrective implementation
1. `src/main/main.js` now invokes an idempotent Voice Render bootstrap after BrowserWindow `did-finish-load`.
2. The bootstrap injects `js/voice-render.js` from the actual renderer window and logs load/bootstrap failure.
3. Existing preload injection remains only as fallback.
4. All previously implemented behavior remains in the same active branch: app-native UI, global sidebar status, shared voice library, independent preview/selection, clone voice sync, sequential long-text chunks, stop-after-current, constrained FFmpeg merge, Log card.

## Active application source scope
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/js/voice-render.js`
- `src/renderer/styles/voice-render.css`

No P1/P2/P3 implementation, shared video Job/gate, backend TTS engine, dependency/package change.

## Required exact-head static verification
From `E:\Project AI\Video-sub-remove-owner-test-P1` after fetching the final exact PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest order
1. Fully close every running VSR/Electron instance.
2. Launch exact PR #50 HEAD.
3. First verify sidebar contains `Trang chủ`, `Voice Render`, `Cài đặt` and global App/Backend/TTS/GPU/CPU/RAM status is visible.
4. Switch Home -> Voice Render -> Settings -> Home; global status stays visible and exactly one page is active.
5. Only after this UI bootstrap gate passes, continue voice preview/selection, clone sync, short render, long-text chunk render, Stop and merged WAV tests.

## Gates
- Execution: PASS corrective source published.
- Automated/static verification: WAITING.
- Code review: WAITING on bootstrap correction exact head.
- Owner visual/runtime verification: previous head FAIL; corrected-head RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
