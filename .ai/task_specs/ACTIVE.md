# Active PM Execution Spec

Status: RUNTIME_REVISION_2_SOURCE_PUBLISHED_OWNER_RETEST_WAITING

Task: `PIPELINE1-LOG-OBSERVABILITY-009`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
Prior failing Owner-tested HEAD: `3ab395128d841626d689182853beea8c10c58aa1`
Revision-2 spec commit: `19a5b4ca530a7567a5bd64b90ddb0228fd9399dd`
Revision-2 source commit: `c4d9911c8cb6cf99fdbeb3ca9cf561d2269d14c7`

Execution spec:
`.ai/task_specs/PIPELINE1-LOG-OBSERVABILITY-009.md`

## Authorized/final application scope
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipeline2-runtime.js`

`src/renderer/js/app.js` must remain net-unchanged.

## Verified revision-2 state
- Owner runtime on prior HEAD: FAIL for visible duplicate routine access logs / incomplete frame-log coalescing.
- Revision-2 source isolation: PASS — source commit changes only `pipeline2-runtime.js`, +7/-4.
- PM code review of exact patch: PASS.
- No polling/timer/backend behavior changed.
- Exact executable Node syntax/diff-check: WAITING.
- Owner runtime revision-2 retest: WAITING.

## Next permitted action
No additional source modification is authorized unless the new revision fails. Run exact static checks on latest PR #52 HEAD, then Owner restarts app and verifies:
- idle routine health/TTS/GPU access rows do not accumulate;
- status UI still refreshes;
- P2 frame processing uses one updating live row;
- warnings/errors remain visible;
- P1 retention/Copy/Clear still work.

## Merge
BLOCKED.