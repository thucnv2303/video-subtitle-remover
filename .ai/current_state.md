# Current State

## Status
STANDALONE-SUBTITLE-REMOVER-010 — READY FOR PM DIRECT IMPLEMENTATION / SOURCE NOT YET IMPLEMENTED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/STANDALONE-SUBTITLE-REMOVER-010`.
- Draft PR: #59.
- Parent/base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Exact task base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Last verified pre-sync task branch HEAD: `6ad17f5ba3ec8c8654eb6086045408f821e7b777`; exact live HEAD must always be re-read from GitHub before editing.
- Active authority: `.ai/task_specs/ACTIVE.md` + `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md` on the current task ref.

## Verified repository state — 2026-08-15
- PR #59 is open, Draft, unmerged, based on `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756f...`.
- Comparing task base `330d756f...` to verified task HEAD `6ad17f5b...` shows only:
  - `.ai/task_specs/ACTIVE.md`
  - `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`
- Therefore no application source implementation is published yet.
- The previously attempted `src/renderer/js/standalone-subtitle-remover.js` is absent on the verified task HEAD.

## Verified source findings for implementation
- `src/renderer/js/app.js` is the active P2 controller and exposes shared state via `window._appState`; do not create a second P2 store.
- Existing Step 2 DOM lives in `src/renderer/index.html`; reuse it rather than cloning P2 markup/IDs.
- Voice Render dynamically inserts `#nav-voice-render` immediately before Settings; standalone `Xoa Sub` must be inserted directly after Voice Render without changing Voice Render processing.
- Manual `runNextPass()` currently sends `mask_mode: job.maskMode || 'box'`; task 010 must change only the manual pass to `region.maskMode || job.maskMode || 'box'`. Auto remains job-level.
- Manual region list currently has no per-region mask selector.
- Drawing cursor is already toggled to crosshair on the original canvas, but successful region creation currently sets `state.isDrawing = false`; task 010 must keep drawing active for continuous multi-region drawing.
- Current drawing maps `canvas-inner-orig` viewport coordinates back to source video coordinates; do not rewrite this mapping without new failure evidence.

## Product outcome
Add a standalone sidebar entry `Xoa Sub` directly below Voice Render. It opens the existing P2 workspace as an independent removal tool, without requiring P1/P3 and without duplicating backend/state/DOM.

## Scope
Primary source scope:
- `src/renderer/index.html`
- `src/renderer/js/app.js`
- `src/renderer/styles/main.css`

A small renderer helper is allowed only when clearly safer than direct active-controller changes and it must have an explicit bootstrap/load path.

Forbidden: P1 AI/Semantic, Voice Render processing, TTS, P3, backend/inpaint duplication, dependency churn, BUG-039/BUG-040, broad refactor.

## Gates
- Execution: NOT STARTED / source not published.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: PASS for pre-implementation task handoff after this docs sync.
- Merge permission: BLOCKED.

## Next permitted action
In the next chat, first re-read PR #59 exact current HEAD and canonical task files. If PR still contains no application source, implement task 010 directly on the existing review branch according to the remote task spec, publish a separate source commit, then review GitHub diff/full files before Owner runtime. Do not merge.
