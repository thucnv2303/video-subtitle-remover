# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience and runtime feedback blockers before Step 3.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Latest source commit: `0e988a0cd187633eafb401f30c3f646b1255e2a9`

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/styles/pipeline1-run-ux.css`
- canonical `.ai/` state/task/QA files.

## Required behavior
1. Selected/detail state follows actual processing Job.
2. Processing Job is visually distinct using restrained pulse/glow plus spinner; reduced-motion supported.
3. Failed Job does not stop later queued Jobs.
4. Failed Job remains visibly failed; click opens readable error detail.
5. Error popup uses safe text-only rendering and does not fire when Job-card controls are clicked.
6. Stop/Cancel does not revive pending work.
7. Malformed JSON retries exactly once; unrelated/cancel/timeout failures do not retry.
8. Feedback synchronization must not create MutationObserver churn through repeated no-op attribute writes.

## Non-goals
No P2/P3/STTN/Settings/backend algorithm changes. No broad `app.js` refactor.

## Verification
- run-UX final blob `8a08b81e30862716fca21ffcdcb2e7ec54dbece1` exact hash match;
- exact run-UX `node --check` PASS;
- GitHub incremental diff reviewed;
- latest PM code review PASS `4898257228` for source through `0e988a0...`;
- Owner runtime required for animation/error-popup interaction.

## Merge
BLOCKED until Owner runtime PASS, documentation sync and explicit PM approval.
