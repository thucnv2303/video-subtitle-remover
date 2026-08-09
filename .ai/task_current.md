# Current Task

## Task ID
PIPELINE1-APPROVED-UI-001

## Name
Pipeline 1 — Owner-Approved Functional-Zone UI Rebuild

## Status
WAITING_OWNER_UI_RETEST

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

## Owner first runtime result
NEEDS_REVISION for UI acceptance.

Required corrections were:
- remove duplicate Pipeline 1 left-nav item;
- remove add-file/drop UI from Job Queue and keep add-file in Actions;
- make Job selection explicit;
- expand Console / Log vertically;
- remove per-job action/delete controls;
- make fullscreen layout consume available width.

Separate deferred functional defect:
- `Bắt đầu chạy` does not execute the intended Pipeline 1 flow. Tracked under BUG-005 and intentionally excluded from this visual correction pass.

## Revised source
- `src/renderer/js/pipeline.js` blob: `d7199ee277a3b791d29c385b5b90736d92c68554`.
- `src/renderer/styles/pipeline1-approved.css` blob: `7686bb48cc47336e6602a07c635958c333dec118`.
- Source correction commits: `d4c21c7a2553f788e656afa6abb42687920071a6`, `e99f7042387e82552cd4616536d2d6fea12ebf6f`.

## Verification
- Exact reconstructed JS Git blob equality: PASS.
- Exact revised JS `node --check`: PASS.
- Static assertions for removed sidebar injection/drop-zone/per-job delete and retained Actions add/Job selector: PASS.
- Net product source scope remains exactly `pipeline.js` + `pipeline1-approved.css`.
- PM revised code review: PASS for UI retest.
- GitHub CI: none configured.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for revised UI source.
- Code review: PASS for revised UI source.
- Owner manual app verification: FIRST CANDIDATE FAIL; REVISED UI RETEST AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Owner retest focus
Verify only the revised UI/interaction acceptance points: no duplicate sidebar Pipeline 1 item; no add/drop zone in #3; selecting a Job is obvious; #5 remains the action zone; no far-right per-job delete; #6 reaches the lower app area; fullscreen uses available width. BUG-005 processing flow is a separate follow-up after UI acceptance.
