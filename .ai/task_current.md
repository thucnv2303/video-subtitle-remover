# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Bounded JSON Retry

## Status
ERROR_DETAIL_POPUP_RETRY_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest reviewed source commit: `c4cfdae61ed121a66fd22887a2391059163508d8`.

## Owner-confirmed runtime state
- Multi-job failure isolation: PASS; Job 1 failed and Job 2 automatically continued to P1 completion.
- Failed-card popup opens: PASS.
- Popup error detail: FAIL in prior tested revision — too generic.
- Failed-Job retry action: FAIL in prior tested revision — no usable visible action.

## Current implementation
- `pipeline1-ai.js` persists exact `p1ErrorMessage`, `p1ErrorStage`, `p1ErrorAt` directly in AI/remix and TTS catch paths before rethrow.
- `pipeline1-run-ux.js` renders persisted detail safely using text-only DOM.
- Popup includes explicit `↻ Chạy lại` and no longer depends on fragile card DOM for recovery.
- Popup retry uses existing queueFailedP1Job path, writes both canonical/legacy P1 state to queued, and preserves any active Job.
- Existing failure isolation, canonical `p1Status`, Stop/Cancel guards, processing feedback and bounded malformed-JSON retry remain intact.

## Verification
- Owner log proves failure isolation and exact malformed-JSON error text.
- GitHub compare `34817b82...` → `c4cfdae6...`: only `pipeline1-run-ux.js` and `pipeline1-ai.js` changed.
- PM code review PASS `4902886696`.
- No P2/P3/STTN/Settings/backend algorithm source changed.
- No GitHub CI/status checks configured.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner PARTIAL PASS with popup detail/retry RETEST READY; documentation sync PASS; merge BLOCKED; Step 3 BLOCKED.
