# Current Task

## Task ID
PIPELINE1-LOG-OBSERVABILITY-009

## Status
SPEC_PUBLISHED_EXECUTION_READY

## Parent basis
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Exact base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Parent Draft PR: #51.
- Review branch: `review/PIPELINE1-LOG-OBSERVABILITY-009`.
- Bug: `BUG-039`.

## Objective
Make Pipeline 1 Console Log useful for QA and Owner inspection without changing Pipeline 1 processing behavior.

## Allowed application source
- `src/renderer/js/app.js` only.

## Acceptance
- Step1 retention bound = 2000 entries.
- Routine Python/Uvicorn `200 OK` GET access lines for `/api/health`, `/api/tts/status`, `/api/gpu-info` are not mirrored into P1 console.
- Non-200/errors and normal P1 logs remain visible.
- Global log remains unchanged.
- Backend/TTS/GPU status polling remains operational.
- Copy/Clear continue working.

## Gates
- Execution: NOT STARTED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS for task-open state.
- Merge: BLOCKED.
