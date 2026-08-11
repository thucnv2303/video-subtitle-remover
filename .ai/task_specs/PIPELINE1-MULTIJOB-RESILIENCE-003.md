# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience, runtime feedback, malformed-output, and cross-job GPU-resource blockers before Step 3.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Latest Owner-tested head before this scope expansion: `a251bf872e189981e7cf2b13d1163fd004a87c5b`.
- Latest UI source correction: `056976336e3cef0b8d60d11186052e60361a1a9b`.

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/styles/pipeline1-run-ux.css`
- `src/main/preload.js` — narrow runtime loading only.
- `src/main/p1-vision-ipc.js` — narrow Ollama output/timeout/truncation/resource telemetry only.
- `api/tts_engine.py` — narrow OmniVoice model release helper only.
- `api/server.py` — narrow release of TTS GPU resources after a complete `/api/tts-retry` request only.
- canonical `.ai/` state/task/QA/spec files.

## Required behavior
1. Selected/detail state follows actual processing Job.
2. Processing Job is visually distinct, but the card/badge stays visually steady; only the spinner rotates.
3. Failed Job does not stop later queued Jobs.
4. Failed Job remains visibly failed; click opens readable exact error detail.
5. Failed Job exposes `↻ Chạy lại`, including a stable action inside the popup.
6. Retry while another P1 Job is processing queues behind active Job and does not preempt/cancel it.
7. Retry while idle starts through normal P1 queue path.
8. Popup uses safe text-only rendering.
9. Stop/Cancel does not revive explicitly stopped work.
10. Malformed/truncated reasoning output is bounded and diagnosable; do not silently retry indefinitely.
11. Reasoning timeout remains finite and reports a specific timeout rather than appearing permanently hung.
12. A completed clone-TTS request must release OmniVoice GPU model/cache before the next P1 Ollama reasoning job can contend for the same GPU.
13. TTS model release happens once after the overall TTS request, not once per segment.
14. Feedback synchronization does not create MutationObserver churn.
15. run-UX is reachable from real boot path and selectors match generated Job DOM.
16. P1 interaction logic respects `pipeline-state.js` canonical `p1Status`.

## Owner evidence driving this expansion
- Multi-job fault isolation PASS: after the first Job failed, the next Job automatically ran and completed.
- `test3.mp4` previously failed with malformed JSON near the configured reasoning output ceiling.
- On retry after a previous clone-TTS Job completed, qwen3-coder:30b began output but remained in reasoning for 336s; current code timeout is 360s.
- Source inspection shows OmniVoice is cached in a module-global `_model` and is not explicitly released after clone TTS, while Ollama reasoning uses the same local GPU.
- This supports a strong GPU-contention hypothesis that requires a narrow release fix and fresh runtime verification; it is not yet treated as runtime-proven root cause.

## Non-goals
No P2/P3/STTN/Settings changes. No broad app/preload/pipeline-state/backend refactor. No dependency churn. No replacing Ollama/OmniVoice architecture.

## Current correction chain
- `332a3460...`: preload loads run-UX.
- `eb9eaf11...`: bind actual status DOM.
- `ecf2a10...`: use canonical P1 state and stable retry state.
- `c4cfdae6...`: exact failure detail + popup retry.
- `05697633...`: remove whole-card pulse; spinner remains the only processing animation.

## Verification required
- `node --check` for changed JavaScript.
- Python syntax/compile check for changed Python.
- `git diff --check` or exact changed-file equivalent.
- Source review confirms no per-segment TTS model unload/reload loop.
- Source review confirms finite reasoning timeout and explicit truncation/timeout reporting.
- Owner runtime sequence: clone-TTS Job completes → `test3.mp4` runs → reasoning completes or fails with bounded explicit diagnostic, without multi-minute unexplained stall.
- Owner verifies card/badge is steady while only spinner rotates.

## Merge
BLOCKED until required verification, fresh Owner runtime PASS, documentation sync and explicit PM approval.
