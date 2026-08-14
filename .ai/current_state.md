# Current State

## Status
PIPELINE1-STANDARD-LONG-VIDEO-012 — SOURCE REVISION 2 PUBLISHED / PM REVIEW WAITING / STATIC WAITING / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Exact original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Task spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`.
- Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`.
- Exact Owner-tested Revision-1 HEAD: `10054d6b3e38667f342060e0b85ab7ea96555921`.
- Source Revision 2: `6e047bf120dde6543386c50c725bf8f73418d441`.
- Active bug: `BUG-041`.

## Owner Revision-1 runtime result — 2026-08-14
Static verification on exact `10054d6...` PASS. Runtime on the same ~497.1s Standard video completed ASR, 80-keyframe/10-chunk Vision, and global reasoning. The clean 853-char draft triggered the hard target `7792-8202` recompose with Revision-1 telemetry: evidence=11389 chars, estimated input≈7760 tokens, output_limit=5772, num_ctx=16384, timeout=380s.

Revision 1 still failed before TTS with exact Ollama server reason:
`Failed to initialize samplers: failed to parse grammar`.

## Verified Revision-1 outcome
Revision 1 successfully fixed the original scaling/observability defects:
- no fixed 2200-token recompose ceiling;
- explicit finite context sizing;
- target-aware finite timeout;
- exact sanitized Ollama error detail instead of opaque HTTP 400.

The remaining blocker was therefore localized to structured-output grammar initialization.

## Revision-2 source state
Only `src/main/p1-standard-vision-wrapper.js` changes application behavior.
- Ollama structured-output schema now constrains only JSON shape: object + required `narration_script` plain string.
- Large narration `minLength` / `maxLength` are removed from the sampler grammar path.
- Hard narration range remains in prompt/budget and is still enforced deterministically after JSON parse.
- Revision-1 target-aware output/context/timeout/error-observability changes remain.
- ZERO-CJK, repeated sentence, near-duplicate, repeated 10-word phrase, bounded retained-candidate retry, cancellation, and TTS-after-guard ordering remain fail-closed.

## Sibling tasks / integration
- PR #52 log observability remains separate.
- PR #53 Prompt Manager remains separate.
- PR #54 per-Job Semantic Remix is a sibling implementation and is not contained in PR #55. Therefore the Owner screenshot from PR #55 showing the inherited global Semantic Remix control is expected branch isolation, not evidence that PR #54 failed.
- A later explicit integration branch will be needed to combine sibling fixes into one Owner build after BUG-041 is stable.

## Gates
- Execution: PASS for Revision 2 publication.
- Automated/static: WAITING on current Revision-2 final head.
- Code review: WAITING for Revision 2.
- Owner manual app verification: Revision 1 FAIL; Revision 2 RETEST WAITING.
- Documentation synchronization: PARTIAL pending PM review, bug/QA ledger update and Owner runtime closeout.
- Merge permission: BLOCKED.

## Next permitted action
PM reviews the current PR #55 diff/full source and exact head. If PASS, Owner updates the existing LONG012 worktree to the new remote head, runs exact static checks, then retests the same/equivalent ~497s Standard video. No further source revision without new runtime evidence.
