# Current Task

## Task ID
PIPELINE2-MANUAL-REGION-REVISION-002

## Name
Pipeline 2 Manual ROI Geometry, Per-Region Mask, and Compact Inpaint Log

## Status
SOURCE_PUBLISHED — PM_REVIEW_IN_PROGRESS

## Parent / authority
- Parent branch: `review/PIPELINE2-APPROVED-UI-001`.
- Exact parent head: `39c2ac7254977c44d2cedb79cabd914fe124c3a7`.
- Active review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`.
- Draft PR: #43.
- PM source checkpoint: `f73c1f13d28d5d1222998399c4e0c20ac00ae815` before documentation commit.

## Owner outcome targeted
1. Manual ROI remains on the exact video pixels dragged, including portrait/letterboxed display.
2. Each manual region has an independent persisted mask mode.
3. P2 visible Console stays compact during inpaint without hiding real failures.

## Published source
Source commits:
- `f2928efb59459e45c6c9a78fdfc6b0a27004d010` — initial implementation.
- `f73c1f13d28d5d1222998399c4e0c20ac00ae815` — self-review correction/hardening.

Changed source relative to parent:
- `src/renderer/js/pipeline2-runtime.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`

The final runtime enhancer:
- maps manual pointer geometry using `canvas-original.getBoundingClientRect()`;
- includes letterbox offsets in overlay positioning;
- blocks draw-start outside the rendered canvas;
- stores `maskMode` on new regions and renders an independent Box/Tight/Soft selector;
- preserves legacy region fallback to `job.maskMode || 'box'`;
- adapts the actual active `window.api.startProcessBatch` manual request to the region for `state.processingPassIndex`;
- suppresses successful frame/status/preview/health/gpu access noise plus expected early preview 404 during active P2 only.

## Preserved boundaries
- no `api/server.py` change;
- no python bridge/preload change;
- no `pipeline-state.js` change;
- no P1/P3/Settings/dependency change;
- no subtitle-removal algorithm rewrite;
- realtime `/api/preview` remains in place;
- P3 remains success-only unlock.

## Verification
Deterministic simulation PASS:
- letterboxed portrait ROI round-trip max tested edge error 0.125 CSS px;
- region masks `box` and `tight` remain distinct;
- legacy region without `maskMode` falls back to job mask `soft`;
- `/api/frame` 200 and expected `/api/preview` 404 classify as hidden;
- `/api/preview` 500 and completion classify as visible.

GitHub compare from exact parent to source checkpoint: only two approved source files changed.

WAITING:
- exact published-blob `node --check`;
- local-checkout `git diff --check`;
- GitHub CI/checks (not configured).

## Gates
- Execution: PASS for source publication.
- Automated/static verification: PARTIAL PASS / WAITING remaining exact syntax + diff check.
- Code review: IN PROGRESS.
- Owner manual app verification: fresh retest NOT STARTED; previous P2 retest PARTIAL PASS / NEEDS_REVISION.
- Documentation synchronization: PASS at publication checkpoint.
- Merge permission: BLOCKED.

## Merge rule
No merge until required verification, PM code review, fresh Owner runtime PASS, owner result documentation, documentation synchronization and explicit PM approval are complete.
