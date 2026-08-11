# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience, runtime feedback, malformed-output, cross-job GPU-resource, and native-file-path compatibility blockers before Step 3.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Latest Owner-tested head before file-path compatibility expansion: `51c35e7841b5e44b7571e7fc35390e517bfaa702`.
- Latest reviewed source before this expansion: `fc807c9daa38df62fb885f2c4ff7db4fde4623f3`.

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
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
13. TTS model release happens after the TTS burst, not once per segment.
14. Feedback synchronization does not create MutationObserver churn.
15. run-UX is reachable from real boot path and selectors match generated Job DOM.
16. P1 interaction logic respects `pipeline-state.js` canonical `p1Status`.
17. Drag/drop and renderer File-input paths on Electron 32+ resolve to the real absolute filesystem path using `webUtils.getPathForFile`; a bare filename must never be accepted as a runnable video path.
18. Native dialog `filePaths` behavior remains unchanged.
19. The compatibility adapter must not broaden filesystem access beyond File objects explicitly supplied by the user.

## Owner evidence driving current expansion
- Owner runtime on head `51c35e78...` shows preview request `GET /api/video-info?path=vn-...mp4` and P1 ASR immediately returning `Video file not found` for both Jobs.
- The log proves the renderer Job stored a bare filename instead of an absolute path.
- `app.js` drag/drop and HTML-input fallback use `f.path || f.name`.
- Repository uses Electron `^33.0.0`; Electron removed the non-standard Web `File.path` property in Electron 32 and replaced it with renderer `webUtils.getPathForFile(file)`.
- Native Electron `dialog.showOpenDialog()` already returns `filePaths`; this correction is specifically for Web `File` objects used by drag/drop/fallback input.

## Non-goals
No P2/P3/STTN/Settings changes. No broad app/preload/pipeline-state/backend refactor. No dependency churn. No replacing Ollama/OmniVoice architecture.

## Current correction chain
- `332a3460...`: preload loads run-UX.
- `eb9eaf11...`: bind actual status DOM.
- `ecf2a10...`: use canonical P1 state and stable retry state.
- `c4cfdae6...`: exact failure detail + popup retry.
- `05697633...`: remove whole-card pulse; spinner remains the only processing animation.
- `fc807c9d...`: reasoning/token/VRAM resilience revision.

## Verification required
- `node --check` for changed JavaScript.
- Python syntax/compile check for changed Python when Python source changes.
- `git diff --check` or exact changed-file equivalent.
- Source review confirms File-path bridge calls only `webUtils.getPathForFile(file)` on a user-supplied Web `File` object.
- Owner runtime: drag two videos into the app; preview backend requests must contain absolute paths (e.g. drive-qualified Windows path), and P1 ASR must progress past `Video file not found`.
- Existing stress sequence remains required after path fix: clone-TTS Job completes → `test3.mp4` runs → reasoning completes or fails with bounded explicit diagnostic.
- Owner verifies card/badge is steady while only spinner rotates.

## Merge
BLOCKED until required verification, fresh Owner runtime PASS, documentation sync and explicit PM approval.
