# Active PM Execution Spec

Status: RUNTIME_REVISION_4_SOURCE_PUBLISHED_OWNER_RETEST_WAITING

Task: `PIPELINE1-LOG-OBSERVABILITY-009`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
Revision-4 starting HEAD: `0dc2723fde10c0b002af3efe52da94bc93978b6a`
Revision-4 spec commit: `df6741fffa5c29250f13689b65813f9824bfbfad`
Revision-4 source head: `e25792663f9c66cfd54b25c4f60de61b14341e8e`

Execution spec:
`.ai/task_specs/PIPELINE1-LOG-OBSERVABILITY-009.md`

## Authorized/final application scope
- `src/renderer/js/pipeline1-log-router.js`
- `src/renderer/js/pipeline1-run-config.js` one import only.

`src/renderer/js/app.js`, `pipeline2-runtime.js`, backend and Prompt Manager remain unchanged in revision 4.

## Verified revision-4 state
- Revision 3: NEEDS_REVISION — Owner screenshot shows `[Ollama]` P1 logs in P2.
- Root cause verified: P1 `[Ollama]` marker omitted from filter and keyed P1 progress dual-wrote to both containers.
- Revision 4 routes explicitly P1-owned messages/progress directly to P1 console.
- Source isolation: PASS — router + one import.
- PM code review: PASS after progress fallback correction.
- Exact executable Node syntax/diff-check: WAITING.
- Owner runtime revision-4 retest: WAITING.

## Next permitted action
Run exact static checks on latest PR #52 HEAD, then Owner retests:
- P1 `[P1]`/`[Ollama]` logs only in P1;
- no P1 progress in P2 before P2 runs;
- idle polling noise suppressed;
- P2 one-line frame progress;
- warning/error and Copy/Clear preserved.

## Separate follow-up
`BUG-040` Prompt Manager V2 remains separate. Do not edit Prompt Manager source on PR #52.

## Merge
BLOCKED.