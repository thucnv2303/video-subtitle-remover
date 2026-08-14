# AgentOS Handoff Status

## Active task
`PIPELINE1-STANDARD-LONG-VIDEO-012`

## Status
SOURCE REVISION 1 PUBLISHED / PM CODE REVIEW PASS / STATIC WAITING / OWNER LONG-VIDEO RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Failing runtime basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- Corrective branch: `review/PIPELINE1-STANDARD-LONG-VIDEO-012`
- Spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`
- Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`
- Bug: `BUG-041`

## Verified failure
Owner tested a ~497.1s Standard video on the exact failing HEAD. ASR, adaptive Vision (80 frames / 10 chunks) and global reasoning all completed. The clean 922-char narration draft triggered the correct Standard duration guard for target 7792-8202 chars, but the grounded recompose request returned HTTP 400 before TTS.

## Verified root cause class
The long-video Standard wrapper combined a large input request with a fixed 2200 output-token ceiling, no explicit runtime context allocation, fixed 150s generation timeout and opaque non-2xx errors.

## Revision 1
Only `src/main/p1-standard-vision-wrapper.js` changes application behavior:
- compact chronological visual evidence with representative scenes across chunks;
- target-aware generation ceiling up to 8192 tokens;
- explicit finite `num_ctx` bucket 8K/16K/32K based on conservative estimated request + output headroom;
- finite scaled timeout up to 420s;
- sanitized Ollama error body on non-2xx;
- existing hard length, ZERO-CJK, repetition, grounded source, retry and cancellation guards retained.

## Evidence still required
- exact `node --check` on current final HEAD;
- exact `git diff --check 6bc43e6...HEAD`;
- Owner retest on same/equivalent ~497s Standard video;
- listening/grounding check if guard and TTS complete.

## Sibling work
PR #52 log, PR #53 Prompt Manager, and PR #54 per-Job Remix stay separate. Do not mix their source into this corrective branch.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: PARTIAL pending bug/QA/runtime closeout.
- Merge: BLOCKED.

## Next permitted action
Verify the exact corrective HEAD locally, then run the ~497s Standard case. If it still fails, capture the new `Standard duration recompose` telemetry and exact sanitized Ollama server error; no speculative second source revision.
