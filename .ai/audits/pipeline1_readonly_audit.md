# Evidence-Based Pipeline 1 Read-Only Audit

## 1. Executive Summary
A comprehensive read-only audit of the current Pipeline 1 implementation (Commit `1808076`) was conducted to evaluate the state of frontend modularization, backend integration, and compliance with the target Pipeline 1 artifact contract. The audit traced UI bindings, IPC channels, Python routes, and data flows. The system is currently fractured between legacy orchestration (`app.js`) and disconnected ES modules. Substantial gaps exist between the current codebase and the target architecture.

## 2. Repository State Classification

Based on Git evidence (branch `rescue/wip-20260803`, HEAD `1808076`):

**COMMITTED AND CLEAN**
- (None of the core audited files are clean at HEAD)

**TRACKED AT HEAD + MODIFIED IN WORKING TREE**
- `package.json`
- `api/server.py`
- `api/tts_engine.py`
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/index.html`
- `src/renderer/js/api.js`
- `src/renderer/js/app.js`

**UNTRACKED**
- `src/renderer/js/store.js`
- `src/renderer/js/pipeline.js`
- `src/renderer/js/components/*` (including `settings.js`, `prompt-manager.js`, `job-manager.js`)
- `src/renderer/js/pipelines/*` (including `pipeline1-ai.js`, `pipeline3-finalize.js`)
- `src/renderer/js/utils/*`

---

## 3. Runtime Entry-Point Map

| Component | File | Initialization Order / Behavior | State / Evidence |
|---|---|---|---|
| **NPM Script** | `package.json` | `"start": "electron ."` | MODIFIED |
| **Main Process** | `main.js` | `app.whenReady()` triggers `createWindow()` and `pythonBridge.start()`. | MODIFIED (Line 89) |
| **Window Creation** | `main.js` | `BrowserWindow` created with `contextIsolation: true`. | MODIFIED (Line 12) |
| **Preload config** | `preload.js` | Exposes `window.electronAPI` via `contextBridge`. | MODIFIED (Line 3) |
| **Python Server** | `server.py` | `uvicorn.run(app, host="127.0.0.1", port=8765)` spawned by `pythonBridge`. | MODIFIED (Line 2485 via PythonBridge logic) |
| **Renderer Scripts** | `index.html` | `<script src="js/api.js">` -> `<script type="module">` -> `<script defer src="js/app.js">`. | MODIFIED (Lines 800-822) |
| **WebSocket** | `app.js` | `ws = new WebSocket('ws://127.0.0.1:8765/ws/progress');` | MODIFIED (Line 54) |
| **App Shutdown** | `main.js` | `app.on('will-quit')` calls `pythonBridge.stop()`. | MODIFIED (Line 110) |

---

## 4. Complete Pipeline 1 UI Binding Table

| Feature / UI Element | Listener/Handler File | Method/API Call | Status |
|---|---|---|---|
| **Video Import** (`#btn-open-file`) | `app.js` | `window.electronAPI.openFile()` | CODE OBSERVED - UI REACHABLE |
| **Start Process** (`#btn-start`) | `app.js` | `api.process(...)` | CODE OBSERVED - UI REACHABLE |
| **Job Queue** (`#step1-job-list`) | N/A | N/A | MODULE NOT PROVEN ACTIVE (job-manager.js) |
| **Active Job Selection** (`.tk-job-card`) | N/A | N/A | MODULE NOT PROVEN ACTIVE (job-manager.js) |
| **Analyze Video** (`#btn-analyze-video`) | N/A | N/A | BINDING NOT FOUND (No listener attached) |
| **Subtitle/Text Editor** (`#step1-detail-text`) | `pipeline1-ai.js` | DOM `.value` manipulation | CODE OBSERVED - CALLER FOUND |
| **Save Text** (`#step1-btn-save-text`) | N/A | N/A | BINDING NOT FOUND (No listener attached) |
| **AI Provider** (`#ai-provider`) | `settings.js` | Read via `_saveAllSettings()` | CODE OBSERVED - UI REACHABLE (via Save settings) |
| **Model/API-Key** (`#ai-api-key`) | `settings.js` | Read via `_saveAllSettings()` | CODE OBSERVED - UI REACHABLE (via Save settings) |
| **Endpoint** (`#ai-endpoint`) | `settings.js` | Read via `_saveAllSettings()` | CODE OBSERVED - UI REACHABLE (via Save settings) |
| **Prompt Selection** (`#ai-prompt`) | `settings.js` | Read via `_saveAllSettings()` | CODE OBSERVED - UI REACHABLE (via Save settings) |
| **Prompt Manager** (`prompt-manager.js`) | `index.html` | `initPromptManager()` | CODE OBSERVED - UI REACHABLE |
| **AI Rewrite** (`triggerAutoAiRewrite`) | `app.js` | Calls `/api/ai-rewrite` after OCR | CODE OBSERVED - CALLER FOUND (Triggered by job finish) |
| **Retry AI** (`#step1-btn-rewrite`, `#btn-retry-ai`) | N/A | N/A | BINDING NOT FOUND (No listeners attached) |
| **Voice Selector** (`#tts-voice`) | `settings.js` | Read via `_saveAllSettings()` | CODE OBSERVED - UI REACHABLE (via Save settings) |
| **Ref-Audio Upload** (`#btn-upload-ref-audio`) | `settings.js` | `window.electronAPI.openFile()` | CODE OBSERVED - UI REACHABLE |
| **Clone Voice** (`#btn-clone-voice`) | `settings.js` | `window.api.generateTTS()` | CODE OBSERVED - UI REACHABLE |
| **TTS Generation** (`triggerAutoTts`) | `pipeline1-ai.js` | Calls `/api/tts-retry` | CODE OBSERVED - CALLER FOUND (Triggered by AI success) |
| **Retry TTS** (`#step1-btn-gen-tts`, `#btn-retry-tts`) | N/A | N/A | BINDING NOT FOUND (No listeners attached) |
| **Replacement Audio** (`#step1-btn-import-audio`) | N/A | N/A | BINDING NOT FOUND (No listeners attached) |
| **Audio Preview** (`#job-tts-preview-audio`) | `pipeline1-ai.js` | Sets DOM `src` | CODE OBSERVED - CALLER FOUND |
| **SRT Preview/Save** (`#step1-detail-text`) | `pipeline1-ai.js` | DOM manipulation | CODE OBSERVED - CALLER FOUND |
| **Loading State** (`_setBtn` in `pipeline1-ai.js`) | `pipeline1-ai.js` | DOM text manipulation | CODE OBSERVED - CALLER FOUND |
| **Disabled State** (`_setBtn` in `pipeline1-ai.js`) | `pipeline1-ai.js` | DOM `disabled` attribute | CODE OBSERVED - CALLER FOUND |
| **Error Display** (`window.addLog`) | `logger.js` | Custom UI logger | CODE OBSERVED - CALLER FOUND |

*(All features listed are NOT RUNTIME VERIFIED in this audit).*

---

## 5. Frontend Module Loading & Import Graph

Tracing imports strictly from `<script type="module">` in `index.html`:

**Directly Imported:**
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- `src/renderer/js/components/settings.js`
- `src/renderer/js/components/prompt-manager.js`

**Indirectly Imported:**
- `src/renderer/js/store.js` (via `settings.js`, `prompt-manager.js`)
- `src/renderer/js/utils/logger.js` (via `settings.js`, `prompt-manager.js`)
- `src/renderer/js/utils/dom.js` (via multiple components)

**File Exists But No Import Path Found:**
- `src/renderer/js/components/job-manager.js` (NOT PROVEN ACTIVE)
- `src/renderer/js/pipeline.js` (NOT PROVEN ACTIVE)

---

## 6. Electron IPC Map

| Preload API | Channel | Main Process Handler | Status / Evidence |
|---|---|---|---|
| `openFile` | `dialog:openFile` | `ipcMain.handle` (`main.js:115`) | Handled |
| `openDirectory` | `dialog:openDirectory` | `ipcMain.handle` (`main.js:130`) | Handled |
| `saveFile` | `dialog:saveFile` | `ipcMain.handle` (`main.js:138`) | Handled |
| `startPython` | `python:start` | `ipcMain.handle` (`main.js:150`) | Handled |
| `stopPython` | `python:stop` | `ipcMain.handle` (`main.js:160`) | Handled |
| `getPythonStatus` | `python:status` | `ipcMain.handle` (`main.js:165`) | Handled |
| `openPath` | `app:openPath` | `ipcMain.handle` (`main.js:168`) | Handled |
| `getAppPath` | `app:getPath` | `ipcMain.handle` (`main.js:173`) | Handled |
| `onPythonLog` | `python:log` | `mainWindow.webContents.send` (`main.js:61`) | Event forwarded |
| `onPythonError` | `python:error` | `mainWindow.webContents.send` (`main.js:67`) | Event forwarded |

---

## 7. Backend Route Table

| Route | Handler (`server.py`) | Frontend Caller | Reachability | Request Fields | Response Fields | Path Gen | Timeout/Error/Cancel |
|---|---|---|---|---|---|---|---|
| `/api/process` | `process_video` | `api.js` (`process`) | UI Reachable | `video_path, options` | `job_id, status` | N/A | Threaded task / None |
| `/api/cancel` | `cancel_job` | `api.js` (`cancel`) | UI Reachable | `job_id` | `status` | N/A | Stop flag |
| `/api/analyze-video` | `analyze_video_endpoint` | `api.js` (`analyzeVideo`) | BINDING NOT FOUND | `video_path, ai_config, prompt` | `status, result` | `ffmpeg` temp | `str(e)` / None |
| `/api/ai-rewrite` | `ai_rewrite_endpoint` | `pipeline1-ai.js` | Caller Found | `srt_content, ai_config` | `status, result` | N/A | `urllib` default / None |
| `/api/tts/generate` | `generate_tts_endpoint`| `api.js` (`generateTTS`) | UI Reachable | `text, ref_audio, lang, voice` | `status, audio_path`| `tts_engine.py`| `str(e)` / None |
| `/api/tts/from-srt` | `generate_tts_from_srt_endpoint` | N/A | Unused | `srt_path, ref_audio, lang, out`| `status, segments, count` | Multiple `.wav` | `str(e)` / None |
| `/api/tts/status` | `tts_status_endpoint` | `settings.js` | UI Reachable | None | `available, model_loaded` | N/A | `str(e)` / None |
| `/api/tts-retry` | `tts_retry_endpoint` | `pipeline1-ai.js` | Caller Found | `srt_content, tts_voice, path, ref_audio`| `status, audio_path, srt, ass` | `tts_engine.py`| `str(e)` / None |
| `/ws/progress` | `websocket_endpoint` | `app.js` | UI Reachable | WS Protocol | `{type, job_id, progress...}` | N/A | None |

---

## 8. Actual Data-Flow Maps

1. **Video selection & job creation**: `#btn-open-file` `click` -> `app.js:selectFile` -> `window.electronAPI.openFile` -> UI queue updated in `app.js`.
2. **Start processing**: `#btn-start` `click` -> `app.js:processNextJob` -> POST `/api/process` -> Thread spawned in backend.
3. **OCR/ASR extraction**: Backend `worker_loop` monkey-patches `SubtitleRemover` -> Runs `VideoAnalysis.extract_audio` / `speech_to_text` / OCR -> Emits `type: "srt_result"` via WebSocket.
4. **WebSocket handling**: `app.js:handleWSMessage` -> receives `srt_content` -> attaches to `job.srtContent`.
5. **AI rewrite**: `app.js:onJobFinished` checks `chk-ai-rewrite` -> invokes `window.triggerAutoAiRewrite(job, job.srtContent)` -> `pipeline1-ai.js` -> POST `/api/ai-rewrite` -> stores to `job.aiContent` and UI `#ai-content`.
6. **Ollama rewrite**: `#ai-provider` set to ollama -> POST `/api/ai-rewrite` passes `provider="ollama"` -> backend uses `urllib.request.urlopen` to `localhost:11434/api/chat`.
7. **Existing-voice TTS**: `triggerAutoAiRewrite` invokes `triggerAutoTts` -> POST `/api/tts-retry` with string `voice_name` -> output stored in `job.ttsAudioPath`.
8. **Reference-audio selection**: `#btn-upload-ref-audio` `click` -> `window.electronAPI.openFile` -> local JS var `_ttsRefAudioPath` populated.
9. **Voice clone sample generation**: `#btn-clone-voice` `click` -> POST `/api/tts/generate` with `_ttsRefAudioPath` -> clone tested and saved to `localStorage('tts_voices')`.
10. **Cloned-voice TTS**: `triggerAutoTts` reads `localStorage` clone list -> POST `/api/tts-retry` passing `ref_audio` path -> output stored in `job.ttsAudioPath`.
11. **Timed SRT generation**: `pipeline1-ai.js` executes `_buildTimedSrt` or `/api/tts-retry` returns generated `srt_content` -> stored in `job.ttsTimedSrt`.
12. **Replacement-audio upload**: `#step1-btn-import-audio` -> NOT PROVEN REACHABLE.
13. **Audio preview**: `triggerAutoTts` success callback -> DOM `#job-tts-preview-audio` src updated.
14. **Cancellation**: `#btn-cancel` `click` -> `app.js:cancelJob` -> POST `/api/cancel`.

*(All traced links are CODE OBSERVED, NOT RUNTIME VERIFIED).*

---

## 9. Generated-Artifact Inventory

| Artifact | P1 Evaluation | Storage Domain |
|---|---|---|
| `source_metadata.json` | NOT IMPLEMENTED | None |
| `speech_transcript.json`| NOT IMPLEMENTED (Raw `.srt` only) | None |
| `subtitle_ocr.json` | NOT IMPLEMENTED (Raw `.srt` only) | None |
| `scenes.json` | NOT IMPLEMENTED | None |
| `multimodal_timeline.json` | NOT IMPLEMENTED | None |
| `product_insights.json` | NOT IMPLEMENTED | None |
| `customer_insights.json`| NOT IMPLEMENTED | None |
| `remix_script.json` | PARTIAL EQUIVALENT | Frontend State (`job.aiContent`) |
| `approved_script.json` | NOT IMPLEMENTED | None |
| `voice.wav` | PARTIAL EQUIVALENT (Dynamically named) | Persistent file on disk |
| `voice.srt` | PARTIAL EQUIVALENT (Dynamically named) | Persistent file on disk |
| `edit_plan.json` | NOT IMPLEMENTED | None |

---

## 10. Ollama Integration Findings

- **Settings UI**: Fields `#ai-provider`, `#ai-api-key` (used for model name), and `#ai-endpoint` are editable.
- **Local Storage**: Saved in `ai_provider`, `ai_api_key`, `ai_endpoint`.
- **API Path / Request Body**: Backend `server.py:1121` hits `<endpoint>` directly with `{"model": config.model, "messages": [{"role": "user", "content": prompt + content}]}`.
- **Prompt Construction**: Concatenates user-defined prompt strings with raw SRT text.
- **JSON Support**: No structured JSON format parameter is enforced in the payload.
- **Image/Vision Support**: UI advertises Vision, but the backend sends no images in the payload (text-only).
- **Timeout/Errors/Fallback**: Uses default `urllib` timeout. Errors return `{"status": "error"}`. No automated fallback to other providers.

---

## 11. Chinese-Analysis Capability Matrix

| Capability | Status / Evidence |
|---|---|
| Chinese ASR | CODE OBSERVED (Backend Whisper invocation) |
| Hard-sub OCR | OWNER CONFIRMED (Legacy P2 capability) |
| OCR/ASR Selection | CODE OBSERVED (UI fallback checkboxes) |
| OCR/ASR Merging | NOT IMPLEMENTED |
| Scene Detection | NOT IMPLEMENTED |
| Keyframes | NOT IMPLEMENTED |
| Visual Understanding | NOT IMPLEMENTED |
| Multimodal Alignment | NOT IMPLEMENTED |
| Product Insights | PROPOSED (Prompt dropdown only) |
| Customer Insights | NOT IMPLEMENTED |
| Script Remix | CODE OBSERVED (Flat text rewrite) |
| Duration Control | CODE OBSERVED (FFmpeg tempo adjust via `/api/adjust-video-tempo`) |
| TTS | CODE OBSERVED |
| Clone Voice | CODE OBSERVED |
| Timed SRT | CODE OBSERVED |

---

## 12. Legacy vs. Module Duplication Map

**`state.jobs` Duplication:**
- **Legacy Orchestration (`app.js`)**: Modifies `window._appState.jobs` and dynamically renders job cards into the DOM. Handles global WebSocket events.
- **ES Module (`job-manager.js`)**: Designed to read from `store.js` and render into `#step1-job-list`. Currently NOT PROVEN ACTIVE.

---

## 13. Gap Analysis Against Target Artifacts

The current system relies entirely on volatile memory (`job` variables injected by `app.js` and `pipeline1-ai.js`) and dynamically generated, non-standardized `.wav`/`.mp3`/`.srt` files outputted into temporary or project directories by the backend endpoints. None of the strict, immutable JSON representations (`scenes.json`, `multimodal_timeline.json`, etc.) required by the new artifact contract are currently generated.

---

## 14. Risks Ranked by Severity

1. **CODE OBSERVED ARCHITECTURAL RISK**: Since `SubtitleRemover` was designed for frame-by-frame rendering (Pipeline 2), hijacking it to skip rendering for Pipeline 1 creates a severe shared-state concurrency risk. This creates a potential shared-state concurrency failure if P1 and P2 jobs execute concurrently, but the failure has not been runtime verified.
2. **State Fracture**: P1 state management is split between global DOM listeners in `app.js` and ES6 module logic in `pipeline1-ai.js`.

---

## 15. Proposed Ordered Recovery Tasks

**No implementation task is currently approved.**

**Candidate 1: Baseline Characterization**
- **Objective**: Capture and verify the existing Pipeline 1 behavior before refactoring.
- **Details**:
  - Define one fixed Chinese sample video.
  - Expected OCR/ASR output validation.
  - Expected AI rewrite path execution.
  - Existing-voice TTS check.
  - Clone-voice TTS check.
  - Generated SRT check.
  - Request/response and output-file inventory documentation.
  - Owner manual app verification.
  - No architecture refactoring allowed.

---

## 16. Questions Requiring Owner Runtime Verification

1. Can the backend OCR pipeline handle vertical or burned-in Chinese subtitles accurately without Vision AI assistance?
2. Does the OmniVoice integration (`tts_engine.py`) perform correctly on the user's specific GPU environment?
3. Should the application prevent users from interacting with UI modules that are NOT PROVEN REACHABLE, or is the UI currently sufficient for baseline characterization?
