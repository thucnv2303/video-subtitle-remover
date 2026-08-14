# Current State

## Status
PIPELINE1-STANDARD-LONG-VIDEO-012 — REVISION 2 RUNTIME FAIL / REVISION 3 CHUNKED AUTHORIZED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Revision-2 application source: `6e047bf120dde6543386c50c725bf8f73418d441`.
- Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`.
- Revision-3 spec commit: `628fae6cde8ee3a9a82fb26fd65ca44acae68b66`.
- Active spec pointer updated on `51852eeedc19ba2225d69773ac2a7378b8f4c6dc`.
- Active bug: `BUG-041`.

## Fresh Owner runtime — 2026-08-14
Owner reports testing the new long-video build; exact local `git rev-parse HEAD` was not pasted, so exact tested SHA remains unverified.

Runtime facts:
- ~497.1s Standard video.
- ASR PASS: 7 transcript segments.
- Vision PASS: 80 keyframes / 10 chronological chunks.
- Global reasoning PASS: clean draft 1051 chars.
- Hard target: 7792-8202 chars.
- Revision-2 recompose telemetry: evidence=11255 chars; input≈7792 token; output_limit=5772; num_ctx=16384; timeout=380s.
- Previous grammar-init HTTP 400 is gone.
- First recompose returned 1610 chars and failed deterministic length validation.
- One retained-candidate retry again returned 1610 chars and failed before TTS.

## Verified diagnosis
The remaining failure is not timeout, context allocation, output ceiling, grammar initialization or TTS. One request is still expected to expand a ~1k draft into one ~8k continuous narration. The model completes normally but stops around ~1.6k chars twice.

## Revision 3 decision
Long Standard scripts must be composed as sequential chronological sections from local evidence, then joined and validated globally.
- Trigger only for materially long targets (>~3200 chars) with >=2 Vision chunks.
- Plan roughly <=1700 chars per section; observed 8k target / 10 chunks should produce about 5 sections.
- Allocate section budgets by timeline duration so they sum to the original global hard range.
- Each section receives only overlapping SRT + local Vision chunk/scenes, not the entire source again.
- Calls are sequential; no parallel GPU inference.
- Exactly one retained-candidate retry per section for retryable failures.
- First section handles opening; final section alone handles conclusion/CTA.
- Join to one continuous narration; then preserve global hard-length, ZERO-CJK and repetition gates.
- No monolithic final AI rewrite.
- TTS remains blocked until global `Standard duration guard PASS`.

## Semantic Remix clarification
PR #54 is the separate per-Job Semantic Remix implementation. PR #55 intentionally does not contain PR #54 renderer source, so the global Remix checkbox in the current long-video test build is expected branch isolation, not evidence that PR #54 is broken.

## Gates
- Revision-2 Execution: PASS.
- Revision-2 static: previously PASS on earlier exact test; exact current runtime-head static association is not verified in the latest message.
- Revision-2 Owner runtime: FAIL.
- Revision-3 Execution: AUTHORIZED.
- Revision-3 Automated/static: WAITING.
- Revision-3 Code review: WAITING.
- Documentation synchronization: PARTIAL until Revision-3 source + runtime/bug/QA closeout.
- Merge permission: BLOCKED.

## Next permitted action
Implement only `src/main/p1-standard-vision-wrapper.js` according to the remote Revision-3 spec, publish source commit, then PM reviews exact diff/full file before Owner retest.
