# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — SINGLE ACTIVE REVIEW PATH / BOOTSTRAP CORRECTION PUBLISHED / EXACT STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render review branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Superseded PR #49 is CLOSED/OBSOLETE and must not be used for Owner testing.
- Exact spec: `.ai/task_specs/VOICE-RENDER-SHARED-LIBRARY-009.md`.
- Latest application-source commit after Owner runtime failure: `4e7b17a773f7602fa9cfce697cdffcca2b72e7d3`.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Owner runtime evidence
Owner launched the app and observed that Voice Render and the new global status card did not appear. This is a real runtime FAIL for the previous dynamic bootstrap path.

## Corrective change
- `src/main/main.js` now performs a deterministic Voice Render bootstrap after `did-finish-load` using the already-loaded BrowserWindow.
- The bootstrap is idempotent: if `#nav-voice-render` already exists it does nothing.
- If prior dynamic script tags exist without mounting, they are removed before adding one fresh `js/voice-render.js` script tag.
- Load/bootstrap failures are logged to the existing Electron console path.
- Previous preload bootstrap remains harmless fallback; main-window bootstrap is now the runtime authority for mounting the feature.

## Published Voice Render behavior
- Current app navy/blue visual language.
- Global App/Backend/TTS/GPU/CPU/RAM information in the left sidebar across tabs.
- Voice Render lower-right bounded Log card with filter/copy/clear.
- Scrollable shared voice list with independent preview and explicit selection.
- Clone voices saved into existing `localStorage.tts_voices` and synchronized with known Settings/Pipeline selectors.
- Long text deterministic bounded chunks, sequential TTS requests and final WAV merge.
- Stop means stop-after-current synchronous request.
- Failed/stopped/incomplete runs cannot claim final merged output.

## Isolation / source scope
Application source in active PR #50 now includes:
- `src/main/main.js` — deterministic runtime bootstrap only;
- `src/main/preload.js` — system info + constrained WAV merge + fallback script bootstrap;
- `src/renderer/js/voice-render.js` — Voice Render UI/state/queue/shared voices;
- `src/renderer/styles/voice-render.css` — app-native UI styling.

No P1/P2/P3 reasoning/inpaint/finalize implementation, shared video Job/gate, backend TTS engine, dependency or package source change.

## Verification facts
- PR #50 is Draft/open and now bases directly on the P1 review branch, eliminating the obsolete demo PR as an intermediate base.
- PR #49 is closed and explicitly marked superseded by PR #50.
- Previous PM logic/scope review was invalidated for runtime readiness by Owner observation; new `main.js` correction requires exact-head static review/retest.
- No release PASS is claimed.

## Gates
- Execution: PASS — corrective source published.
- Automated/static verification: WAITING on new exact HEAD.
- Code review: WAITING for exact-head correction review/static evidence.
- Owner visual/runtime verification: FAIL on previous head; RETEST WAITING on corrected head.
- Documentation synchronization: PASS after this single-path state update.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches the exact current PR #50 HEAD into `E:\Project AI\Video-sub-remove-owner-test-P1`, verifies static syntax/diff, fully closes any running VSR instance, starts the app, and first verifies that `Voice Render` plus the global sidebar status now mount. Do not test long-text rendering until the tab itself is confirmed visible. Do not merge.
