# QA Checklist

## Active task
`STANDALONE-SUBTITLE-REMOVER-010 — Standalone Xoa Sub using existing Pipeline 2`

## Review basis
- [x] Branch `review/STANDALONE-SUBTITLE-REMOVER-010`.
- [x] Draft PR #59.
- [x] Task base `330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- [x] Remote `ACTIVE.md` and task spec define implementation authority.
- [x] Verified pre-sync branch state contained task docs only; application source was not yet implemented.
- [x] Previously attempted `src/renderer/js/standalone-subtitle-remover.js` absent at verified pre-sync ref.

## Architecture/scope checks after implementation
- [ ] Existing Step 2 DOM reused; no duplicated P2 DOM IDs.
- [ ] Existing `window._appState` reused; no second P2 job store.
- [ ] Existing P2/backend inpaint path reused; no backend duplication.
- [ ] Xoa Sub appears directly below Voice Render.
- [ ] Voice Render processing unchanged.
- [ ] P1/P3/TTS source unchanged outside strictly required navigation integration.
- [ ] No dependency churn/broad renderer refactor.

## Manual region behavior
- [ ] Region list exposes `box`, `tight`, `soft` per region.
- [ ] New region inherits job mask default when appropriate.
- [ ] Manual `runNextPass()` uses `region.maskMode || job.maskMode || 'box'`.
- [ ] Auto path still uses job-level `job.maskMode || 'box'`.
- [ ] Drawing crosshair appears only on drawable preview while Manual drawing is enabled.
- [ ] Switching Auto / disabling Draw removes crosshair.
- [ ] Successful first region does not disable drawing; second/third regions can be drawn continuously.
- [ ] `canvas-inner-orig` coordinate mapping is preserved.

## Standalone navigation/workspace
- [ ] Click Xoa Sub opens existing Step 2 workspace without requiring P1.
- [ ] Pipeline P1/P2/P3 chrome is hidden only while standalone mode is active.
- [ ] Leaving Xoa Sub restores normal Home/Voice Render/Settings navigation/layout.
- [ ] No page switch accidentally triggers P1 or P3.

## Static verification
- [ ] Exact branch and HEAD recorded after source publication.
- [ ] Changed files reviewed against scope.
- [ ] `node --check src/renderer/js/app.js` PASS if changed.
- [ ] `node --check` every other changed JS PASS.
- [ ] `git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD` PASS.
- [ ] GitHub full diff + relevant full files reviewed by PM.
- [ ] CI/check status reviewed; absent checks are not treated as PASS without other evidence.

## Owner runtime QA — only after PM code-review PASS
- [ ] Sidebar shows Voice Render -> Xoa Sub -> Settings.
- [ ] Xoa Sub works without P1.
- [ ] Auto removal smoke PASS.
- [ ] Manual Draw shows `+` cursor on preview.
- [ ] Draw Region 1 and Region 2 without toggling Draw again.
- [ ] Both region overlays match drawn positions.
- [ ] Region 1 = Box; Region 2 = Tight/Soft.
- [ ] Processing uses correct mask per pass.
- [ ] Progress/log remain functional.
- [ ] Result preview works.
- [ ] `_no_sub.mp4` exists and remains P3-compatible.
- [ ] Auto removes crosshair.
- [ ] Voice Render still works.
- [ ] Normal main pipeline has no obvious regression.

## Gates
- Execution: NOT STARTED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner manual verification: NOT STARTED.
- Documentation synchronization: PASS for pre-implementation handoff.
- Merge permission: BLOCKED.
