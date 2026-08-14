# PIPELINE1-LOG-OBSERVABILITY-009

Status: APPROVED FOR PM DIRECT EXECUTION — RUNTIME REVISION 2

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Expected base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
- Runtime-revision starting HEAD: `3ab395128d841626d689182853beea8c10c58aa1`
- Bug: `BUG-039`

## Owner runtime evidence — revision 2
Owner reports routine access logs still visibly repeat, including duplicate successful requests for `/api/health`, `/api/tts/status`, and `/api/gpu-info`. Owner also requires frame-processing progress to occupy one live line whose frame/progress value updates, instead of appending many frame lines.

## Revised user outcome
Log presentation must be operationally useful rather than a raw stdout mirror:
- successful routine status/access polling must not spam visible console history;
- P2 frame-processing progress must use one live progress row that updates in place;
- stage changes, warnings, errors, and completion remain distinct durable lines;
- no polling frequency or backend processing behavior changes.

## Verified code basis
1. `src/renderer/js/pipeline1-run-ux.js` owns P1 console cleanup/retention from the first BUG-039 correction.
2. `src/renderer/js/pipeline2-runtime.js` is the existing P2 runtime UX/log-coalescing layer.
3. `pipeline2-runtime.js::installLogCoalescing` currently returns without inspecting added log entries when there is no active P2 Job, so idle access-log noise remains in the global log.
4. `pipeline2-runtime.js::isNoisyAccessLog` covers several routine endpoints but does not cover `/api/tts/status`.
5. The same file already owns a single `liveRow` for P2 progress and removes recognized frame heartbeat lines after updating that row.

## Authorized application source
Exactly:
- `src/renderer/js/pipeline1-run-ux.js` only if P1 heartbeat cleanup requires a narrow correction;
- `src/renderer/js/pipeline2-runtime.js` for global routine-access cleanup and P2 frame coalescing.

No other application source is authorized.

## Required implementation
1. Keep existing P1 retention at 2000 and P1 heartbeat suppression behavior.
2. In the global/main log, remove routine successful Python/Uvicorn access lines for status/preview polling even when no P2 Job is active.
3. Include exact successful `GET /api/tts/status ... 200 OK` in routine-access suppression.
4. Preserve all non-200 responses, warnings, Python errors, renderer errors, and unrelated backend logs.
5. Do not reduce or disable health/TTS/GPU/status polling. This is presentation-only.
6. Preserve one P2 live progress row and update its text in place.
7. Raw frame/progress heartbeat variants recognized by the P2 UX layer must update that live row and then be removed from console history.
8. Support common frame-counter forms without swallowing arbitrary messages, including existing `processing frame A to B`, `Processing: A-B / Total: N`, and simple `frame N/TOTAL` progress forms when they are clearly processing/progress messages.
9. Stage transitions, start, warning/error, cancellation, and completion remain separate durable rows.
10. Copy/Clear behavior remains intact.

## Forbidden changes
- no `api/server.py`
- no `src/main/*`
- no Voice Render polling/timer changes
- no Settings changes
- no P1 AI/Vision/reasoning/TTS changes
- no Pipeline 3 changes
- no dependency changes
- no unrelated formatting/refactor
- no force push/history rewrite

## Verification
Required source review:
- final application diff limited to the two authorized renderer UX files;
- no polling/timer/backend changes;
- `/api/tts/status` successful access log is classified as routine noise;
- access-log cleanup is executed even while no P2 job exists;
- non-200 same-endpoint access line is retained;
- frame heartbeat updates one live row and raw heartbeat row is removed;
- warning/error rows remain durable.

Required executable checks when an exact checkout is available:
```text
node --check src/renderer/js/pipeline1-run-ux.js
node --check src/renderer/js/pipeline2-runtime.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner runtime acceptance
1. Restart app on exact PR #52 HEAD and leave idle >=30 seconds: visible log does not accumulate routine successful `/api/health`, `/api/tts/status`, `/api/gpu-info` rows.
2. Backend/TTS/GPU status still refreshes normally.
3. Run P2: frame progress is represented by one live row whose frame/progress values advance, not hundreds of appended frame lines.
4. Trigger/observe a warning or error: it remains visible as a distinct line.
5. P1 meaningful history still retains >100 entries and Copy/Clear still work.

## Gates
Owner runtime has invalidated the prior closeout assumption. Source revision is authorized. Merge remains BLOCKED.