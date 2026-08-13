# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_PARTIAL_PASS_PRELOAD_BRIDGE_FIX_PUBLISHED_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render tab/page mounts.
- Voice list is visible.
- Voice preview works.

FAIL:
- Previous log/status UX required correction.
- `Render toàn bộ` reports: `render bridge missing: saveFile/mergeWavFiles unavailable`.

## Root cause and correction
Privileged merge logic must not depend on preload-local `fs/path/child_process` availability. The correction moves WAV merge into Electron main process and exposes only narrow IPC methods through preload:
- `saveFile()` -> `dialog:saveFile`;
- `mergeWavFiles(inputs, output)` -> `voice-render:mergeWavFiles`.

Merge constraints remain:
- final output `.wav`;
- every chunk exists;
- chunk in same output directory;
- name matches `<final-stem>.part-###.wav`;
- merge in supplied order;
- only validated owned chunks cleaned after success.

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
3. Click `Render toàn bộ`.
4. WAV save dialog must appear.
5. Choose path; queue must populate and chunk 1 enter rendering.
6. If successful, continue until one merged playable WAV exists.
7. Reconfirm log readability and App status.
8. Confirm P1/P2/P3 state unchanged.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING on bridge correction exact head.
- Owner runtime: PARTIAL; RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
