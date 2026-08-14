# AgentOS Handoff Status

## Active task
`PIPELINE3-WORKSPACE-015`

## Status
OWNER RUNTIME FAIL / NEEDS_REVISION / OPENCUT RESEARCH COMPLETE / REBUILD DESIGN WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
- Owner-tested prototype HEAD: `75b7a62fe5b7892dc2de9fb78ae60e82cc8825c9`
- Owner-fail/research record: `.ai/task_specs/PIPELINE3-WORKSPACE-015-OWNER-FAIL-OPENCUT-RESEARCH.md`

## Owner runtime evidence
Two real-app screenshots show the current prototype does not meet the approved P3 product target:
- color/tone is wrong relative to the approved demo and app;
- there is no dedicated visible Job Management workspace;
- preview geometry/aspect presentation is wrong;
- Owner requested OpenCut research before redo.

Decision: NEEDS_REVISION. PR #57 is not eligible for merge.

## OpenCut findings to carry forward
Use OpenCut only as editor-architecture reference:
- left source/assets region, center preview, right properties, bottom timeline;
- resizable layout boundaries;
- logical video canvas dimensions remain authoritative independent of viewport size;
- fit-to-viewport scale preserves aspect ratio;
- explicit coordinate transforms for preview interaction;
- timeline, editor state and interactions are modular;
- editor UI is separated from rendering engine/core.

## Rebuild architecture
Next approved P3 should comprise:
1. Left visible Job Manager / Source Bin.
2. Center Player + logical aspect-correct canvas.
3. Right Properties Inspector for Subtitle / Audio / Export.
4. Bottom assembly Timeline with a shared playhead/editor state.

Theme authority is the existing approved app navy/blue-gray/blue system. Purple cannot be a standalone P3 identity.

Implementation should replace 300 ms polling as primary state authority with explicit editor/job events and split responsibilities into focused modules (store/editor, jobs, preview geometry, timeline, inspector, subtitle ASS adapter, render controller).

## Source disposition
Freeze P3 application source on PR #57. Keep it only as prototype/reference evidence. Do not continue cosmetic fixes on this branch and do not merge it.

## Parent project note
Do not mix the unresolved long Standard P1 narration redesign into this P3 rebuild.

## Local safety
No new clone/worktree/test directories. Existing Owner test directory policy remains unchanged.

## Gates
- Execution: PASS for prototype publication only.
- Automated/static: WAITING.
- Code review: historical source review only; product decision NEEDS_REVISION.
- Owner runtime: FAIL.
- Documentation synchronization: PASS after this handoff sync.
- Merge: BLOCKED.

## Next permitted action
Approve the revised P3 editor design/spec. After approval, create a fresh dedicated rebuild branch/task from the approved integration base. PR #57 remains frozen/unmerged.
