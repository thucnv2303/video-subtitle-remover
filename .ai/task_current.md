# Current Task

## Task ID
PIPELINE1-APPROVED-UI-001

## Name
Pipeline 1 — Owner-Approved Functional-Zone UI Rebuild

## Status
WAITING_REVIEW

## Base
`e578e48c22a79c69005f2d3373599addfc412ecf`

## Review branch
`review/PIPELINE1-APPROVED-UI-001`

## Approved outcome
Rebuild Pipeline 1 to the Owner-approved demo with six clear functional zones:
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

No Settings, Pipeline 2, Pipeline 3, backend, dependency, or package source change is authorized for this task.

## Verification
- Net source scope against post-Settings canonical base: PASS — exactly two product files.
- Exact GitHub `pipeline.js` blob: `913cbb3312545f0c6f3176451a8a094f56a5a61c`.
- Exact-blob `node --check`: PASS.
- Required runtime IDs exactly once: PASS.
- Voice preview uses existing `window.api.generateTTS` contract: PASS by code inspection.
- Pipeline 1 detail actions route to existing ASR/AI/TTS/file-dialog contracts: PASS by code inspection.
- Runtime screenshot/function test: WAITING.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for available checks.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED until code review PASS.
- Documentation synchronization: PASS for review state.
- Merge permission: BLOCKED.
