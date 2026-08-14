# AgentOS Handoff Status

## Active task
`PIPELINE1-STANDARD-LONG-VIDEO-012`

## Status
REVISION 2 SOURCE PUBLISHED / PM REVIEW WAITING / STATIC WAITING / OWNER LONG-VIDEO RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Original failing runtime basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
- Spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`
- Revision-1 source: `0547593fa7de7986d2202683847b27bf1e26ec42`
- Exact Owner-tested Revision-1 HEAD: `10054d6b3e38667f342060e0b85ab7ea96555921`
- Revision-2 source: `6e047bf120dde6543386c50c725bf8f73418d441`
- Bug: `BUG-041`

## Revision-1 Owner result
Static checks PASS on the exact tested HEAD. Runtime on the same ~497.1s Standard source completed ASR, 10 Vision chunks and global reasoning, then correctly entered the scaled recompose path with `output_limit=5772`, `num_ctx=16384`, `timeout=380s`. Ollama rejected structured-output sampler initialization with `Failed to initialize samplers: failed to parse grammar` before TTS.

## Revision-2 source
Only `src/main/p1-standard-vision-wrapper.js` changes application behavior.
- The Ollama structured-output schema now carries only the required JSON shape and a plain string field.
- Large narration `minLength` / `maxLength` are no longer compiled into grammar.
- Hard narration length is still checked deterministically after parsing.
- Target-aware `num_predict`, finite context buckets, scaled timeout, sanitized server error detail, ZERO-CJK, repetition gates, retry and cancellation remain.

## Separate sibling work
PR #54 implements the requested per-Job Semantic Remix UI. PR #55 is based on PR #52 and intentionally does not contain PR #54 source. Therefore the Owner screenshot from PR #55 showing the old global Semantic Remix checkbox is expected for this isolated corrective branch. A later explicit integration branch must combine sibling fixes; do not mix them while BUG-041 remains under runtime correction.

## Evidence still required
- PM Revision-2 diff/full-file review.
- Exact final-head Node syntax check.
- Exact final-head `git diff --check`.
- Owner long-video Standard retest proving grammar initialization succeeds and TTS starts only after `Standard duration guard PASS`.
- Listening/grounding check if TTS completes.

## Gates
- Execution: PASS for Revision 2 publication.
- Automated/static: WAITING.
- Code review: WAITING for Revision 2.
- Owner runtime: Revision 1 FAIL; Revision 2 WAITING.
- Documentation synchronization: PARTIAL pending final review/runtime closeout.
- Merge: BLOCKED.

## Next permitted action
PM reviews current PR #55 source and exact head. If review passes, Owner updates the clean LONG012 worktree to the current remote head and reruns the approved static/runtime acceptance. No further source revision without new evidence.
