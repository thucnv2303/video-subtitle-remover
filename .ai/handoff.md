# AgentOS Handoff Status

## Active task
`PIPELINE2-MANUAL-REGION-REVISION-002 — Manual ROI Geometry, Per-Region Mask, and Compact Inpaint Log`

## Status
READY FOR ANTI EXECUTION

## Review basis
- Current P2 branch before task publication: `review/PIPELINE2-APPROVED-UI-001`.
- Draft PR: #42.
- PM basis SHA before publication: `186c9726d88a99f4438b77002b1487077c0ce712`.
- P2 remains stacked on `review/BUG-005-P1-FULL-CHAIN` at `97d5a13e77b6919931c251c74fab4c191fa04cec`.
- Required new review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`.

## Owner retest intake — 2026-08-10
Verified/observed improvements:
- backend now loads sufficiently for actual STTN processing;
- realtime result preview works;
- processing speed is much faster than the prior failed run;
- supplied log shows 440 frames completed in about 38 seconds at 11.38 frame/s;
- backend runtime reports STTN GPU mode;
- clean-video output is created;
- P3 unlocks after successful P2 completion.

Remaining blockers:
1. Manual ROI box is displaced from the user's drag location.
2. Each manual region cannot select/persist its own mask mode; current payload uses one job-level mask.
3. Visible Console still floods successful `/api/frame/...` access lines and expected early preview 404 lines.

## Direct source diagnosis
- Approved P2 CSS makes `canvas-inner` fill the preview pane while `canvas-original` is aspect-ratio constrained and centered. Legacy draw math uses the wrapper dimensions, producing incorrect coordinates/overlay geometry when letterboxing exists.
- `job.regions.push(...)` stores no `maskMode`.
- manual `pipeline2-remove.js` payload sends `mask_mode: job.maskMode || 'box'` instead of a region-specific value.
- P2 runtime log coalescing omits `/api/frame` from its successful access-log filter.

## Execution authority
Remote active spec:
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/PIPELINE2-MANUAL-REGION-REVISION-002.md`

Anti must fetch and read both from the exact remote authority ref named by Project Manager before editing. Local spec copies are not authority.

## Gates
- Execution: new revision NOT STARTED.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual verification: previous retest PARTIAL PASS / NEEDS_REVISION; fresh retest NOT STARTED.
- Documentation synchronization: PASS at owner-result intake/task-open checkpoint.
- Merge permission: BLOCKED.

## Owner action
No fresh Owner app test until the new source revision is published and Project Manager code review passes. Owner does not edit `.ai` files.
