# Project Architecture

## Cấu trúc tổng thể (Frontend)

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

## Luồng Pipeline

```
Video Input
    │
    ▼
[Pipeline 2 — app.js] ──── inpaint (xóa hardcoded sub)
    │ job.outputPath = _no_sub.mp4
    │ job.srtContent = SRT trích xuất (OCR/ASR)
    ▼
[Pipeline 1 — pipeline1-ai.js]
    │ triggerAutoAiRewrite(job, srt) → AI dịch/viết lại
    │   └─ chain → triggerAutoTts(job, srt) → tạo TTS audio
    │ job.aiContent    = SRT đã dịch
    │ job.ttsAudioPath = audio TTS
    │ job.ttsTimedSrt  = SRT timing khớp TTS
    ▼
[Pipeline 3 — pipeline3-finalize.js]
    │ finalizeVideo(job)
    │   Bước 1: adjust tempo
    │   Bước 2: tách vocal (optional)
    │   Bước 3: ghép audio → _with_voice.mp4
    │   Bước 4: burn sub   → _final.mp4
    ▼
job.finalOutputPath = _final.mp4
```

## Module Bridge Pattern

Vì `index.html` load `app.js` dạng `<script src="...">` (non-module),
các ES6 module được bridge qua `<script type="module">` inline trong HTML:

```html
<script type="module">
  import { triggerAutoAiRewrite } from './js/pipelines/pipeline1-ai.js';
  window.triggerAutoAiRewrite = triggerAutoAiRewrite;
  // ... tương tự cho các module khác
</script>
<script src="js/app.js" defer></script>
```

`app.js` gọi các hàm module qua `window.*`.
Các module tự gọi `window.addLog` và `window.showToast` (expose bởi app.js).

## Quy định HTML/CSS
- JS không được định nghĩa global function trên thẻ HTML (onclick="...").
  Phải dùng addEventListener trong các module components/.
- Mọi logic mới thuộc Pipeline 1 → pipeline1-ai.js.
- Mọi logic finalize video → pipeline3-finalize.js.
- Settings/Voice clone → settings.js.
- State toàn cục → store.js (hoặc window._appState cho tương thích).
