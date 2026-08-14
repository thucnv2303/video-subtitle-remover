# AgentOS Handoff Status

## Active task
`PIPELINE1-STANDARD-LONG-VIDEO-012`

## Status
REVISION 2 OWNER RUNTIME FAIL / REVISION 3 CHUNKED STANDARD AUTHORIZED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- Revision-2 source: `6e047bf120dde6543386c50c725bf8f73418d441`
- Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`
- Revision-3 spec commit: `628fae6cde8ee3a9a82fb26fd65ca44acae68b66`
- Active pointer commit: `51852eeedc19ba2225d69773ac2a7378b8f4c6dc`
- Bug: `BUG-041`

## Fresh Owner evidence
Latest ~497s Standard run completed ASR, 10 Vision chunks and global reasoning. The previous grammar-init failure is gone. Recompose telemetry shows `output_limit=5772`, `num_ctx=16384`, `timeout=380s`, then the model returns only 1610 chars against hard target 7792-8202. The one retained-candidate retry again returns 1610 chars and fails before TTS.

Exact local HEAD was not pasted in this latest message; before any Owner PASS the tested SHA must be reconfirmed.

## PM diagnosis
The active blocker is one-shot long-generation decomposition. The model is finishing normally, not timing out or hitting the output limit, but it does not honor an ~8k single-call target. Raising timeout/context again is not justified.

## Revision-3 design
- Long targets >~3200 chars + >=2 Vision chunks use sequential section composition.
- Aim <=~1700 chars per section; observed 10-chunk / ~8k case should produce about 5 chronological sections.
- Allocate section min/target/max proportionally to section timeline duration.
- Each section gets only overlapping SRT + local visual chunks/scenes.
- Calls remain sequential; one retained-candidate retry per section.
- Opening only in first section; conclusion/CTA only in final section.
- Join to one continuous narration and run the existing global hard-length + ZERO-CJK + repetition gates.
- No final monolithic AI rewrite.
- TTS remains after global `Standard duration guard PASS` only.

## Source boundary
Revision-3 application changes are limited to `src/main/p1-standard-vision-wrapper.js`. Do not touch `p1-standard-vision-ipc.js`, renderer, TTS, P2/P3, Prompt Manager, Remix, log routing, or dependencies.

## Semantic Remix sibling
PR #54 contains the requested per-Job Semantic Remix implementation. PR #55 intentionally does not contain PR #54 renderer source, so the global Remix checkbox in the current long-video build is expected. A combined integration build must be a later explicit task after BUG-041 source is stable.

## Gates
- Revision-2 Owner runtime: FAIL.
- Revision-3 Execution: AUTHORIZED.
- Revision-3 Automated/static: WAITING.
- Revision-3 Code review: WAITING.
- Owner runtime: WAITING after source publication.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.

## Next permitted action
Fetch remote branch, read `.ai/task_specs/ACTIVE.md` and the exact Revision-3 spec, implement only the authorized wrapper source, commit/push source separately, then stop for PM review.
