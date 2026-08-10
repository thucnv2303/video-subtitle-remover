# Current Task

## Task ID
PIPELINE2-MANUAL-REGION-REVISION-002

## Name
Pipeline 2 Manual ROI Geometry, Per-Region Mask, and Compact Inpaint Log

## Status
READY_FOR_ANTI_EXECUTION

## Parent task
`PIPELINE2-RUNTIME-REVISION-001`

The previous runtime revision fixed the backend-loading/stuck-state path sufficiently for Owner retest. This task addresses the remaining correctness and observability defects found in that retest.

## Authority / review basis
- Repository: `thucnv2303/video-subtitle-remover`
- Authority branch before this task: `review/PIPELINE2-APPROVED-UI-001`
- Draft PR: #42
- PM basis SHA before task publication: `186c9726d88a99f4438b77002b1487077c0ce712`
- Required new review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`
- Execution spec: `.ai/task_specs/PIPELINE2-MANUAL-REGION-REVISION-002.md`

## Owner evidence
Owner reports and supplied runtime log show:
- realtime preview: PASS;
- P2 completes and produces output;
- 440-frame STTN run completed in about 38 seconds at 11.38 frame/s;
- P3 unlock occurs after successful P2 completion;
- manual drawn ROI is visually displaced;
- region-specific mask selection is missing;
- Console still contains repetitive `/api/frame/...` access logs and expected early preview 404 noise.

## Allowed source files
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`
- `src/renderer/js/pipeline2-runtime.js`
- `src/renderer/styles/pipeline2-approved.css`

## Allowed knowledge files
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/bugs.md`
- `.ai/qa_checklist.md`

## Required behavior
1. Manual drawing and rendered overlays use the actual rendered `canvas-original` rectangle, including letterbox offset, not the full preview wrapper.
2. Saved regions remain in source-video pixel coordinates.
3. Each manual region persists its own `maskMode`; existing region objects without it remain backward compatible.
4. The global mask selector is the default for new regions / auto mode and must not retroactively overwrite existing regions.
5. Manual multi-pass payload uses the current region's mask mode.
6. Visible P2 Console suppresses successful `/api/frame/...` access flood and expected early `/api/preview` 404 noise during active P2 processing, while retaining meaningful progress, warnings, fatal errors, and completion/output.
7. Preserve realtime preview, runtime backend discovery, P1→P2 eligibility/start gates, STTN behavior, and P3 unlock semantics.

## Verification required
- `node --check src/renderer/js/app.js`
- `node --check src/renderer/js/pipelines/pipeline2-remove.js`
- `node --check src/renderer/js/pipeline2-runtime.js`
- `git diff --check`
- deterministic ROI mapping simulation including a letterboxed portrait canvas;
- two-region payload proof with different masks;
- backward-compatibility proof for a region missing `maskMode`;
- log-filter proof that frame 200 / expected active-preview 404 are suppressed while fatal errors remain visible.

## Gates
- Execution: NOT STARTED.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: PARTIAL PASS / NEEDS_REVISION from previous retest; fresh retest NOT STARTED.
- Documentation synchronization: PASS at task-open checkpoint.
- Merge permission: BLOCKED.

## Merge rule
Do not merge until implementation, automated verification, GitHub code review, fresh Owner runtime PASS, owner-result documentation synchronization, and explicit Project Manager approval are complete.
