# Current State

## Status
PIPELINE3-WORKSPACE-015 — OWNER RUNTIME FAIL / NEEDS_REVISION / RESEARCH COMPLETE / REBUILD DESIGN WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57.
- Owner-tested exact prototype head: `75b7a62fe5b7892dc2de9fb78ae60e82cc8825c9`.
- Owner runtime evidence: two real-app screenshots supplied 2026-08-14.
- Failure/research record: `.ai/task_specs/PIPELINE3-WORKSPACE-015-OWNER-FAIL-OPENCUT-RESEARCH.md`.

## Verified Owner result
Owner rejected the current P3 V1 for product/UI reasons:
1. P3 color/tone does not match the approved demo or the rest of the app.
2. Dedicated Job Management is missing.
3. Final video preview uses the wrong workspace geometry/aspect presentation.
4. Owner requested OpenCut research before P3 is rebuilt.

This invalidates Owner acceptance for PR #57. The existing source remains prototype/reference evidence only and must not be merged.

## Verified source causes
- P3 introduced its own black/purple visual hierarchy instead of deriving from the approved P1/P2 navy/blue-gray system.
- P3 exposes only a top Job selector; the compatibility `#step3-job-list` is hidden, so there is no visible Job Manager.
- Preview panel geometry is flex/card-driven; video uses `object-fit: contain` inside that arbitrary viewport instead of making logical video canvas dimensions authoritative.
- Current P3 workspace is largely monolithic and driven by periodic 300 ms sync, which is not the preferred architecture for the rebuild.

## OpenCut research result
Official OpenCut sources were reviewed. The current OpenCut project is being rewritten; `opencut-classic` is the usable archived reference. Relevant verified patterns:
- editor layout separates left Assets, center Preview, right Properties and bottom Timeline in independently resizable panels;
- preview viewport keeps logical canvas size separate from viewport size and fits via `min(viewportWidth/canvasWidth, viewportHeight/canvasHeight)`;
- timeline logic is decomposed into track/playhead/ruler/snapping/interaction/store helpers rather than one UI monolith;
- engine/core and UI are separated, which maps well to preserving this project's existing P3 finalizer/backend while rebuilding editor UI/state.

## Revised P3 direction
Do not cosmetically patch PR #57. Next P3 design must use:
- left visible Job Manager / source bin;
- center aspect-ratio-correct logical video canvas/player;
- right Properties Inspector for Subtitle/Audio/Export;
- bottom assembly Timeline;
- existing app navy/blue-gray/blue visual system;
- explicit event/state updates rather than 300 ms polling as primary authority;
- focused modules for editor/store, jobs, preview geometry, timeline, inspector, subtitle ASS adapter and render controller.

## Gates
- Execution: PASS for failed prototype publication only.
- Automated/static: WAITING.
- Code review: historical source review PASS; current product decision NEEDS_REVISION.
- Owner manual app verification: FAIL.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.

## Next permitted action
Freeze application-source changes on PR #57. Produce a revised P3 editor design/spec based on the verified Owner failures and OpenCut architecture patterns. Only after Owner approves that revised design/spec may a fresh dedicated rebuild branch/task be created from the approved integration base. No merge.
