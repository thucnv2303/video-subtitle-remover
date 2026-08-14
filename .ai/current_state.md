# Current State

## Status
PIPELINE1-STANDARD-LONG-VIDEO-012 — REVISION 1 OWNER RUNTIME FAIL / GRAMMAR ROOT CAUSE VERIFIED / REVISION 2 AUTHORIZED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Exact original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Task spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`.
- Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`.
- Exact Owner-tested Revision-1 HEAD: `10054d6b3e38667f342060e0b85ab7ea96555921`.
- Active bug: `BUG-041`.

## Owner Revision-1 runtime result — 2026-08-14
Static verification on exact `10054d6...`:
- `node --check src/main/p1-standard-vision-wrapper.js` PASS (no output/error).
- `git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD` PASS (no output/error).

Runtime on the same ~497.1s Standard video:
- ASR PASS: 7 transcript segments.
- Adaptive Vision PASS: 80 keyframes / 10 chunks; all chunks completed with `gemma4:12b`.
- Global reasoning PASS with `qwen3-coder:30b`.
- Clean draft: 853 chars; CJK/repetition quality PASS.
- Hard target: 7792-8202 chars.
- Revision-1 telemetry proved the scaling fix executed: evidence=11389 chars, estimated input≈7760 tokens, output_limit=5772, num_ctx=16384, timeout=380s.
- Recompose still failed before TTS with exact server detail: `Failed to initialize samplers: failed to parse grammar`.

This remains a Standard pre-TTS structured-output failure, not a TTS/Voice Render failure.

## Verified Revision-1 result
Revision 1 fixed the original opaque/scaling defects:
- output is no longer capped at 2200 tokens;
- context sizing is explicit and finite;
- timeout is target-aware and finite;
- Ollama server error detail is now observable.

The new exact server error localizes the remaining blocker to structured-output grammar initialization.

## Verified remaining root cause
`src/main/p1-standard-vision-wrapper.js::narrationSchema()` still places the long hard character range directly into the structured-output JSON schema as `minLength` / `maxLength`. For this run the nested `narration_script` property therefore carries a `maxLength` above 8000. Current llama.cpp upstream has a reproduced grammar-generation defect for nested string `maxLength >= 2000` that can produce the same HTTP 400 / `Failed to initialize samplers: failed to parse grammar` failure.

The hard length contract does not need to be encoded in the sampling grammar because this wrapper already validates narration length deterministically after JSON parsing.

## Revision 2 authorized correction
Allowed application source remains only `src/main/p1-standard-vision-wrapper.js`.
- Keep structured output for JSON shape only: object with required `narration_script` string, without large `minLength` / `maxLength` grammar constraints.
- Keep hard 7792-8202-style range in prompt/budget and enforce it after parsing exactly as now.
- Preserve target-aware `num_predict`, finite `num_ctx`, timeout, sanitized server errors, ZERO-CJK, repetition gates, retained-candidate retry, cancellation and TTS-after-guard ordering.
- No renderer/TTS/P2/P3/Prompt Manager/Remix/log/dependency source change.

## Sibling tasks / integration
- PR #52 log observability remains separate.
- PR #53 Prompt Manager remains separate.
- PR #54 per-Job Remix is implemented on its own sibling branch and is not contained in PR #55. Therefore a PR #55 runtime UI still shows the inherited global Remix control; that screenshot is not evidence that PR #54 implementation failed.
- A combined integration branch is required later if Owner needs all sibling fixes visible in one app build; do not mix that integration into BUG-041 while the long-video blocker is still open.

## Gates
- Execution: REVISION 2 AUTHORIZED.
- Automated/static: PASS for Revision 1 exact tested HEAD; Revision 2 WAITING after publication.
- Code review: Revision 1 PASS; Revision 2 WAITING.
- Owner manual app verification: FAIL on Revision 1 exact HEAD.
- Documentation synchronization: PARTIAL pending Revision 2 publication / bug + QA closeout.
- Merge permission: BLOCKED.

## Next permitted action
Publish narrow Revision 2 in `src/main/p1-standard-vision-wrapper.js`, review exact diff/full file, synchronize canonical docs, then Owner retests the same long-video case on the new exact HEAD. Do not rerun Vision on Revision 1 again.
