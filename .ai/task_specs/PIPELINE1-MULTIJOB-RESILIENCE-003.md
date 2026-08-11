# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience and runtime feedback blockers before Step 3.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Latest reviewed source: `ecf2a10f7e29cbb2bc2f2c67e51df394c7de22d2`

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/styles/pipeline1-run-ux.css`
- `src/main/preload.js` — narrow runtime loading only.
- canonical `.ai/` state/task/QA/spec files.

## Required behavior
1. Selected/detail state follows actual processing Job.
2. Processing Job is visually distinct.
3. Failed Job does not stop later queued Jobs.
4. Failed Job remains visibly failed; click opens readable error detail.
5. Failed Job exposes `↻ Chạy lại` outside any periodically rewritten status-chip text.
6. Retry while another P1 Job is processing queues behind active Job and does not preempt/cancel it.
7. Retry while idle starts through normal P1 queue path.
8. Popup uses safe text-only rendering.
9. Stop/Cancel does not revive explicitly stopped work.
10. Malformed JSON retries exactly once; unrelated/cancel/timeout failures do not retry.
11. Feedback synchronization does not create MutationObserver churn.
12. run-UX is reachable from real boot path and selectors match generated Job DOM.
13. P1 interaction logic must respect `pipeline-state.js` canonical `p1Status`; do not infer visible error solely from legacy `job.status`.

## Non-goals
No P2/P3/STTN/Settings/backend algorithm changes. No broad app/preload/pipeline-state refactor.

## Current correction chain
- `332a3460...`: preload loads run-UX.
- `eb9eaf11...`: bind actual status DOM.
- `ecf2a10...`: use canonical P1 state and stable sibling retry action.

## Verification
- Owner exact-head `094a1b9...` exposed the state-authority mismatch.
- Direct `pipeline-state.js` inspection confirms failed P1 state is held in `p1Status` while legacy status is reset to idle.
- PM code review `4902799500` PASS for `ecf2a10...`.
- Fresh Owner runtime required.

## Merge
BLOCKED until required verification, Owner runtime PASS, documentation sync and explicit PM approval.
