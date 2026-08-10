# Current State

## Status
PIPELINE2-APPROVED-UI-001 — CODE REVIEW PASS / OWNER TEST AUTHORIZED

## Canonical product foundation
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`.
- Canonical merged task base before stacked P1 work: `dd520054b385ae18b8154b7c897eb9baad7eac02`.
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.

## Preserved Pipeline 1 checkpoint
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.
- Stacked base SHA for the current P2 UI task: `97d5a13e77b6919931c251c74fab4c191fa04cec`.
- Owner previously accepted the current P1 functional checkpoint and requested no further P1 refinement for now.
- PR #41 remains unmerged; this P2 task does not merge or reopen P1.

## Active task
`PIPELINE2-APPROVED-UI-001 — Pipeline 2 approved UI`

Review branch:
`review/PIPELINE2-APPROVED-UI-001`

Draft PR:
#42

Reviewed source checkpoint:
`5c9c2f0fa12c884b19fa5d8bfcee080a31364203`

## Verified implementation facts
GitHub review of PR #42 confirms the application-source diff is limited to:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

The PR also contains the task execution spec under `.ai/task_specs/`.

The P2 UI adapter:
- reuses and relocates existing Step 2 runtime DOM nodes before deferred `app.js` startup;
- preserves existing algorithm, mask, manual-region, preview, progress, start/cancel, job-list and log nodes;
- hides direct `btn-open-file` and `drop-zone` UX in Pipeline 2;
- uses the existing `pipeline-state.js` gate for P1→P2 eligibility and P2 start authorization;
- does not add AI rewrite, TTS, ASR or final-render logic to P2;
- keeps unsupported P2-only delete-selected disabled instead of inventing a new mutation path;
- gives Job Queue and Console independent internal scrolling and responsive stacked behavior at narrower widths.

Unchanged `pipeline-state.js` still requires P1 FINISHED before P2 eligibility and, on P2 start, forces:
- `extractSrt = false`
- `asrFallback = false`
- `aiRewrite = false`
- `ttsGenerate = false`

## Verification
- PR #42: OPEN / DRAFT / mergeable.
- Changed files reviewed directly from GitHub: PASS for scope.
- PR review threads/comments: none unresolved.
- GitHub CI/checks: not configured; no workflow runs/status checks exist for the reviewed source checkpoint.
- Isolated P2 adapter delta: `node --check` PASS.
- Exact full published `pipeline.js` blob has not been independently syntax-checked outside GitHub in this review environment because direct container network access is unavailable. Therefore this is not recorded as a complete automated/static PASS for merge purposes.

## Code review result
PASS for Owner runtime UI verification.

No source blocker was found that requires another code revision before Owner testing.

## Owner acceptance to run now
Owner should test PR #42 in the real app and report observed PASS/FAIL for:
- P2 visual parity with the approved demo/P1 visual language;
- 0 / 1 / 10+ eligible jobs;
- internal Job Queue scrolling with Actions remaining visible;
- selected job drives metadata and original/result previews;
- no direct P2 upload/drop path;
- only P1-unlocked jobs appear;
- Start invokes existing subtitle-removal-only P2 path;
- responsive/fullscreen fit;
- Console readability and scroll behavior.

## Gates
- Execution: PASS for P2 UI source publication.
- Automated/static verification: WAITING for complete exact-blob/runtime evidence; isolated P2 adapter syntax PASS.
- Code review: PASS for Owner runtime test.
- Owner manual app verification: AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS at this documentation checkpoint.
- Merge permission: BLOCKED.

## Next permitted action
Owner runs the real app from the exact current PR #42 head and reports observed P2 PASS/FAIL. Do not merge. After Owner evidence, update canonical `.ai` files again and re-evaluate all merge gates.
