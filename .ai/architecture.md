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
