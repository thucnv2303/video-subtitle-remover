# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience, runtime feedback, malformed-output, cross-job GPU-resource, native-file-path compatibility, spinner stability, and bounded vision-output blockers before Step 3.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Latest Owner-tested head before spinner/vision expansion: `5bfe88fa179b297d6fc8ba906a7f3c9a788acd3c`.
- Latest source before this spec update: `be001acefb9b70b22dd545026f3fd8c6aaeb9d91`.

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipeline1-spinner-phase.js` — narrow spinner phase continuity adapter only.
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/styles/pipeline1-run-ux.css`
- `src/main/preload.js` — narrow runtime loading / safe native-file-path bridge only.
- `src/renderer/js/file-path-compat.js` — narrow Electron 32+ File.path compatibility adapter only.
- `src/main/p1-vision-ipc.js` — narrow Ollama output/timeout/truncation/resource telemetry only.
- `api/tts_engine.py` — narrow OmniVoice model release helper only.
- `api/server.py` — narrow release of TTS GPU resources after a complete `/api/tts-retry` request only.
- canonical `.ai/` state/task/QA/spec files.

## Required behavior
1. Selected/detail state follows actual processing Job.
2. Processing Job is visually distinct, but the card/badge stays visually steady; only the spinner rotates.
3. Spinner rotation must remain visually continuous even when legacy Job-list rendering replaces the status DOM node during processing.
4. Failed Job does not stop later queued Jobs.
5. Failed Job remains visibly failed; click opens readable exact error detail.
6. Failed Job exposes `↻ Chạy lại`, including a stable action inside the popup.
7. Retry while another P1 Job is processing queues behind active Job and does not preempt/cancel it.
8. Retry while idle starts through normal P1 queue path.
9. Popup uses safe text-only rendering.
10. Stop/Cancel does not revive explicitly stopped work.
11. Malformed/truncated reasoning output is bounded and diagnosable; do not silently retry indefinitely.
12. Vision analysis output must also have enough bounded headroom for the configured structured JSON schema; a normal 8-keyframe response must not fail merely because of the previous fixed 1200-token ceiling.
13. Reasoning timeout remains finite and reports a specific timeout rather than appearing permanently hung.
14. A completed clone-TTS request must release OmniVoice GPU model/cache before the next P1 Ollama reasoning job can contend for the same GPU.
15. TTS model release happens after the TTS burst, not once per segment.
16. Feedback synchronization does not create MutationObserver churn.
17. run-UX is reachable from real boot path and selectors match generated Job DOM.
18. P1 interaction logic respects `pipeline-state.js` canonical `p1Status`.
19. Drag/drop and renderer File-input paths on Electron 32+ resolve to the real absolute filesystem path using `webUtils.getPathForFile`; a bare filename must never be accepted as a runnable video path.
20. Native dialog `filePaths` behavior remains unchanged.
21. The compatibility adapter must not broaden filesystem access beyond File objects explicitly supplied by the user.
22. Error popup must show phase/model once, without duplicated `phase / model: phase / model:` prefixes.

## Owner evidence driving current expansion
- Owner runtime on `5bfe88fa...` proves file-path compatibility now works: `test3.mp4` is read from `F:\test3.mp4`, ASR succeeds, keyframes load, and the prior `Video file not found` blocker is gone.
- The first Job completes vision/reasoning/TTS; OmniVoice release is logged before the second Job vision phase, supporting the resource-release correction.
- The second Job then fails specifically at `Vision analysis / gemma4:12b` because output reaches the fixed `1200` token ceiling before JSON closes.
- Source confirms fallback vision used a hard `numPredict: 1200` despite an 8-scene structured schema.
- Owner also reports spinner rotation still visibly jerks. Source confirms legacy `renderJobList()` rebuilds Job-card DOM during processing, which restarts a CSS animation attached to the replaced status node.

## Non-goals
No P2/P3/STTN/Settings changes. No broad app/pipeline-state/backend refactor. No dependency churn. No replacing Ollama/OmniVoice architecture.

## Current correction chain
- `332a3460...`: preload loads run-UX.
- `eb9eaf11...`: bind actual status DOM.
- `ecf2a10...`: use canonical P1 state and stable retry state.
- `c4cfdae6...`: exact failure detail + popup retry.
- `05697633...`: remove whole-card pulse; spinner remains the only processing animation.
- `fc807c9d...`: reasoning/token/VRAM resilience revision.
- `37e6e46a...`: Electron native-file-path compatibility.
- `be001ace...`: bounded vision-token headroom and non-duplicated IPC error detail; CSS prepared for phase continuity.

## Verification required
- `node --check` for changed JavaScript.
- Python syntax/compile check for changed Python when Python source changes.
- `git diff --check` or exact changed-file equivalent.
- Source review confirms vision budget is bounded and scales only with keyframe count.
- Source review confirms spinner phase adapter only adjusts animation phase on the processing status node and does not mutate Job state.
- Owner runtime: spinner rotates smoothly while Job card DOM continues to update.
- Owner runtime: same two-Job sequence; second Job must progress past prior 1200-token vision truncation, or fail with a different bounded/explicit diagnostic.
- Existing clone-TTS → `test3.mp4` reasoning stress acceptance remains required.

## Merge
BLOCKED until required verification, fresh Owner runtime PASS, documentation sync and explicit PM approval.
