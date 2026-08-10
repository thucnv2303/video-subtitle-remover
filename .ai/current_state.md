# Current State

## Status
PIPELINE2-MANUAL-REGION-REVISION-002 — READY FOR ANTI EXECUTION

## Canonical product foundation
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`.
- Canonical merged task base before stacked P1 work: `dd520054b385ae18b8154b7c897eb9baad7eac02`.
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.

## Preserved Pipeline 1 checkpoint
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.
- P2 stacked base SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`.
- PR #41 remains unmerged and preserved as the current functional checkpoint.

## Active Pipeline 2 checkpoint
- Branch: `review/PIPELINE2-APPROVED-UI-001`.
- Draft PR: #42.
- PM basis before this task publication: `186c9726d88a99f4438b77002b1487077c0ce712`.
- Owner has already accepted the redesigned P2 UI/layout.

## Owner runtime retest — 2026-08-10
Positive observations:
- previous `backend not available` / 0% stuck failure is no longer reproduced;
- realtime result preview works;
- processing speed is materially improved;
- captured run processed 440 frames in about 38 seconds at 11.38 frame/s;
- runtime reported STTN GPU mode and generated the clean-video output;
- successful P2 completion unlocked the matching P3 job.

Remaining failures found by Owner:
- manual drawn subtitle region appears displaced from the pixels originally dragged;
- manual regions no longer have an independent mask-mode choice per region;
- visible inpaint Console is still noisy, dominated by successful `/api/frame/...` access logs and expected early `/api/preview` 404 lines.

## Direct code findings
- `app.js` maps pointer coordinates against `canvas-inner`, while the approved P2 CSS makes `canvas-inner` fill the preview pane and centers an aspect-ratio-constrained canvas inside it. The saved/painted ROI therefore uses the wrong display coordinate space when letterboxing exists.
- region objects currently store coordinates/range/label only; no region-level `maskMode` is persisted.
- `pipeline2-remove.js` sends `mask_mode: job.maskMode`, so all manual passes share the job-level mask.
- `pipeline2-runtime.js` suppresses successful status/preview/health/gpu access logs but does not suppress successful `/api/frame/...` access lines; expected early preview 404 lines also remain visible.

## Active revision
Task: `PIPELINE2-MANUAL-REGION-REVISION-002`.
Spec: `.ai/task_specs/PIPELINE2-MANUAL-REGION-REVISION-002.md`.
Required review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`.

Scope is limited to manual ROI geometry, per-region mask state/payload, and visible P2 log compaction. Preserve the working runtime bridge, realtime preview, STTN algorithm behavior, P1→P2 gate, and P3 unlock rules.

## Gates
- Execution: previous runtime revision PASS; new revision NOT STARTED.
- Automated/static verification: previous runtime revision PASS; new revision WAITING.
- Code review: new revision WAITING.
- Owner manual app verification: PARTIAL PASS / NEEDS_REVISION.
- Documentation synchronization: PASS after this owner-result intake checkpoint.
- Merge permission: BLOCKED.

## Next permitted action
Anti executes only the remote active spec from the exact current authority ref, publishes a dedicated review branch and Draft PR, then Project Manager reviews source/diff/tests before any fresh Owner retest. Do not merge.
