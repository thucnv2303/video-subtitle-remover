# Current Task

## Task ID
PIPELINE1-STANDARD-LONG-VIDEO-012

## Status
SOURCE_REVISION_2_PUBLISHED_CODE_REVIEW_WAITING_STATIC_WAITING_OWNER_RETEST_WAITING

## Basis
- Exact original failing branch/head: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`.
- Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`.
- Exact Owner-tested Revision-1 HEAD: `10054d6b3e38667f342060e0b85ab7ea96555921`.
- Source Revision 2: `6e047bf120dde6543386c50c725bf8f73418d441`.
- Bug: `BUG-041`.

## Owner Revision-1 evidence
Static PASS on exact tested HEAD. Runtime on the same ~497.1s Standard video reached the new target-aware recompose telemetry (`output_limit=5772`, `num_ctx=16384`, `timeout=380s`) but Ollama rejected sampler initialization with `Failed to initialize samplers: failed to parse grammar` before TTS.

## Revision 2 correction
Authorized source scope remains only `src/main/p1-standard-vision-wrapper.js`.
- Structured-output schema now constrains only JSON shape: required `narration_script` string.
- Large `minLength` / `maxLength` are removed from the Ollama grammar path.
- Hard narration range remains in prompt/budget and is still enforced deterministically after JSON parse.
- Revision-1 output/context/timeout/error-observability fixes remain.
- ZERO-CJK, repetition, retained-candidate retry, cancellation and TTS-after-guard ordering remain fail-closed.

## Sibling feature note
PR #54 contains the per-Job Semantic Remix control. PR #55 does not include that sibling renderer source, so PR #55 runtime still showing the inherited global Remix checkbox is expected branch isolation, not a failure of PR #54.

## Required verification
```text
git rev-parse HEAD
node --check src/main/p1-standard-vision-wrapper.js
git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD
```

Then retest the same/equivalent ~497s Standard case. Expected sequence: underfilled draft -> Standard duration recompose -> no grammar-init HTTP 400 -> accepted hard-range narration -> `Standard duration guard PASS` -> exactly one TTS start.

## Gates
- Execution: PASS for Revision 2 publication.
- Automated/static: WAITING on final Revision-2 HEAD.
- Code review: WAITING for Revision 2.
- Owner runtime: FAIL on Revision 1; Revision-2 retest WAITING.
- Documentation synchronization: PARTIAL pending final review/runtime closeout.
- Merge: BLOCKED.

## Next action
PM reviews Revision-2 diff/full file and PR state, then Owner updates the existing LONG012 worktree to the new exact head, runs static checks and retests the long Standard video.
