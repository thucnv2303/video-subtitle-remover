# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Bounded JSON Retry

## Status
FAILED_JOB_RETRY_POPUP_REVISION_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `542ccb44df047d001ebfcbe669ad223b7a5ef840`.

## Required outcome
1. Selected/detail state follows actual processing P1 Job.
2. Processing Job is visually unmistakable.
3. One failed P1 Job does not stop later queued Jobs.
4. Clicking failed Job opens readable error popup.
5. Failed Job exposes `Chạy lại`.
6. Retrying while another Job is processing queues the failed Job behind the active Job.
7. Retrying while idle starts through the existing queue recovery path.
8. Owner Stop/Cancel does not auto-resume explicitly stopped work.
9. Malformed JSON retry remains bounded to one additional analysis call.
10. Adding/loading video does not freeze renderer.

## Current implementation
- Failed-card popup handler runs in capture phase before legacy card-selection handling.
- Failed status badge gets `↻ Chạy lại`.
- Retry transitions only the failed Job to `queued`, resets progress/cancel flags, and does not touch the active Job.
- Existing queue runner/recovery decides whether the retried Job waits or starts.
- Processing glow/spinner, observer freeze fix and bounded JSON retry are preserved.

## Verification
- Compare `01fbfc9...` → `542ccb4...`: exactly two approved P1 UX files changed.
- Direct legacy-source inspection confirms `processPipeline1Queue()` returns when `state.pipeline1JobId` is already set, so a restarted failed Job remains queued behind the active Job.
- No P2/P3/STTN/Settings/backend source changes.
- Fresh Owner runtime confirmation required.

## Gates
Execution PASS; code review PASS for scope/logic; Owner verification RETEST READY; documentation sync PASS after publication/reverification; merge BLOCKED; Step 3 BLOCKED.
