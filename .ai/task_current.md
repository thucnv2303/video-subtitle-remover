# Current Task

## Task ID
PIPELINE1-APPROVED-UI-001

## Name
Pipeline 1 — Owner-Approved Functional-Zone UI Rebuild

## Status
WAITING_OWNER_TEST

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

## Scope
Product source changed only:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline1-approved.css`

Settings, Pipeline 2, Pipeline 3, backend, dependencies and package source are unchanged.

## Review findings
- Current Pipeline 1 JS blob: `41b6f844d9af6f31df6e34af171b58a256d70a1a`.
- Add-video forwarding is preserved.
- Console Copy/Xóa handlers are preserved.
- Voice preview uses existing TTS generation and selected clone/system voice.
- Selected Job content/audio detail uses existing ASR/AI/TTS/file-dialog contracts.
- PM GitHub code review: PASS for runtime testing.
- GitHub CI: none configured.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for available static gates; runtime verification still required.
- Code review: PASS.
- Owner manual app verification: AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS for Owner-test state.
- Merge permission: BLOCKED until Owner PASS and explicit merge approval.

## Owner test focus
Compare directly with the approved demo, then verify: add video, Job selection/detail, prompt/provider/model controls, `Nghe thử giọng`, extract/rewrite/update text, TTS/upload audio, start/stop queue, Console Copy/Xóa, and switching between Pipeline steps/Settings.
