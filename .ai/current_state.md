# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — ERROR-DETAIL/POPUP-RETRY REVISION PUBLISHED / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `c4cfdae61ed121a66fd22887a2391059163508d8`.

## Latest Owner runtime evidence — 2026-08-11
Owner retested the canonical error-state revision and reported:
- failed-Job popup now opens;
- popup detail is too generic;
- no usable `Chạy lại` action is visible;
- multi-job fault isolation itself works: the failed Job did not block the next Job, and the next Job completed Pipeline 1 successfully.
Owner log shows the exact failure was malformed AI JSON: `Expected ',' or ']' after array element in JSON at position 6625 (line 151 column 10)`.

## Current source correction
- `pipeline1-ai.js` now writes the exact thrown failure message, stage, and timestamp directly onto the Job before rethrowing; AI/remix and TTS failures are both covered.
- `pipeline1-run-ux.js` popup reads persisted Job error detail instead of depending on a generic fallback/log wrapper only.
- Popup now contains an explicit `↻ Chạy lại` action as the primary stable retry affordance.
- Card-level retry remains best-effort UX, but retry no longer depends on that DOM placement.
- Popup retry routes through the same queue function: it sets both canonical/legacy P1 state to queued and preserves an already-processing Job.
- Existing canonical `p1Status` handling, preload wiring, observer-loop fix, processing feedback, failure isolation, and bounded malformed-JSON retry remain preserved.

## Verification
- Owner log confirms queue failure isolation runtime behavior is effective.
- GitHub compare `34817b82...` → `c4cfdae6...`: exactly two source files changed (`pipeline1-run-ux.js`, `pipeline1-ai.js`).
- Direct diff review confirms no P2/P3/STTN/Settings/backend algorithm changes.
- GitHub CI/status checks are not configured; no CI PASS is claimed.
- Fresh Owner runtime verification is required for exact popup detail and popup retry behavior.

## Gates
- Execution: PASS for publication.
- Automated/static verification: PARTIAL — source/diff review only; no configured CI/full Electron runtime by PM.
- Code review: WAITING final review of current source revision.
- Owner manual verification: PARTIAL PASS — queue isolation PASS; popup detail/retry RETEST REQUIRED.
- Documentation synchronization: PASS for current Owner-result intake.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Complete PM review of `c4cfdae6...`, then Owner retests popup exact error detail and `↻ Chạy lại` from the popup; verify retry queues behind an active Job and starts when the scheduler becomes free.
