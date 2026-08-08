# RECOVERY-007 Preflight Report

## 1. Git Basis
- **Branch:** rescue/wip-20260803
- **HEAD:** d67a427
- **Relevant tracked files modified in working tree:** `api/server.py`, `src/renderer/js/api.js`, `src/renderer/js/app.js` (along with several others like `package.json`, `main.js`, `index.html`).
- **Relevant untracked files:** `src/renderer/js/pipelines/*`, `src/renderer/js/components/*`, patch scripts.
- **Staged files:** None.
- **Confirmation:** No source code was modified by this preflight.

## 2. Active Step 1 Controls
- **`#btn-upload-step1`**: 
  - Existence: Confirmed in `index.html`.
  - Event listener: Attached via `app.js`.
  - Handler function: `selectFile()`.
  - Handler file: `src/renderer/js/app.js`.
  - Reachability: Active and clickable.
  - Approx line: `app.js:296`.
  - Repository state: TRACKED + MODIFIED.
- **`#btn-start-all`**:
  - Existence: Confirmed in `index.html`.
  - Event listener: Attached via `app.js`.
  - Handler function: Anonymous function wrapping `processNextJob()`.
  - Handler file: `src/renderer/js/app.js`.
  - Reachability: Active and clickable.
  - Approx line: `app.js:547`.
  - Repository state: TRACKED + MODIFIED.
- **`#btn-open-file`** and **`#btn-start`**: These are explicitly Pipeline 2 (Step 2) controls and remain bound to `selectFile()` and `processNextJob()` respectively.

## 3. Exact Current Call Path
| Step | File | Symbol | Line Range | Repo State | Status |
|---|---|---|---|---|---|
| Step 1 upload | `app.js` | `selectFile` | ~161 | TRACKED+MODIFIED | ACTIVE |
| Job object creation | `app.js` | `jobs[id] = {...}` | ~351 | TRACKED+MODIFIED | ACTIVE |
| Step 1 start | `app.js` | `#btn-start-all` click | ~547 | TRACKED+MODIFIED | ACTIVE |
| API wrapper | `api.js` | `api.process(job)` | ~23 | TRACKED+MODIFIED | ACTIVE |
| HTTP route | `server.py` | `@app.post("/api/process")` | ~519 | TRACKED+MODIFIED | ACTIVE |
| Backend handler | `server.py` | `process_video` | ~520 | TRACKED+MODIFIED | ACTIVE |
| Thread/worker | `server.py` | `worker_loop()` | ~164 | TRACKED+MODIFIED | ACTIVE |
| SubtitleRemover | `server.py` | `SubtitleRemover(...)` | ~241 | TRACKED+MODIFIED | ACTIVE |
| OCR/ASR operation | `server.py` | `patched_run()` | ~214 | TRACKED+MODIFIED | **MISSING** |
| WebSocket emission | `server.py` | `notify_progress_listeners` | ~234 | TRACKED+MODIFIED | **MISSING** |
| Frontend WS handler | `app.js` | `handleWSMessage` | ~818 | TRACKED+MODIFIED | ACTIVE (Unreached) |
| Job state update | `app.js` | `job.srtContent = data.srt_content` | ~866 | TRACKED+MODIFIED | ACTIVE (Unreached) |
| Step 1 editor update | `app.js` | `triggerAutoAiRewrite` | ~1323 | TRACKED+MODIFIED | ACTIVE (Unreached) |

## 4. Exact P1-to-P2 Boundary
- **Frontend caller:** `processNextJob()` -> `api.process()`.
- **Backend route:** `/api/process` -> `process_video`.
- **Backend handler:** `worker_loop()`.
- **SubtitleRemover invocation:** `sr = SubtitleRemover(job["input_path"])` and `sr.run()` in `server.py` lines 241 and 237.
- **Monkey-patch location:** `def patched_run(self):` at `server.py` line 214.
- **skip_inpaint state:** Set to `True` at `server.py` line 242.
- **Why the runtime still generated F:\test3_ocr_tmp.mp4:** 
  Code evidence proves the root cause: The assignment `SubtitleRemover.run = patched_run` (lines 238-239) is incorrectly indented *inside* the `patched_run` function definition itself. Because the closure is never executed, the monkey-patch is never applied to the class. Calling `sr.run()` unconditionally falls back to the original `SubtitleRemover.run` which performs full Pipeline 2 inpainting.

