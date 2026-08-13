# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER PARTIAL PASS / RUNTIME CORRECTIONS PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE; never use for Owner testing.
- Exact spec: `.ai/task_specs/VOICE-RENDER-SHARED-LIBRARY-009.md`.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Latest Owner runtime evidence
Owner verified on the real app:
- Voice Render nav/page now mounts: PASS for bootstrap visibility.
- Shared voice list is visible and voice preview works: PASS for preview path.
- Voice Render Log text is too small: FAIL UX/readability.
- Global App status card does not match approved demo/product intent; CPU/RAM were unavailable and presentation was too weak: FAIL.
- `Render toàn bộ` did not start rendering: FAIL. Queue remained empty.

## Corrective source published
1. `src/main/main.js`
   - Save dialog is now parented to the actual BrowserWindow and constrained to WAV output.
   - Adds `app:systemInfo` IPC with real CPU usage snapshot, RAM usage, app and Electron version.
   - Deterministic Voice Render bootstrap now also loads owner-runtime correction CSS/JS.
2. `src/main/preload.js`
   - `getSystemInfo()` now uses `ipcRenderer.invoke('app:systemInfo')` rather than direct preload-local sampling.
   - Existing constrained WAV merge bridge remains unchanged in responsibility.
3. `src/renderer/styles/voice-render-owner-fixes.css`
   - Enlarges Voice Render log text and spacing.
   - Restyles persistent App status as compact metric cards closer to the approved demo.
4. `src/renderer/js/voice-render-owner-fixes.js`
   - Refreshes real Backend/TTS/GPU/CPU/RAM metrics.
   - Shows CPU/RAM percentages and GPU VRAM where available.
   - Adds explicit console/toast diagnostic if render save/merge bridge is missing.

## Product behavior preserved
- Shared common voice library; per-voice preview does not silently change selection.
- Clone voice uses existing `localStorage.tts_voices` store.
- Long text uses deterministic bounded sequential chunks.
- Stop remains stop-after-current synchronous TTS request.
- Final success still requires all intended chunks and constrained FFmpeg merge.
- No video Job/P1/P2/P3 gate/artifact mutation.

## Active application source
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/js/voice-render.js`
- `src/renderer/styles/voice-render.css`
- `src/renderer/js/voice-render-owner-fixes.js`
- `src/renderer/styles/voice-render-owner-fixes.css`

## Gates
- Execution: PASS — runtime corrections published.
- Automated/static verification: WAITING on final exact HEAD.
- Code review: WAITING on final correction re-review/static evidence.
- Owner visual/runtime verification: PARTIAL — mount + preview PASS; log/status/render FAIL on previous head; RETEST WAITING.
- Documentation synchronization: PASS after dynamic files sync.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches final exact PR #50 HEAD, runs syntax/diff checks, fully restarts the app, then retests only: log readability, App status metrics/layout, and `Render toàn bộ`. If render opens a WAV save dialog and queue starts, continue through final merged WAV. Do not merge.
