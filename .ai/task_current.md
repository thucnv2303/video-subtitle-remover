# Current Task

## Task ID
PIPELINE3-WORKSPACE-015

## Status
OWNER_RUNTIME_FAIL_NEEDS_REVISION_REBUILD_DESIGN_WAITING

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57.
- Starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`.
- Owner-tested prototype HEAD: `75b7a62fe5b7892dc2de9fb78ae60e82cc8825c9`.
- Failure/research record: `.ai/task_specs/PIPELINE3-WORKSPACE-015-OWNER-FAIL-OPENCUT-RESEARCH.md`.

## Owner runtime result
FAIL / NEEDS_REVISION.

Observed in the real application:
1. P3 color/tone is inconsistent with the approved demo and the rest of the application.
2. Dedicated Job Management is missing.
3. Final video preview is presented with the wrong editor geometry/aspect treatment.
4. Owner requested OpenCut research before rebuilding P3.

## Research result
Official OpenCut sources were reviewed. Useful patterns for this project are architectural, not a request to copy OpenCut wholesale:
- left assets/source panel, center preview, right properties, bottom timeline;
- independently resizable editor regions;
- logical canvas geometry separated from viewport geometry;
- fit scale based on the source canvas aspect ratio;
- modular timeline/state/interaction responsibilities;
- editor UI separated from rendering engine/core.

## Revised product direction
The current P3 V1 should not receive cosmetic patching. The replacement design should have:
- visible left Job Manager / source bin;
- center logical video canvas/player that preserves source aspect ratio and letterboxes/pillarboxes as needed;
- right Subtitle/Audio/Export inspector;
- bottom assembly timeline with synchronized playhead;
- the approved app navy/blue-gray/blue visual system;
- event/state driven synchronization instead of 300 ms polling as primary authority;
- focused P3 modules instead of one large workspace module.

Existing P3 finalizer/backend contracts remain the rendering boundary unless later research proves a missing capability.

## Current source disposition
PR #57 is retained as prototype and forensic/reference evidence only. It is not merge-ready and is frozen for application-source changes while the replacement design/spec is reviewed.

## Gates
- Execution: PASS for prototype publication only.
- Automated/static: WAITING.
- Code review: prior source logic review is historical evidence; current product decision NEEDS_REVISION.
- Owner runtime: FAIL.
- Documentation synchronization: PASS after Owner-fail sync.
- Merge: BLOCKED.

## Next action
Review/approve a revised P3 editor design/spec based on the Owner failures and verified OpenCut patterns. Only after approval create a fresh dedicated rebuild branch/task from the approved integration base. Do not merge PR #57.
