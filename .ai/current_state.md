# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — ERROR-DETAIL/POPUP-RETRY CODE REVIEW PASS / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest reviewed source commit: `c4cfdae61ed121a66fd22887a2391059163508d8`.

## Latest Owner runtime evidence — 2026-08-11
Owner reports:
- failed-Job popup opens;
- popup detail was too generic;
- no usable visible `Chạy lại` action in the tested revision;
- multi-job fault isolation works: the failed Job did not block the next Job, and the next Job completed Pipeline 1 successfully.
Owner log records the exact failure as malformed AI JSON: `Expected ',' or ']' after array element in JSON at position 6625 (line 151 column 10)`.

## Current source correction
- `pipeline1-ai.js` persists exact failure message, stage, and timestamp directly on the Job before rethrow for AI/remix and TTS failures.
- `pipeline1-run-ux.js` popup reads persisted Job error detail using text-only rendering.
- Popup now contains an explicit `↻ Chạy lại` action as the stable retry affordance; card-level retry is no longer required for recovery.
- Popup retry routes through the existing canonical queue function, sets both legacy/canonical P1 state to queued, and preserves an already-processing Job.
- Existing canonical `p1Status` handling, preload wiring, observer-loop fix, processing feedback, multi-job failure isolation, and bounded malformed-JSON retry remain preserved.

## Verification
- Owner log confirms queue failure isolation runtime behavior is effective.
- GitHub compare `34817b82...` → source `c4cfdae6...`: exactly two source files changed (`pipeline1-run-ux.js`, `pipeline1-ai.js`).
- PM code review PASS for `c4cfdae6...`: review `4902886696`.
- No P2/P3/STTN/Settings/backend algorithm changes.
- GitHub CI/status checks are not configured; no CI PASS is claimed.
- Fresh Owner runtime verification is required for exact popup detail and popup retry behavior.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL — source/diff review PASS; no configured CI/full Electron runtime by PM.
- Code review: PASS.
- Owner manual verification: PARTIAL PASS — queue isolation PASS; popup detail/retry RETEST READY.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner retests latest PR #44 head. Verify popup shows the exact failure reason/stage and `↻ Chạy lại`; retry must queue behind an active Job and start when scheduler is free.
