# Active PM Execution Spec

Status: OWNER_PARTIAL_PASS_RUNTIME_CORRECTIONS_PUBLISHED_RETEST_WAITING

Task: `VOICE-RENDER-SHARED-LIBRARY-009`
Repository: `thucnv2303/video-subtitle-remover`
Single active review branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`
Single active Draft PR: #50
Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`
Superseded PR #49: CLOSED/OBSOLETE — do not use

## Execution authority
Project Manager direct GitHub implementation. No Anti/external executor.

## Latest Owner evidence
PASS:
- Voice Render mounts.
- Shared voice preview works.

FAIL requiring correction:
- Log is too small.
- Global status presentation/CPU/RAM data not acceptable.
- `Render toàn bộ` does not start; queue remains empty.

## Current correction contract
- Main-process save dialog is parented to the VSR window and constrained to WAV.
- `app:systemInfo` IPC supplies real CPU/RAM/app/Electron metrics.
- Preload exposes system info through that IPC.
- Owner-fix CSS increases Log readability and makes sidebar status metric-card based.
- Owner-fix JS refreshes real Backend/TTS/GPU/CPU/RAM values and emits explicit diagnostic when render bridges are missing.
- Existing long-text queue remains sequential and final output still requires all chunks + constrained WAV merge.
- Voice Render must not mutate video Jobs or P1/P2/P3 gates/artifacts.

## Active application source
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/js/voice-render.js`
- `src/renderer/styles/voice-render.css`
- `src/renderer/js/voice-render-owner-fixes.js`
- `src/renderer/styles/voice-render-owner-fixes.css`

## Verification required
On the final exact PR #50 HEAD in `E:\Project AI\Video-sub-remove-owner-test-P1`:
```text
node --check src/main/main.js
node --check src/main/preload.js
node --check src/renderer/js/voice-render.js
node --check src/renderer/js/voice-render-owner-fixes.js
git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD
```

After static PASS, fully restart the app and retest only:
1. Log readable without zoom.
2. Global status shows Backend/TTS/GPU and real CPU/RAM metrics and remains across tabs.
3. `Render toàn bộ` opens WAV save dialog.
4. After choosing output, queue appears and chunk 1 starts.
5. If rendering starts, allow completion and verify final merged WAV/playback.
6. No P1/P2/P3 state mutation.

Unexpected behavior => STOP and report observation; do not modify Owner-test worktree.

## Gates
- Execution: PASS corrective source published.
- Automated/static: WAITING.
- Code review: WAITING on final correction head.
- Owner runtime: PARTIAL; RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
