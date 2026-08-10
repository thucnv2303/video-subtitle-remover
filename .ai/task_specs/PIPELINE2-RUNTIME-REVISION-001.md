# PIPELINE2-RUNTIME-REVISION-001

Status: WAITING_OWNER_RETEST
Date: 2026-08-10
Parent task: `PIPELINE2-APPROVED-UI-001`
Draft PR: #42

## Trigger
Owner accepted the redesigned Pipeline 2 UI but runtime testing exposed:
- P2 remained visually processing at 0% while backend status was `error: backend not available`;
- no realtime result preview while processing;
- repeated `/api/status` and heartbeat lines flooded Console;
- no trustworthy evidence that the subtitle-removal engine reached CUDA execution.

Owner authorized the runtime revision in the current interaction.

## Root cause verified from source
`api/server.py` imports the subtitle-removal engine from an ignored local directory named `video-subtitle-remover-ref`. A clean linked worktree does not contain that ignored directory. The Python server therefore starts and answers health/status requests, but `HAS_BACKEND=False` and the worker reports `error: backend not available` when P2 starts.

The backend already exposes `/api/preview` and captures `latest_preview_frame`, but legacy renderer result preview loads only finished output files. Existing renderer polling continues to query `/api/status`, which also creates repetitive Uvicorn access lines.

## Authorized source scope for this revision
- `src/main/python-bridge.js` — resolve the existing local backend reference from linked-worktree Git common root and pass it through `PYTHONPATH` / `VSR_BACKEND_REF`; no network download.
- `src/main/preload.js` — load the isolated P2 runtime enhancer only.
- `src/renderer/js/pipeline2-runtime.js` — fail-fast status watchdog, throttled live `/api/preview`, one-row P2 progress telemetry and repetitive-log suppression.

Existing approved UI files remain in the parent task:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

Forbidden:
- no P1/P3 behavior changes;
- no AI/TTS/ASR behavior added to P2;
- no direct P2 upload/drop;
- no model download or repository clone;
- no subtitle-removal algorithm rewrite in this revision;
- no claim of actual GPU inference from CUDA availability alone.

## Required behavior
1. In a linked clean owner-test worktree, discover an existing backend reference from the main Git worktree when `<main-worktree>/video-subtitle-remover-ref/backend/main.py` exists.
2. If the backend reference is unavailable or the worker reports an error, P2 must transition to frontend Error within a short watchdog interval and stop the endless 0% processing/polling state.
3. While P2 is processing and `/api/preview` has a frame, draw the real backend preview into `canvas-result`; do not synthesize/fake a cleaned frame.
4. Repetitive successful access logs for `/api/status`, `/api/preview`, `/api/health`, `/api/gpu-info` and repetitive inpaint heartbeat lines must not accumulate in the P2 Console while processing.
5. Keep one live P2 progress row updated in place with algorithm, progress, elapsed time, accelerator preflight, frame when available, and stage.
6. GPU telemetry must be described as preflight/expected device until runtime proves the actual STTN engine loaded and processed frames.
7. Preserve the existing P1→P2 gate and subtitle-removal-only P2 execution.

## Verification evidence before owner retest
- Exact Git blob hash + `node --check` for `python-bridge.js`, `preload.js`, `pipeline2-runtime.js`.
- Linked-worktree backend-discovery simulation PASS.
- Direct GitHub review of changed-file scope and PR comments/threads.
- Owner runtime retest still required for real backend import, STTN execution, live preview, GPU behavior and clean-video result.

## Owner retest acceptance
Owner uses the same short test video and verifies:
- startup logs a discovered backend reference and no `No module named 'backend'` warning;
- P2 does not remain stuck at 0% on backend error;
- real result preview updates during processing;
- Console shows one changing P2 progress row rather than accumulating status/heartbeat lines;
- log reports CUDA preflight; actual GPU use is judged from successful STTN processing plus runtime device/GPU observation, not temperature alone;
- P2 produces a clean video with matching timeline and unlocks P3 only after success.

Merge permission: BLOCKED until Owner runtime PASS, docs re-sync and explicit merge approval.
