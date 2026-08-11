# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Resilience, File-Path Compatibility, Reasoning/GPU Resilience, Spinner Stability, and Vision Output Resilience

## Status
SPINNER_VISION_REVISION_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest Owner-tested head: `5bfe88fa179b297d6fc8ba906a7f3c9a788acd3c`.
- Latest reviewed source: `4f8b6737337abf488e49c58853b5ad3715fdeb7d`.
- PM review: `4903882317`.

## Owner-confirmed state
- Multi-job failure isolation: PASS.
- Failed Job popup reachable: PASS.
- Absolute input path compatibility: PASS in latest runtime (`F:\test3.mp4`, ASR/frame reads succeed).
- OmniVoice idle release log: PASS in latest runtime.
- Spinner smoothness: FAIL on Owner-tested head; still visibly jerks.
- Second Job vision: FAIL because gemma4 structured output hits fixed 1200-token cap.
- qwen post-TTS stress result: still WAITING because second Job does not yet pass vision.

## Current implementation
1. Processing card remains steady; only spinner animates.
2. Replacement spinner nodes receive a time-based phase so legacy Job-card rerenders do not restart rotation from zero.
3. Fallback vision budget scales only with keyframe count: `min(2200, 1200 + frameCount*100)`; 8 keyframes use 2000.
4. Vision prompt explicitly limits scene and evidence verbosity while retaining the required schema.
5. Phase/model is returned separately from normalized error text to avoid duplicated popup prefixes.
6. Reasoning remains finite at 360 seconds with at most one reasoning-only repair.
7. OmniVoice idle release, Electron file-path bridge, retry/queue isolation, Stop/Cancel guards and canonical P1 status logic remain preserved.

## Verification
- GitHub incremental scope from Owner-tested head is limited to task spec + `src/main/p1-vision-ipc.js` + `src/main/preload.js` + `src/renderer/js/pipeline1-spinner-phase.js` + `src/renderer/styles/pipeline1-run-ux.css`.
- PM source review PASS `4903882317`.
- No unresolved inline threads.
- GitHub CI/status checks: none configured.
- Automated/static gate remains PARTIAL for this exact revision.

## Owner retest acceptance
- Spinner rotates continuously with no visible restart/jump while Job UI updates.
- For 8 keyframes, vision progress reports `output_limit=2000 token` and passes the prior 1200-token truncation point.
- If vision still cannot complete, failure is bounded and explicit; no infinite retry.
- Error popup shows `Vision analysis / gemma4:12b` only once.
- After vision succeeds, `test3.mp4` reaches qwen reasoning and completes or fails within the finite timeout with exact detail.
- Existing popup retry and queue-behind-active behavior remain usable.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner PARTIAL PASS / RETEST REQUIRED; documentation sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.
