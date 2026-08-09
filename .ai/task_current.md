# Current Task

## Task ID
PIPELINE1-APPROVED-UI-001

## Name
Pipeline 1 — Owner-Approved Functional-Zone UI Rebuild

## Status
WAITING_CODE_REVIEW_AFTER_OWNER_UI_FAIL

## Base
`e578e48c22a79c69005f2d3373599addfc412ecf`

## Review branch / PR
- Branch: `review/PIPELINE1-APPROVED-UI-001`
- Draft PR: #39

## Approved outcome
Six functional zones matching the Owner-approved demo:
1. AI & Prompt.
2. Giọng đọc & Voice with `Nghe thử giọng`.
3. Job Queue.
4. Selected Job detail with content/audio tabs.
5. Actions.
6. Console / Log.

## Owner runtime result
First candidate: NEEDS_REVISION.

Required UI corrections from Owner:
- remove duplicate Pipeline 1 left-nav item;
- remove add-file/drop UI from Job Queue and keep add-file in Actions;
- make Job selection explicit in Job Queue;
- expand Console / Log vertically;
- remove per-job action/delete button from Job rows;
- make full-screen layout consume available width instead of leaving large blank margins.

Separate deferred functional defect:
- `Bắt đầu chạy` does not execute the intended Pipeline 1 flow. Track under BUG-005 after UI acceptance; do not mix into this visual correction pass.

## Revised source
- `src/renderer/js/pipeline.js` blob: `d7199ee277a3b791d29c385b5b90736d92c68554`.
- `src/renderer/styles/pipeline1-approved.css` blob: `7686bb48cc47336e6602a07c635958c333dec118`.
- Source correction commits: `d4c21c7a2553f788e656afa6abb42687920071a6`, `e99f7042387e82552cd4616536d2d6fea12ebf6f`.

## Scope
Product source remains limited to:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline1-approved.css`

Settings, Pipeline 2, Pipeline 3, backend, dependencies and package source remain out of scope.

## Gates
- Execution: PASS for revised UI publication.
- Automated/static verification: WAITING for revised exact-head gate.
- Code review: WAITING for revised candidate.
- Owner manual app verification: FAIL on first candidate; revised retest NOT YET AUTHORIZED.
- Documentation synchronization: PASS for current revision state.
- Merge permission: BLOCKED.

## Next review focus
Verify revised GitHub source and static safety, then authorize Owner UI retest only. Processing-flow repair remains a separate next task after visual acceptance.
