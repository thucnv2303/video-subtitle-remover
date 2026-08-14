# Active PM Execution Spec

Status: PIPELINE1_STANDARD_LONG_VIDEO_012_REVISION_3_CHUNKED_AUTHORIZED

Task: `PIPELINE1-STANDARD-LONG-VIDEO-012`
Repository: `thucnv2303/video-subtitle-remover`
Original failing runtime basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
Corrective review branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
Revision-2 application source: `6e047bf120dde6543386c50c725bf8f73418d441`
Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`
Revision-3 spec commit: `628fae6cde8ee3a9a82fb26fd65ca44acae68b66`
Bug: `BUG-041`

## Fresh Owner runtime evidence
Owner ran the same ~497s Standard case on a build showing Revision-2 telemetry. Exact local HEAD was not pasted, so exact tested SHA still requires reconfirmation before any Owner PASS can be recorded.

Observed:
- ASR PASS, 80-keyframe/10-chunk Vision PASS, global reasoning PASS.
- Clean draft: 1051 chars.
- Global hard target: 7792-8202 chars.
- Recompose telemetry: evidence=11255 chars, input≈7792 token, output_limit=5772, num_ctx=16384, timeout=380s.
- Grammar-init HTTP 400 no longer occurs.
- First recompose returned 1610 chars and failed `NARRATION_LENGTH_OUT_OF_BUDGET`.
- Retained-candidate retry again returned 1610 chars and failed before TTS.

## Verified diagnosis
The remaining blocker is architectural: one reasoning call is still asked to author the entire ~8k-char narration. The model completes normally but produces ~1.6k chars. Increasing timeout/context again is not justified by this evidence.

## Revision-3 product decision
For long Standard narration targets, compose sequential chronological sections from local timeline evidence, then join and run the existing global deterministic gates before TTS.

Required properties:
- long-mode trigger only for materially long targets (>~3200 chars) with >=2 Vision chunks;
- roughly <=1700 target chars per section; observed 8k/10-chunk case should plan about 5 chronological sections;
- section budgets allocated proportionally to timeline duration and sum to the original global hard range;
- local SRT + local chunk/scenes only per section, not full source repeated into every call;
- sequential Ollama requests only;
- exactly one retained-candidate retry per section for retryable contract failures;
- only first section may open; only final section may conclude/CTA;
- joined result must pass original global hard length, ZERO-CJK and repetition gates;
- no monolithic final AI rewrite;
- TTS remains after `Standard duration guard PASS` only.

## Source scope
Revision 3 application source is restricted to:
- `src/main/p1-standard-vision-wrapper.js`

Do not modify renderer, TTS, P2/P3, Prompt Manager, Remix, log routing, dependencies, or `p1-standard-vision-ipc.js`.

## Separate sibling feature
PR #54 remains the per-Job Semantic Remix implementation. PR #55 does not contain that sibling renderer source, so global Remix in the current PR #55 UI is expected branch isolation. Do not merge PR #54 into this corrective source task.

## Gates
- Revision-2 runtime: FAIL; exact tested SHA reconfirmation pending.
- Revision-3 Execution: AUTHORIZED.
- Revision-3 Automated/static: WAITING.
- Revision-3 Code review: WAITING.
- Owner runtime: WAITING after source publication.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.

## Next permitted action
Implement Revision 3 exactly from the remote spec, publish a source-only commit, then PM reviews diff/full source before Owner retest.
