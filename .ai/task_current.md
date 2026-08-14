# Current Task

## Task ID
PIPELINE1-STANDARD-LONG-VIDEO-012

## Status
REVISION_2_RUNTIME_FAIL_REVISION_3_CHUNKED_AUTHORIZED

## Basis
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Revision-2 source: `6e047bf120dde6543386c50c725bf8f73418d441`.
- Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`.
- Revision-3 spec commit: `628fae6cde8ee3a9a82fb26fd65ca44acae68b66`.
- Bug: `BUG-041`.

## Fresh runtime evidence
Owner's latest ~497s Standard run shows Revision-2 behavior but exact local HEAD was not pasted.
- ASR/Vision/global reasoning PASS.
- Draft=1051 chars; global hard target=7792-8202.
- Recompose request uses target-aware output/context/timeout and no longer hits grammar HTTP 400.
- First request returns 1610 chars; deterministic hard-length gate rejects it.
- One retained-candidate retry again returns 1610 chars and fails before TTS.

## Verified root cause
One monolithic generation request is still expected to produce an ~8k narration. The model completes normally around ~1.6k twice. Further timeout/context increases are not supported by this evidence.

## Revision-3 required implementation
Authorized application source only: `src/main/p1-standard-vision-wrapper.js`.

For long targets (>~3200 chars) with >=2 Vision chunks:
1. Split chronological Vision chunks into bounded contiguous narration sections, targeting <=~1700 chars each.
2. Allocate each section's min/target/max chars by timeline duration so the joined result retains the original global hard range.
3. Filter full SRT into only blocks overlapping each section timeline.
4. Filter compact visual chunks/scenes into the same section.
5. Generate sections sequentially with section-local JSON `{ narration_script: string }`; one retained-candidate retry per section.
6. Preserve continuity using only the previous accepted tail; opening only in section 1, CTA/conclusion only in final section.
7. Join into one continuous narration and run existing global hard-length, ZERO-CJK and repetition gates.
8. No final monolithic AI rewrite; TTS only after global guard PASS.

Short/medium targets keep the current single-request path.

## Sibling UI
PR #54 is the separate per-Job Semantic Remix implementation. PR #55 does not contain that renderer source, so current global Remix UI is expected for this branch.

## Gates
- Revision-2 Owner runtime: FAIL; exact tested SHA reconfirmation pending.
- Revision-3 Execution: AUTHORIZED.
- Revision-3 Automated/static: WAITING.
- Revision-3 Code review: WAITING.
- Owner runtime: WAITING after publication.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.

## Next action
Executor/PM implements the exact remote Revision-3 spec on this branch. Unexpected source condition => STOP; do not broaden scope.
