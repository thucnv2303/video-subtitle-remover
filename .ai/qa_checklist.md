# QA Checklist

## Active task
`STANDALONE-SUBTITLE-REMOVER-010 — Standalone Xoa Sub using existing Pipeline 2`

## Authority
- [x] Branch `review/STANDALONE-SUBTITLE-REMOVER-010`.
- [x] Draft PR #59.
- [x] PR base `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`.
- [x] Owner-tested application-source HEAD `8a29624349d297d3f5299b98bd7a0ac51912e7a2`.

## Architecture/scope checks
- [x] Existing Step 2 DOM reused; no duplicated P2 backend/workspace implementation.
- [x] Existing `window._appState` reused; no second P2 job store.
- [x] Existing P2/backend inpaint path reused; no backend duplication.
- [x] Xoa Sub appears directly below Voice Render.
- [x] Main P1/P3 processing remains separate from standalone Xoa Sub.
- [x] No dependency churn/broad renderer refactor required by final task scope.

## Manual region behavior
- [x] Region list supports `box`, `tight`, `soft` per region.
- [x] Continuous drawing supports multiple regions without re-enabling Draw after each successful region.
- [x] Drawing crosshair is visible on drawable preview in Manual mode.
- [x] Region overlay coordinate behavior accepted by Owner.
- [x] Each region supports independent frame start/end range.
- [x] Existing regions can be moved/repositioned.

## Standalone workspace
- [x] Click Xoa Sub opens standalone workspace without requiring P1.
- [x] Multi-video upload/queue works independently of P1/P3.
- [x] Job selection is explicit with per-job checkboxes.
- [x] `Chọn tất cả` and `Chạy đã chọn` operate on queue selection.
- [x] Preview/result are scoped to the selected job.
- [x] Mục 4 provides a single `Mở thư mục lưu trữ` action using configured shared output directory.

## Static verification — exact source HEAD
Owner ran these commands on `8a29624349d297d3f5299b98bd7a0ac51912e7a2`:
- [x] `node --check src/main/preload.js` PASS.
- [x] `node --check src/renderer/js/pipeline-state.js` PASS.
- [x] `node --check src/renderer/js/standalone-subtitle-remover.js` PASS.
- [x] `node --check src/renderer/js/standalone-subtitle-interactions.js` PASS.
- [x] `node --check src/renderer/js/standalone-output-folder.js` PASS.
- [x] `git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD` PASS.
- [x] GitHub full diff/relevant files reviewed by PM during task iterations.
- [x] GitHub workflow status checked: no workflow runs exist for exact source HEAD; local exact-head static evidence is used for this gate.

## Owner runtime QA
- [x] Owner reports final latest standalone implementation PASS.
- [x] Standalone Xoa Sub works independently of P1.
- [x] Manual drawing/crosshair/multiple-region workflow accepted.
- [x] Per-region mask, frame range and movement controls accepted.
- [x] Queue selection/run-selected workflow accepted.
- [x] Output-folder workflow accepted.

## Gates
- Execution: PASS.
- Automated/static: PASS.
- Code review: PASS.
- Owner manual verification: PASS.
- Documentation synchronization: PASS after final docs sequence.
- Merge permission: APPROVED after verifying final docs-only HEAD.