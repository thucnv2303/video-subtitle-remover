# Current Task

## Task ID
PIPELINE1-LOG-OBSERVABILITY-009

## Status
RUNTIME_REVISION_4_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_PARTIAL_OWNER_RETEST_WAITING

## Basis
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Revision-4 starting HEAD: `0dc2723fde10c0b002af3efe52da94bc93978b6a`.
- Revision-4 spec commit: `df6741fffa5c29250f13689b65813f9824bfbfad`.
- Revision-4 source head: `e25792663f9c66cfd54b25c4f60de61b14341e8e`.
- Bug: `BUG-039`.

## Owner requirement
- P1 operational/progress logs remain in P1 and must not appear in P2 Console/Log.
- `[Ollama]` P1 vision/reasoning progress is explicitly P1-owned.
- P2 routine polling noise stays suppressed and P2 frame progress remains one live row.
- Warning/error remains visible in its owning pipeline console.

## Application scope
- new `src/renderer/js/pipeline1-log-router.js`;
- one import in `src/renderer/js/pipeline1-run-config.js`.
- P2 runtime and `app.js` unchanged.

## Revision-4 implementation
- P1-owned marker router sends `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, `[VoiceSub]`, `[Ollama]`, `[Gemini]` directly to `#step1-log-output`.
- P1 keyed progress updates only the P1 console.
- If P1 DOM is unavailable, router/progress safely fall back to previous implementations.
- Already-rendered P1-owned rows are cleaned from P2 on router install.

## Verification
- Source isolation: PASS — router + one import only.
- PM code review: PASS after fallback correction.
- Executable Node syntax/diff-check: WAITING.
- Owner runtime revision-4 retest: WAITING.

## Separate follow-up
`BUG-040` Prompt Manager V2 is confirmed by Owner screenshot/source but remains a separate task/PR.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.