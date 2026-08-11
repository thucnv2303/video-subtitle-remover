# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience and runtime feedback blockers before Step 3.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Latest source commit: `eb9eaf11e0a2c7b1b66c779dd5e55fc74d902fcf`

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/styles/pipeline1-run-ux.css`
- `src/main/preload.js` — narrowly allowed only to load the P1 run-UX runtime after Owner proved the prior adapter was dead code.
- canonical `.ai/` state/task/QA/spec files.

## Required behavior
1. Selected/detail state follows actual processing Job.
2. Processing Job is visually distinct using restrained pulse/glow plus spinner; reduced-motion supported.
3. Failed Job does not stop later queued Jobs.
4. Failed Job remains visibly failed; click opens readable error detail.
5. Failed Job exposes `↻ Chạy lại`.
6. Retry while another P1 Job is processing queues behind the active Job and does not preempt/cancel it.
7. Retry while idle starts through the normal P1 queue path.
8. Error popup uses safe text-only rendering and does not fire when Job-card controls are clicked.
9. Stop/Cancel does not revive explicitly stopped work.
10. Malformed JSON retries exactly once; unrelated/cancel/timeout failures do not retry.
11. Feedback synchronization must not create MutationObserver churn.
12. `pipeline1-run-ux.js` must be reachable from the real application boot path and selectors must match generated Job DOM.

## Non-goals
No P2/P3/STTN/Settings/backend algorithm changes. No broad `app.js` refactor. No unrelated preload refactor.

## Current runtime-wiring correction
- `332a3460ecf8e5649d0d49b63106ae0b7d011464`: preload injects `js/pipeline1-run-ux.js` on DOMContentLoaded.
- `eb9eaf11e0a2c7b1b66c779dd5e55fc74d902fcf`: run-UX targets the actual status span from the legacy Job markup and decorates it with `.p1-job-state`.

## Verification
- Owner exact-head test `ffd7984...` invalidated prior runtime-readiness assumptions.
- Final source/static review required for current wiring revision.
- Fresh Owner runtime required for popup/retry/processing feedback and add-video stability.

## Merge
BLOCKED until required verification, Owner runtime PASS, documentation sync and explicit PM approval.
