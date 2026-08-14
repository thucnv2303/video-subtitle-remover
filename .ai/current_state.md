# Current State

## Status
PIPELINE1-LOG-OBSERVABILITY-009 — RUNTIME REVISION 4 SOURCE PUBLISHED / PM REVIEW PASS / STATIC PARTIAL / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Revision-4 starting HEAD: `0dc2723fde10c0b002af3efe52da94bc93978b6a`.
- Revision-4 spec commit: `df6741fffa5c29250f13689b65813f9824bfbfad`.
- Revision-4 source commits: `c08e09d1f260a86e2fff19f8c0e60ad103824347`, `326958d8a62aa8543643d1395633c1febf3d375d`, `e25792663f9c66cfd54b25c4f60de61b14341e8e`.
- Active bug: `BUG-039`.

## Owner runtime evidence
Owner screenshot on 2026-08-14 shows Pipeline 2 Console/Log still displaying P1 `[Ollama]` vision/reasoning progress while P2 has no job. Revision 3 is therefore NEEDS_REVISION and superseded.

Direct source review found revision 3 incomplete because `pipeline1-analysis.js` emits `[Ollama] ...`, while the revision-3 matcher omitted `[Ollama]`; additionally `pipeline1-run-ux.js::updateP1ProgressLog()` explicitly wrote progress to both P1 and P2/global containers.

A separate Owner screenshot confirms `BUG-040` Prompt Manager persistence/UI remains defective. That task stays separate from PR #52.

## Revision-4 source state
- New `src/renderer/js/pipeline1-log-router.js` owns P1 log presentation routing.
- `src/renderer/js/pipeline1-run-config.js` imports the router after `pipeline1-run-ux.js`.
- Explicit P1 owners `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, `[VoiceSub]`, `[Ollama]`, `[Gemini]` are written directly to `#step1-log-output` instead of the legacy global/P2 sink when P1 DOM is available.
- `window.updateP1ProgressLog` is replaced with a P1-only keyed progress updater; if P1 DOM is unavailable it falls back to the prior progress function.
- Existing P1 retention/heartbeat cleanup remains intact.
- Existing P2 routine-access cleanup and one-line frame coalescing remain unchanged.
- No backend, polling/timer, Prompt Manager, Settings, AI processing, or P3 behavior changed.

## Verification
- Revision-4 source isolation: PASS — new `pipeline1-log-router.js` (+98) plus one import in `pipeline1-run-config.js` (+1).
- PM exact source review: PASS after adding progress fallback.
- Exact executable `node --check` / `git diff --check`: WAITING executable checkout.
- Owner runtime revision-4 retest: WAITING.

## Gates
- Execution: PASS — revision-4 source published.
- Automated/static: PARTIAL.
- Code review: PASS for revision-4 exact source diff.
- Owner manual app verification: WAITING on latest HEAD.
- Documentation synchronization: PARTIAL until bug ledger/QA closeout after runtime evidence.
- Merge permission: BLOCKED.

## Next permitted action
Run exact static checks on latest PR #52 HEAD, then Owner retests P1/P2 log ownership. Do not merge. After BUG-039 runtime PASS, open separate `BUG-040` Prompt Manager V2 task/branch.