## 5. Reusable ASR Analysis
- **Exact symbol:** `api_extract_srt`
- **File and line range:** `api/server.py`, lines 987-1050.
- **Parameters:** `ExtractSrtReq` (`video_path`, `asr_fallback`, `asr_language`).
- **Returned value:** `{"status": "ok", "srt_content": srt_content, ...}`
- **Generated files:** Temporary `.wav` file (deleted immediately).
- **Progress behavior:** None (Synchronous HTTP response).
- **Cancellation behavior:** None (Blocks).
- **Global/shared state:** None.
- **Dependence on SubtitleRemover:** None.
- **Renders MP4:** NO.
- **Suitability:** Perfectly suited for direct extraction without rendering.
- **State:** SAFE TO REUSE DIRECTLY.

## 6. Reusable OCR Analysis
- **Exact symbol:** `SubtitleDetect.find_subtitle_frame_no`
- **File and line range:** `backend/main.py`, line ~161.
- **Inputs and outputs:** Takes `video_path`, `sub_areas`, `sub_remover`. Returns frame dict.
- **Frame extraction behavior:** Uses `FramePrefetcher` to read video frames and detects text.
- **SRT construction:** Does not build SRT natively; only detects frame boundaries.
- **Temporary files:** None.
- **Dependence on SubtitleRemover:** YES, tightly coupled (`sub_remover=self`).
- **Inpainting/rendering side effects:** Orchestrates the inpainting logic flow for SubtitleRemover.
- **Cancellation:** Depends on global `is_cancelled`.
- **Suitability:** Cannot be easily decoupled from the rendering pipeline without major refactoring.
- **State:** NOT SAFE TO REUSE.
- **Explicit Statement:** NO ISOLATED OCR FUNCTION IDENTIFIED.

## 7. WebSocket and Job Routing
- **WebSocket endpoint:** `ws://127.0.0.1:8765/ws/progress`
- **Connected-client storage:** `connections: List[WebSocket]` in `server.py`.
- **Event emission function:** `notify_progress_listeners()` and `send_progress_msg()`.
- **Expected SRT event type:** `"srt_result"`.
- **Actual event types currently emitted:** `"progress"`, `"finished"`, `"error"` (by the original SubtitleRemover).
- **job_id inclusion:** YES.
- **Frontend handler branches:** `handleWSMessage()` handles `progress`, `finished`, `error`, `srt_result`.
- **Timeout mechanism:** `setTimeout` in `processNextJob()`, limits wait to 10-15 minutes.
- **Exact reason tested frontend did not receive SRT:** Proven by code evidence (see Section 4). The indentation error prevented `patched_run` from executing, so the `"srt_result"` WebSocket emission was never triggered.

## 8. Proposed Dedicated Route
**Contract: `POST /api/p1/extract-text`**

**Request fields:**
- `job_id`: string
- `video_path`: string
- `extraction_mode`: string (Only "asr" supported natively as safe)
- `language`: string
- `asr_fallback`: boolean

**Response/progress fields:**
- `job_id`: string
- `status`: string ("ok" or "error")
- `extraction_mode_requested`: string
- `extraction_mode_used`: string
- `srt_content`: string
- `plain_text`: string (Optional, mapped from SRT)
- `warnings`: list (Optional)
- `error`: string (Optional)

**Specifications:**
- **Execution:** Synchronous HTTP execution.
- **Delivery:** HTTP response (No WebSocket required).
- **Cancellation:** None (Synchronous blocking).
- **Temporary-file behavior:** Temp `.wav` generated during extraction and immediately deleted.
- **Cleanup behavior:** Temp audio guaranteed deleted via try/finally block.
- **Error handling:** Returns JSON with `status: "error"` and error string.
- **Constraints:** The route will never instantiate rendering/inpainting, never call subtitle removal, never produce a cleaned video, and never create `*_ocr_tmp.mp4`.

