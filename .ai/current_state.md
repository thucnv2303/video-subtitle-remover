# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — SPINNER / VISION TRUNCATION REVISION CODE REVIEW PASS / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest Owner-tested head: `5bfe88fa179b297d6fc8ba906a7f3c9a788acd3c`.
- Latest reviewed source commit: `4f8b6737337abf488e49c58853b5ad3715fdeb7d`.
- PM incremental review: `4903882317`.

## Latest Owner runtime evidence — 2026-08-11
- Electron file-path correction is runtime effective: `test3.mp4` is now accessed as `F:\test3.mp4`; video-info/frame endpoints return 200 and ASR succeeds with 16 lines.
- First Job completes vision + qwen reasoning + clone TTS and produces P1 artifacts.
- `[TTS] OmniVoice released after idle TTS burst.` is observed before the second Job vision phase.
- Second Job no longer fails on path validation; it fails specifically in fallback `Vision analysis / gemma4:12b` because structured output reaches the fixed 1200-token limit before JSON closes.
- Owner reports the processing spinner still visibly jerks even though whole-card pulse is gone.
- Error popup currently duplicates the phase/model prefix.

## Verified source causes
1. Fallback vision used a hard `numPredict: 1200` with an 8-keyframe structured schema.
2. Legacy `renderJobList()` rebuilds Step-1 Job-card DOM repeatedly during processing, restarting CSS animation on replacement spinner nodes.
3. IPC error text already embedded phase/model while renderer prefixed them again.

## Current correction
- `p1-vision-ipc.js`: bounded keyframe-sensitive vision budget; 8 frames => 2000 tokens, max 2200; stricter concise vision contract; duplicate phase/model error text normalized.
- `pipeline1-spinner-phase.js`: renderer-only phase adapter assigns replacement processing status nodes the current 750ms animation phase.
- `pipeline1-run-ux.css`: spinner consumes `--p1-spinner-phase`; card remains steady.
- `preload.js`: loads the spinner phase adapter through the real app boot path.
- Prior file-path, failure-isolation, popup/retry, reasoning repair, timeout, and OmniVoice-release changes remain present.

## Verification
- GitHub compare `5bfe88fa...` -> `4f8b6737...` contains only active-task spec plus four approved application source files.
- PM incremental source review PASS `4903882317`.
- No unresolved inline review threads.
- GitHub status checks are not configured; no CI PASS claimed.
- Full Electron runtime/static suite for this exact revision has not been executed by PM; automated/static gate remains PARTIAL.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL.
- Code review: PASS for `4f8b6737...`.
- Owner manual verification: PARTIAL PASS / RETEST REQUIRED.
- Documentation synchronization: PASS after publication of this docs commit.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner retests latest PR #44 head. Required remaining evidence: spinner rotation is continuous; `test3.mp4` passes the previous 1200-token vision failure and then reaches qwen reasoning; popup phase/model is not duplicated; qwen completes or fails with the existing finite diagnostic. Do not proceed to Step 3 until these are resolved.
