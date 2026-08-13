# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_PARTIAL_PASS_RUNTIME_FIXES_PUBLISHED_RETEST_WAITING

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
- Log font too small.
- Global App status layout/data not yet acceptable; CPU/RAM unavailable on observed head.
- `Render toàn bộ` does not start; queue stays empty.

## Corrective implementation now published
- Main-process WAV save dialog is modal to the app window and adds WAV filter/default extension.
- Main-process `app:systemInfo` provides CPU usage, RAM usage, app/Electron version.
- Preload system-info bridge uses IPC.
- Owner-fix stylesheet increases log readability and makes App status a metric-card layout.
- Owner-fix renderer refreshes Backend/TTS/GPU/CPU/RAM and adds missing-render-bridge diagnostics.

## Active source
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/js/voice-render.js`
- `src/renderer/styles/voice-render.css`
- `src/renderer/js/voice-render-owner-fixes.js`
- `src/renderer/styles/voice-render-owner-fixes.css`

## Required static verification
On final PR #50 HEAD in `E:\Project AI\Video-sub-remove-owner-test-P1`:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Fully close all VSR/Electron instances.
2. Launch exact final PR #50 HEAD.
3. Confirm Log is readable without zooming.
4. Confirm global App status shows Backend/TTS/GPU plus real CPU/RAM values and remains visible across tabs.
5. Click `Render toàn bộ`; a WAV save dialog must appear.
6. Choose output path; queue must populate and chunk 1 must enter rendering state.
7. If successful, continue until merged WAV is produced and playable.
8. Confirm P1/P2/P3 state is unchanged.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING on corrected exact head.
- Owner runtime: PARTIAL; RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
