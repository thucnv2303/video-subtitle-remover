# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Bounded JSON Retry

## Status
ERROR_DETAIL_POPUP_RETRY_REVISION_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `c4cfdae61ed121a66fd22887a2391059163508d8`.

## Owner-confirmed runtime state
- Multi-job failure isolation: PASS in latest run; Job 1 failed and Job 2 automatically continued to P1 completion.
- Failed-card popup opens: PASS.
- Popup error detail: FAIL — too generic.
- Failed-Job retry action: FAIL — no usable visible action in tested build.

## Required outcome
1. Failed Job preserves the exact actionable failure message and stage.
2. Popup displays that exact text safely using text-only rendering.
3. Popup includes explicit `↻ Chạy lại` so retry does not depend on fragile card DOM decoration.
4. Retry while another P1 Job processes enters queue without preemption.
5. Retry while idle starts through existing queue recovery.
6. Existing failure isolation, canonical `p1Status`, Stop/Cancel guards, processing feedback and bounded malformed-JSON retry remain intact.

## Current implementation
- `pipeline1-ai.js` persists `p1ErrorMessage`, `p1ErrorStage`, `p1ErrorAt` directly in AI/remix and TTS catch paths before rethrow.
- `pipeline1-run-ux.js` resolves popup detail from persisted Job fields and adds `↻ Chạy lại` to popup actions.
- Popup retry uses the existing queueFailedP1Job path; it writes both `status` and `p1Status='queued'` and does not cancel/replace an active Job.
- Card-level retry remains optional convenience; popup retry is the stable required control.

## Verification
- Owner log proves failure isolation and exact malformed-JSON error text.
- GitHub compare `34817b82...` → `c4cfdae6...`: only `pipeline1-run-ux.js` and `pipeline1-ai.js` changed.
- No P2/P3/STTN/Settings/backend algorithm source changed.
- No GitHub CI/status checks configured.

## Gates
Execution PASS; automated/static PARTIAL; code review WAITING current revision; Owner PARTIAL PASS with popup detail/retry RETEST REQUIRED; documentation sync PASS; merge BLOCKED; Step 3 BLOCKED.
