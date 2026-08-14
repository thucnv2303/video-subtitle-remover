# Active PM Execution Spec

Status: RUNTIME_REVISION_3_SOURCE_PUBLISHED_OWNER_RETEST_WAITING

Task: `PIPELINE1-LOG-OBSERVABILITY-009`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
Revision-3 starting HEAD: `a7e05b1cd2fe2a4d78b74d7b7b3b59a7c9f08ba7`
Revision-3 spec commit: `a0c7d6b0de721ea11fa25aa0ae3c1618c3f939f0`
Revision-3 source commit: `de1a5e2cb25c46dffed383eb66cf54ca711af566`

Execution spec:
`.ai/task_specs/PIPELINE1-LOG-OBSERVABILITY-009.md`

## Authorized/final application scope
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipeline2-runtime.js` remains at revision-2 state unless a reviewed regression requires change.

`src/renderer/js/app.js` must remain net-unchanged.

## Verified revision-3 state
- Owner runtime finding: P1 operational logs leak into the P2 log panel before P2 runs.
- Direct source root cause: shared logger appends to Step 2 `#log-output` before cloning to Step 1.
- Revision-3 source isolation: PASS — `pipeline1-run-ux.js` only, +33/-0.
- PM exact commit diff review: PASS.
- P1 marker isolation is presentation-only; no polling/timer/backend behavior changed.
- Exact executable Node syntax/diff-check: WAITING.
- Owner runtime revision-3 retest: WAITING.

## Next permitted action
No additional source modification is authorized unless revision 3 fails. On latest PR #52 HEAD:
- run exact static checks;
- run P1 without starting P2 and confirm P1 logs remain only in P1;
- idle >=30s and confirm routine health/TTS/GPU rows stay suppressed in P2;
- run P2 and confirm one-line frame progress;
- confirm warning/error and Copy/Clear behavior.

## Separate follow-up
`BUG-040` Prompt Manager deletion persistence/default-prompt behavior remains separate and must not be mixed into this PR.

## Merge
BLOCKED.