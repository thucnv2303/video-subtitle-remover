# Project Architecture

## 1. CURRENT IMPLEMENTATION — CODE OBSERVED

Dự án tuân theo kiến trúc ES6 Modules với bridge pattern để tương thích script thường.
TUYỆT ĐỐI tuân thủ khi tìm kiếm hoặc thêm mới tính năng.

```text
src/renderer/
├── index.html               (Giao diện chính. Load api.js, pipeline.js dạng script thường;
│                             load các ES6 module qua <script type="module"> bridge,
│                             expose hàm lên window.*; load app.js defer)
├── styles/
│   └── main.css             (File CSS chính)
└── js/
    ├── app.js               (Main entry point — IIFE non-module. Điều phối toàn bộ:
    │                         job queue, pipeline 2 inpaint, navigation, UI events.
    │                         Gọi window.triggerAutoAiRewrite, window.finalizeVideo, v.v.)
    ├── store.js             (Global state: state object, loadState, saveState)
    ├── api.js               (APIClient: fetch/WebSocket với backend. Expose window.api)
    ├── pipeline.js          (Step chevron navigation — 40 lines)
    ├── utils/
    │   ├── logger.js        (addLog(msg, type), showToast(msg, type, dur), getLogCategory.
    │   │                     Hỗ trợ cả 2 dạng gọi: simple và legacy el-based)
    │   ├── formatters.js    (fmtTime, fmtTimeFull, formatFileSize, fmtPercent, msToSrtTime)
    │   └── dom.js           (el object ~100 DOM refs, $ và $$ helpers)
    ├── pipelines/
    │   ├── pipeline1-ai.js  ★ PIPELINE 1: AI Analysis + TTS Chain
    │   │                     triggerAutoAiRewrite(job, srtText) → AI rewrite → chain TTS
    │   │                     triggerAutoTts(job, srtText) → tạo TTS audio, lưu vào job
    │   │                     KẾT QUẢ: job.ttsAudioPath, job.ttsTimedSrt, job.karaokeAss
    │   │                     KHÔNG ghép video — việc đó thuộc Pipeline 3
    │   ├── pipeline2-remove.js  (Legacy helpers — runNextPass, pollProgress, handleWSMessage
    │   │                         — hiện tích hợp vào app.js. File này giữ lại để tham khảo)
    │   ├── pipeline3-finalize.js  ★ PIPELINE 3: Finalize Video
    │   │                     finalizeVideo(job):
    │   │                       Bước 1: Điều chỉnh tempo video khớp TTS
    │   │                       Bước 2: Tách vocal gốc (nếu bật tts-remove-vocal)
    │   │                       Bước 3: Ghép TTS audio vào video đã xóa sub → _with_voice.mp4
    │   │                       Bước 4: Burn subtitle (nếu job.voiceSub) → _final.mp4
    │   │                     INPUT: job.outputPath + job.ttsAudioPath (từ Pipeline 1)
    │   │                     OUTPUT: job.finalOutputPath (_final.mp4)
    │   └── pipeline3-sub.js (Re-export alias → pipeline3-finalize.js)
    └── components/
        ├── job-manager.js   (createJob, renderJobList, processNextJob, onJobFinished, loadVideo)
        ├── prompt-manager.js(initPromptManager, renderPromptDropdown — quản lý AI prompts)
        ├── video-preview.js (fetchAndDrawLivePreview, startLivePreviewPolling)
        └── settings.js      (initSettings, loadSettingsValues, renderSavedVoices,
                               updateVoiceDropdown, checkTTSStatus, voice clone management)
```

Vì `index.html` load `app.js` dạng `<script src="...">` (non-module), các ES6 module được bridge qua `<script type="module">` inline trong HTML để expose hàm lên `window.*`. `app.js` gọi các hàm module qua `window.*`. Các module tự gọi `window.addLog` và `window.showToast`.

## 2. TARGET PRODUCT ARCHITECTURE — OWNER CONFIRMED / PROPOSED

Kiến trúc chia thành 3 pipeline hoạt động hoàn toàn độc lập, giao tiếp qua Artifact Boundaries.

