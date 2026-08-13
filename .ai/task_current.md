# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_CORE_RUNTIME_PASS_DISTINCT_VOICE_PROFILE_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render mounts.
- voice preview works.
- `Render toàn bộ` works.
- 3/3 sequential chunks complete.
- final WAV merge succeeds and plays.

Revision requested before merge:
- each voice must carry explicit prosody/intonation metadata and its own speed profile;
- switching voice must not leave real output duration effectively identical merely because a global/default speed is reused.

## Published correction
- Built-in Voice Render voices have distinct `prosody + speedFactor` profiles.
- Legacy clone records without profile data are migrated to distinct profiles.
- New clone UI requires `Ngữ điệu` and `Tốc độ riêng`.
- duplicate clone name or duplicate `prosody + speedFactor` profile is rejected.
- Settings `Thêm giọng clone` is redirected to Voice Render so incomplete clone records are no longer created through a second path.
- `main.js` owns constrained FFmpeg `atempo` processing.
- preload exposes only `applyVoiceTempo()` IPC.
- Voice Render applies selected voice speed to preview/chunk audio before merge.
- estimator uses measured per-voice rate when available and profile speed fallback otherwise.

## Scope boundary
This correction stores profile metadata in the shared `tts_voices` record so the main workflow can consume the same library. It does not change P1/P2/P3 processing logic in this task.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Fully close VSR/Electron and launch exact final PR #50 HEAD.
2. Verify Voice Render list displays a distinct prosody and speed for Adam and at least one other voice.
3. Render the same short/medium text with two profiles whose speeds are visibly different (for example ~0.90x vs ~1.10x).
4. Actual audio durations must differ in the expected direction; faster profile must produce shorter output.
5. Create one clone and confirm the Clone Voice form requires/records `Ngữ điệu` + `Tốc độ riêng` and the new voice appears in the shared library.
6. In Settings, `Thêm giọng clone` must redirect to Voice Render instead of creating an incomplete voice locally.
7. Reconfirm final merge/playback and no P1/P2/P3 state mutation.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; profile/duration RETEST WAITING.
- Documentation synchronization: PASS after dynamic sync.
- Merge permission: BLOCKED until retest + static + review PASS.
