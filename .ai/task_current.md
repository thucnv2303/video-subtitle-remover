# Current Task

## Task ID
PIPELINE2-APPROVED-UI-001

## Name
Pipeline 2 Approved UI

## Status
CODE_REVIEW_PASS — OWNER_TEST_AUTHORIZED

## Stacked base
- Base branch: `review/BUG-005-P1-FULL-CHAIN`
- Base SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`
- Dependency: Draft PR #41 remains unmerged and preserved as the accepted P1 functional checkpoint.

## Review branch / PR
- Branch: `review/PIPELINE2-APPROVED-UI-001`
- Draft PR: #42
- Reviewed source checkpoint: `5c9c2f0fa12c884b19fa5d8bfcee080a31364203`

## Objective
Rebuild Pipeline 2 UI to the Owner-approved demo while preserving the existing subtitle-removal engine and existing P1→P2/P2→P3 state boundaries.

## Allowed application source
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

No other application-source file is part of PR #42.

## Verified product behavior from source review
- Existing Step 2 runtime nodes are moved/reused rather than replaced with new engine logic.
- P2 direct file upload/drop is hidden/blocked.
- Existing algorithm/mask/manual-region controls are preserved.
- Existing original/result preview, playback, progress, start/cancel and log contracts remain present.
- Existing unchanged `pipeline-state.js` remains authoritative for P1→P2 eligibility and Start interception.
- P2 start remains subtitle-removal-only: `extractSrt=false`, `asrFallback=false`, `aiRewrite=false`, `ttsGenerate=false`.
- Unsupported P2-only delete-selected remains disabled.
- Job Queue and Console use internal scrolling; responsive layout stacks at narrower widths.

## Review evidence
- PR #42 exists, is OPEN / DRAFT / mergeable.
- Changed-file scope reviewed directly on GitHub.
- No unresolved PR comments, reviews or inline threads.
- GitHub CI/checks are absent for this head.
- Isolated new P2 adapter block: `node --check` PASS.
- Exact full published `pipeline.js` blob syntax check is not independently recorded in this environment; do not elevate Automated/static verification to full PASS on that basis.

## Code review decision
PASS for Owner runtime UI verification.

## Owner test acceptance
Owner now tests the exact current PR #42 head and reports observed PASS/FAIL for:
- visual parity with approved P2 demo and accepted P1 visual tone;
- empty, single-job and 10+ eligible-job queue behavior;
- internal queue scroll with Actions remaining visible;
- selected job correctly drives metadata/original/result panes;
- no direct P2 upload/drop;
- only P1-unlocked jobs shown;
- Start invokes existing P2 subtitle-removal route;
- responsive/fullscreen fit;
- Console readability/internal scrolling.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING for complete exact-blob/runtime evidence; isolated P2 adapter syntax PASS.
- Code review: PASS.
- Owner manual app verification: AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS at current review checkpoint.
- Merge permission: BLOCKED.

## Merge rule
Do not merge until Owner runtime verification PASS is recorded, documentation is synchronized again, automated verification gate is satisfactorily closed, and Project Manager explicitly approves merge.
