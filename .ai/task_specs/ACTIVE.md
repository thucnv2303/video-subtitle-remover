# Active PM Execution Spec

Status: PIPELINE1_STANDARD_LONG_VIDEO_012_SOURCE_REVISION_2_OWNER_RETEST_WAITING

Task: `PIPELINE1-STANDARD-LONG-VIDEO-012`
Repository: `thucnv2303/video-subtitle-remover`
Original failing runtime basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
Corrective review branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
Task spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012.md`
Spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`
Revision-1 source: `0547593fa7de7986d2202683847b27bf1e26ec42`
Exact Owner-tested Revision-1 HEAD: `10054d6b3e38667f342060e0b85ab7ea96555921`
Revision-2 source: `6e047bf120dde6543386c50c725bf8f73418d441`
Bug: `BUG-041`

## Revision-1 Owner evidence
Static checks PASS. Runtime reached target-aware recompose telemetry (`output_limit=5772`, `num_ctx=16384`, `timeout=380s`) but Ollama returned HTTP 400 with exact server reason `Failed to initialize samplers: failed to parse grammar` before TTS.

## Revision-2 correction
- Structured-output grammar now validates JSON shape only: required `narration_script` string.
- Large hard character `minLength`/`maxLength` are removed from the grammar path.
- Hard narration range is still enforced in the prompt/budget and after JSON parse.
- Existing output/context/timeout/error telemetry, ZERO-CJK, repetition, retained-candidate retry, cancellation and TTS-after-guard behavior remains.

## Required Owner retest
1. Update the existing clean LONG012 worktree to the exact current remote head without touching the dirty root worktree.
2. Confirm `git rev-parse HEAD` equals the current PR #55 head.
3. Run `node --check src/main/p1-standard-vision-wrapper.js`.
4. Run `git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD`.
5. Run the same/equivalent ~497s Standard video.
6. Expected: recompose starts with target-aware telemetry and does NOT fail during grammar initialization.
7. Success path: accepted hard-range narration -> `Standard duration guard PASS` -> exactly one TTS start.
8. If it still fails, capture from `Standard duration guard:` through the final error.

## Separate tasks
PR #52 log observability, PR #53 Prompt Manager and PR #54 per-Job Remix remain separate. PR #55 intentionally does not contain PR #54 renderer source. Do not judge the per-Job Remix UI from a PR #55 runtime build.

## Merge
BLOCKED.
