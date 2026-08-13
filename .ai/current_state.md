# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER PARTIAL PASS / PRELOAD BRIDGE ROOT CAUSE FIXED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE; never use for Owner testing.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Latest Owner runtime evidence
PASS:
- Voice Render tab/page mounts.
- Shared voice list is visible.
- Voice preview works.

FAIL:
- Previous log/status UX issues required correction.
- `Render toàn bộ` remained blocked with exact runtime error: `[Voice Render] render bridge missing: saveFile/mergeWavFiles unavailable`.

## Root cause verified in source
The privileged WAV merge implementation had been placed inside `preload.js` and required Node modules (`fs`, `path`, `child_process`). The runtime page could mount and HTTP TTS preview could work while the exposed Electron bridge remained incomplete/unavailable. Therefore the renderer correctly reported missing `saveFile/mergeWavFiles` capability.

## Corrective source
- `src/main/main.js`
  - privileged WAV merge now runs in the Electron main process;
  - constrained IPC handler `voice-render:mergeWavFiles` added;
  - existing output dialog and system-info IPC remain in main process.
- `src/main/preload.js`
  - reduced back to a narrow contextBridge surface;
  - `saveFile` invokes `dialog:saveFile`;
  - `mergeWavFiles` invokes `voice-render:mergeWavFiles`;
  - no direct filesystem/process execution remains in preload.
- Existing Voice Render UI, shared voice library, clone storage, sequential chunks, Stop semantics, log/status corrections remain on the same branch/PR.

## Isolation
No P1/P2/P3 implementation, shared video Job/gate, backend TTS engine or dependency/package change.

## Gates
- Execution: PASS — bridge correction published.
- Automated/static verification: WAITING on final exact HEAD.
- Code review: WAITING on bridge correction exact head.
- Owner runtime: PARTIAL — mount/preview PASS; render previous head FAIL; RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches the final exact PR #50 HEAD, fully restarts VSR, clicks `Render toàn bộ`, confirms WAV save dialog appears, then confirms the queue populates and chunk 1 begins. If that passes, continue through merged playable WAV. Do not merge.
