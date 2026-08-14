# Active PM Execution Spec

Status: PIPELINE3_WORKSPACE_015_OWNER_RUNTIME_FAIL_REBUILD_DESIGN_WAITING

Task: `PIPELINE3-WORKSPACE-015`
Repository: `thucnv2303/video-subtitle-remover`
Review branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57
Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
Owner-tested prototype HEAD: `75b7a62fe5b7892dc2de9fb78ae60e82cc8825c9`
Failure/research record: `.ai/task_specs/PIPELINE3-WORKSPACE-015-OWNER-FAIL-OPENCUT-RESEARCH.md`

## Current decision
NEEDS_REVISION.

Owner runtime rejected the current P3 prototype because:
- its color/tone is inconsistent with the approved demo and app;
- dedicated Job Management is missing;
- preview geometry/aspect presentation is wrong;
- P3 should be researched against OpenCut editor architecture before rebuild.

## Frozen source rule
PR #57 application source is frozen as prototype/reference evidence. Do not cosmetically patch it and do not merge it.

## Verified redesign basis
OpenCut research supports the following architecture patterns for adaptation, not wholesale copying:
- left source/assets panel;
- center preview logical canvas;
- right properties inspector;
- bottom timeline;
- resizable editor regions;
- aspect-correct logical canvas fitted into viewport;
- explicit preview coordinate transforms;
- modular timeline/editor state/interactions;
- UI separated from render engine/core.

## Required replacement design
- Left: visible P3 Job Manager / Source Bin.
- Center: Player + logical source canvas preserving source aspect ratio with letterbox/pillarbox.
- Right: Subtitle / Audio / Export inspector.
- Bottom: assembly timeline with Video / Voice / Subtitle / Effect tracks and shared playhead.
- Theme: approved app navy/blue-gray/blue palette; no independent purple P3 theme.
- State: event-driven editor/job state where possible; no 300 ms polling as primary authority.
- Modules: editor/store, job panel, preview geometry, timeline, inspector, subtitle ASS adapter, render controller/re-render safety.
- Keep existing P3 finalizer/backend and immutable P1/P2 artifact boundaries unless a separately verified missing capability requires contract work.

## Gates
- Execution: PASS for prototype publication only.
- Automated/static: WAITING.
- Code review: prior source review historical only; current product decision NEEDS_REVISION.
- Owner runtime: FAIL.
- Documentation synchronization: PASS after Owner-fail sync.
- Merge: BLOCKED.

## Next permitted action
PM presents/reviews the revised P3 design/spec. Only after Owner approval create a fresh dedicated rebuild task/branch from the approved integration base. No implementation on PR #57 and no merge.