## 9. Exact Patch Scope
- **`api/server.py`**:
  - Existing working-tree changes: Must be preserved.
  - Exact minimal edit: Add new route `@app.post("/api/p1/extract-text")` wrapping the `faster_whisper` logic from `api_extract_srt`.
  - Estimated changed lines: 40-50 lines.
  - Necessity: To provide a clean backend boundary isolated from `worker_loop`.
- **`src/renderer/js/api.js`**:
  - Existing working-tree changes: Must be preserved.
  - Exact minimal edit: Add `async extractTextP1(jobId, videoPath, mode, language)` fetching the new route.
  - Estimated changed lines: 10-15 lines.
  - Necessity: API client for the new route.
- **`src/renderer/js/app.js`**:
  - Existing working-tree changes: Must be preserved.
  - Exact minimal edit: Change `#btn-start-all` listener to call `processPipeline1Job`. Create `processPipeline1Job(job)` that sets UI state, calls `api.extractTextP1`, populates `job.srtContent`, updates `#step1-detail-text`, and calls `onJobFinished`.
  - Estimated changed lines: 30-40 lines.
  - Necessity: Decouples P1 UI logic from P2's shared WebSocket `processNextJob` flow.

No edits to `index.html` are required.

## 10. Files Not To Edit
- `api/tts_engine.py`
- Pipeline 2 engine files (`backend/*.py`)
- `src/renderer/js/pipelines/pipeline1-ai.js` (No direct active-path evidence requires changing it, as it relies on `job.srtContent` which will be correctly populated).
- `package.json`
- `package-lock.json`
- `src/main/main.js`
- `src/main/preload.js`
- Pipeline 3 files
- All patch scripts

## 11. Review Separation
The RECOVERY-007 diff will be cleanly distinguishable from pre-existing dirty working-tree changes because:
1. It exclusively adds new, distinct functions (`processPipeline1Job`, `extractTextP1`, `@app.post("/api/p1/extract-text")`).
2. It modifies exactly one event listener assignment (`#btn-start-all`).
3. It touches absolutely no logic used by Pipeline 2.

Commands to review later:
- `git diff` (shows all changes).
- `git diff | grep "+"` (highlights the specific new functions added for RECOVERY-007).

## 12. Verification Plan
- **Static backend import/startup check:** Verify `server.py` syntax runs without crashing.
- **Route-level missing-file test:** Test sending a request with a fake path to ensure graceful error.
- **ASR-only test:** Verify SRT text is returned using Whisper.
- **OCR-only test:** NOT APPLICABLE (Only ASR is safely isolated).
- **Auto/fallback test:** NOT APPLICABLE (ASR only).
- **job_id routing test:** Ensure the response populates the correct job card.
- **WebSocket event test:** NOT APPLICABLE (Using synchronous HTTP).
- **Cancellation test:** NOT APPLICABLE (Synchronous request).
- **No Subtitle Removing log:** YES.
- **No Inpaint log:** YES.
- **No unintended MP4:** YES.
- **Frontend editor update:** Ensure Step 1 textarea receives the SRT.
- **Pipeline 2 regression test:** Ensure clicking `Bắt đầu` in Step 2 still runs `processNextJob` and inpainting.
- **TTS/clone regression boundary:** Ensure `onJobFinished` still triggers TTS successfully.
- **Owner test:** Owner executes manual baseline with `F:\test3.mp4`.

## 13. Proposed Acceptance Criteria
- P1 uses dedicated HTTP route: PASS/FAIL
- No Subtitle Removing / Inpainting: PASS/FAIL
- SRT correctly populated in editor: PASS/FAIL
- P2 regression check intact: PASS/FAIL

## Final Recommendation
**APPROVE THREE-FILE PATCH**