### Pipeline 1: Analysis, Script and Voice
- Phân tích ORIGINAL video.
- Dịch vụ/chức năng: detect scenes/keyframes, build multimodal timeline, extract insights, remix script (chia đoạn có cấu trúc), hỗ trợ script approval.
- Output sinh ra: TTS/Voice cloned, SRT dựa trên TTS timing.
- Các artifacts JSON: `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.
- **Strict Rule:** Tuyệt đối không xóa subtitle, không cắt video, không ráp hay render video ở Pipeline này.

### Pipeline 2: Subtitle Removal
- Nhận input là ORIGINAL video.
- Chỉ thực hiện xóa hard subtitles. Hỗ trợ chọn vùng xóa tự động/thủ công.
- Output: `clean_video.mp4`.
- **Timeline Contract:** Pipeline 2 `clean_video.mp4` must remain timeline-compatible with the original source within a defined and verified tolerance.
  - no trimming of beginning or end;
  - no scene reordering;
  - no speed changes;
  - no automatic crop;
  - original scene timecodes remain valid or deterministically mappable.

  **Exact allowed tolerance for duration, FPS, frame count and timebase: NOT YET VERIFIED.**
  Giá trị tolerance này phải được xác định thông qua audit và owner runtime testing trước khi Pipeline 3 có thể phụ thuộc vào nó một cách an toàn.

### Pipeline 3: Video Remix and Finalize
- Đọc artifacts từ Pipeline 1 (approved script, TTS audio, SRT, scenes, edit plan).
- Đọc `clean_video.mp4` từ Pipeline 2 làm nguồn video mặc định.
- Cắt cảnh dùng original source timecodes, sắp xếp lại theo `edit_plan.json` (khi cần).
- Mix TTS và background audio, burn SRT mới.
- Render final video.
- **Strict Rule:** Tuyệt đối không được sửa đổi (modify) outputs của Pipeline 1 và Pipeline 2. Bắt buộc BLOCK operation nếu artifacts từ P1 và P2 không đến từ cùng một source video.

### Artifact Boundaries & Source Identity
Artifacts P1 được lưu ở `jobs/<job_id>/p1/`.
Mọi pipeline artifact phải chứa: `job_id`, `source_fingerprint`, `source duration`, `FPS/timebase`, và `artifact version`.

## Credential Hardening (RECOVERY-007E-AI-SETTINGS-001-SOURCE-REVIEW-FIX-006, commit 4ee2f542)

### Provider Allowlist
ALLOWED_CLOUD_PROVIDERS = Set { 'deepseek', 'gemini' }.
assertCloudProvider(provider) enforced before ALL credential access in:
  ai:save-provider-keys, ai:has-provider-keys, ai:delete-provider-keys, ai:test-provider, ai:rewrite.
Unknown providers return controlled error. Never written to ai_keys.json.
Ollama uses its dedicated ollama:* IPC handlers exclusively.

### Key Store (ai_keys.json)
Shape: { deepseek?: string[], gemini?: string[] }.
ENOENT -> returns empty store {}.
Invalid JSON / wrong root type / unknown provider key / invalid array entry -> throws controlled error; does not return {} and does not overwrite.
Writes are atomic: serialize -> writeFileSync(tmpPath) -> renameSync(tmpPath, keysPath). Cleanup exact tmp file on failure only.

### Response Size Limits (2 MB)
Applied to all provider HTTP responses:
  DeepSeek GET /models, DeepSeek POST /chat/completions,
  Gemini GET models?key=, Gemini POST :generateContent.
req.destroy() called on exceed. Partial content not parsed.

### Gemini Validation Contract
HTTP success + valid models array + >=1 generateContent-capable model required for PASS.
Invalid JSON -> error. Missing models array -> error.
No compatible models -> { verified:true, noCompatibleModels:true, models:[] } (not a success state).
No hardcoded fallback model list substituted on validation failure.

### Key Sanitization
Keys trimmed, deduplicated, empty-rejected before provider API call.
Stored count capped at MAX_KEYS_PER_PROVIDER (10).

### Source Encoding
All source files written in UTF-8 without BOM.
Vietnamese strings, emoji, box-drawing characters verified against parent commit abf0ee2.
No mojibake patterns (ChÆ°a, KhÃ´ng, etc.) in any allowed source file.

## HARDENING-CORRECTION-007 (7a6157cdea399a219081f01f661da2419196f47a)

### Gemini Model Discovery — revised contract
fetchGeminiModels returns a flat string[] of model IDs directly.
Rejects with Error in all failure cases:
  - HTTP non-200 -> error
  - Invalid JSON -> error
  - Missing models array -> error
  - No generateContent-capable models -> 'API key được xác thực nhưng không có model generateContent tương thích.'
No structured {verified,noCompatibleModels,models} return value.
fetchGeminiModelsList wrapper removed.

### Structured IPC Results (new contracts)
ai:has-provider-keys:
  Success: { status: 'ok', count: number } (count of isValidCiphertext entries)
  Failure: { status: 'error', error: string }
  Never returns plain number. Never silently returns 0 on corrupt store.

ai:delete-provider-keys:
  Success: { status: 'ok' }
  Failure: { status: 'error', error: string }
  Never returns boolean.

### Windows-Safe Atomic Key Store Replacement (revised)
saveEncryptedKeys steps:
  0. Clean stale tmpPath and bakPath from prior interrupted saves (unlinkSync, ignore ENOENT).
  1. writeFileSync(tmpPath, serialized, 'utf8')
  2. If keysPath exists: renameSync(keysPath, bakPath), set hadExisting=true.
     If ENOENT: continue (no backup needed).
     Any other error: unlink tmpPath, throw.
  3. renameSync(tmpPath, keysPath)
     If fails: restore if hadExisting (renameSync bakPath -> keysPath), unlink tmpPath, throw.
  4. If hadExisting: unlinkSync(bakPath).
No wildcard cleanup. No delete before backup.

### isValidCiphertext (revised)
Enforces: non-empty string, even length, length <= MAX_HEX_CIPHERTEXT_LENGTH (8192), HEX_REGEX (/^[0-9a-f]+$/i).
Used in loadEncryptedKeys and ai:has-provider-keys count.

### UI Corrections (settings.js)
refreshProviderStatus(provider):
  Checks result.status === 'error' and shows error message as 'offline' status chip.
  Does not show 'Chưa có key' when store cannot be read.
  Uses result.count when result.status === 'ok'.

btn-delete-keys handler:
  Checks result.status === 'ok' before clearing input and showing toast.
  Shows error message and sets status 'offline' when result.status !== 'ok'.

## CRASH-RECOVERY-FORENSIC-ROLLBACK-FIX-010 (8ef4f6b3e2a9eb3ad020db15f08ca19ec56eb298)

### Deterministic Artifact Paths
Primary:  app.getPath('userData')/ai_keys.json
Temp:     app.getPath('userData')/ai_keys.json.tmp
Backup:   app.getPath('userData')/ai_keys.json.bak
Corrupt:  app.getPath('userData')/ai_keys.json.corrupt
No PID in filenames. All paths recoverable across process restarts.

### tryUnlink() and windowsSafeRestoreFromBak()
- `tryUnlink()`: unlinks a file, ignores ENOENT, returns `{ok:false, code, error}` on other failures (e.g. EPERM).
- `windowsSafeRestoreFromBak()`: restores bak to primary. On Windows, `renameSync(bak, keys)` fails if `keys` exists. This helper first moves `keys` to `.corrupt`, restores `bak`, validates the restored file, and then cleans up `.corrupt` on success. Throws `RESTORE_FAILED` on any error, reversing moves if possible.

### recoverKeyStore() — explicit state machine
Handles states in most-specific-first order. Returns { recovered: true, case*: true } on success, throws typed Error otherwise.
1. Case E (keys + tmp + bak): if keys valid, remove tmp/bak. If corrupt, `windowsSafeRestoreFromBak()`. If all corrupt, throw `STORE_CORRUPT`.
2. Case A (keys + bak): if keys valid, remove bak. If corrupt, `windowsSafeRestoreFromBak()`. If both corrupt, throw `STORE_CORRUPT`.
3. Case D (keys + tmp): if keys valid, remove tmp. If corrupt, throw `STORE_CORRUPT`.
4. Case B (no keys + bak): if bak valid, restore to keys and validate. If corrupt, throw `STORE_CORRUPT`.
5. Case C (no keys + tmp): throw `RECOVERY_REQUIRED`.
6. Normal: only keys, or nothing.

### saveEncryptedKeys() — revised save flow with rollback
1. recoverKeyStore() (throws if unrecoverable).
2. openSync(tmpPath, 'w') + writeSync + fsyncSync + closeSync.
3. If keysPath exists: renameSync(keysPath, bakPath).
4. renameSync(tmpPath, keysPath).
5. Post-write validation: read keysPath and validate.
   If invalid: rename keysPath to corruptPath, restore bakPath to keysPath, validate restored keysPath.
   Throws `WRITE_FAILED` if rollback succeeds, `RESTORE_FAILED` if rollback fails.
6. tryUnlink(bakPath) ONLY after step 5 validation passes.

### validateStoreContent(content)
Pure function returning { ok: true, data } or { ok: false, error: string }.
No throws, no logging.

### loadEncryptedKeys()
1. recoverKeyStore() (throws if unrecoverable).
2. readFileSync(keysPath). ENOENT -> {}.
3. validateStoreContent(raw). If invalid -> STORE_CORRUPT.

### Typed Error Codes
WRITE_FAILED:       write or backup step failed, or post-write validation failed and rollback succeeded.
RESTORE_FAILED:     backup restoration failed, or post-write rollback failed.
STORE_CORRUPT:      primary file and/or bak are invalid; or unlink failed on stale artifact.
RECOVERY_REQUIRED:  keys missing; only tmp present; manual intervention needed.
