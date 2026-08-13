# Active PM Execution Spec

Status: BOOTSTRAP_CORRECTION_PUBLISHED_STATIC_AND_OWNER_RETEST_WAITING

Task: `VOICE-RENDER-SHARED-LIBRARY-009`
Repository: `thucnv2303/video-subtitle-remover`
Single active review branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`
Single active Draft PR: #50
Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`
Superseded PR #49: CLOSED/OBSOLETE — do not use
Exact spec: `.ai/task_specs/VOICE-RENDER-SHARED-LIBRARY-009.md`
Latest application-source commit: `4e7b17a773f7602fa9cfce697cdffcca2b72e7d3`

## Execution authority
Owner instructed Project Manager to implement directly on GitHub. Do not dispatch Anti/external executors unless Owner explicitly changes this instruction.

## Incident/result that triggered correction
Owner real-app observation on the previous head: Voice Render nav and the intended global status card did not appear. Treat the previous bootstrap as runtime FAIL, not PASS.

## Current corrective contract
- Main BrowserWindow performs deterministic `js/voice-render.js` bootstrap after `did-finish-load`.
- Bootstrap is idempotent and logs load/bootstrap failures.
- Preload injection is fallback only.
- There is one active Voice Render branch/PR only. PR #49 is closed and non-authoritative.
- Voice Render still shares the existing voice library, supports clone voice, long-text sequential chunks, final WAV merge, Log card and persistent global system status.
- It must not create/mutate video Jobs or P1/P2/P3 gates/artifacts.

## Active application source authority
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/js/voice-render.js`
- `src/renderer/styles/voice-render.css`

No further source edit is authorized unless exact-head review or Owner retest finds another defect.

## Verification required now
Use the final PR #50 exact HEAD in `E:\Project AI\Video-sub-remove-owner-test-P1`.

Required static commands:
```text
node --check src/main/main.js
node --check src/main/preload.js
node --check src/renderer/js/voice-render.js
git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD
```

After static PASS:
1. fully close every running Video Subtitle Remover/Electron instance;
2. start the app from the exact PR #50 HEAD;
3. verify first that sidebar shows `Trang chủ`, `Voice Render`, `Cài đặt` and global App/Backend/TTS/GPU/CPU/RAM status;
4. navigate Home -> Voice Render -> Settings -> Home; exactly one page active and global status remains;
5. only after that gate passes continue clone/voice-preview/long-text tests.

## Gates
- Execution: PASS corrective source published.
- Automated/static verification: WAITING.
- Code review: WAITING on corrected exact head.
- Owner visual/runtime verification: previous head FAIL; corrected-head RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
