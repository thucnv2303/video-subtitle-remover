# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Fix Pipeline 1 multi-job resilience before any Step 3 work proceeds.

## Exact basis
- Branch start: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Parent state: P2 single-job runtime PASS; P2 multi-job coverage waiting.

## Owner-observed failures
1. Current-processing Job was not reliably reflected as the selected/detail Job.
2. A failed P1 Job stopped the remaining queue.
3. Ollama returned malformed structured JSON after reasoning completed, producing a parse failure.

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- canonical `.ai/` task/state/QA/bug files.

## Non-goals
- No P2/P3 implementation changes.
- No STTN/backend algorithm changes.
- No Settings changes.
- No broad `app.js` refactor.

## Implementation requirements
1. Follow actual `pipeline1JobId` / processing Job in the selected/detail UI.
2. Detect a stalled P1 queue only when no P1 Job is active/processing and a non-cancelled queued P1 Job remains.
3. Resume the next queued Job without converting Owner Stop/Cancel into automatic resume.
4. Retry malformed AI JSON exactly once through the existing P1 vision bridge.
5. Do not retry cancellation, timeout, network/model, or unrelated failures under the malformed-JSON policy.
6. If retry still returns malformed JSON, keep that Job as error and allow the next queued Job to continue.
7. Do not log raw model payloads.

## Acceptance criteria
- `node --check src/renderer/js/pipeline1-run-ux.js` PASS.
- Exact tested file hash matches the published Git blob.
- Multi-job simulation: Job 1 error + Job 2 queued => Job 2 processing.
- Running Job becomes `pipeline1SelectedJobId` and `activeJobId`.
- Malformed JSON => exactly two total bridge calls (initial + one retry).
- Cancel/timeout classification => no malformed-JSON retry.
- No source file outside approved scope changes.
- Owner runtime retest only after PM code review PASS.

## Owner retest scenario
- Queue at least 2 P1 videos.
- Confirm UI/status/detail switches to the Job currently processing.
- Exercise a normal two-Job completion path.
- If a Job errors, verify the next queued Job starts instead of the app appearing stuck.
- If malformed JSON recurs, verify only one retry message appears; if retry fails too, the next Job still runs.

## Merge
BLOCKED until required static review + Owner runtime PASS + canonical result synchronization + explicit PM approval.
