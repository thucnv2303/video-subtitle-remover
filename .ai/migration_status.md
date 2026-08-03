# Trạng thái di chuyển thư mục (Migration Status)

*Cập nhật lần cuối: 2026-08-03*

## Refactor lần 2 — Pipeline Architecture

### Thay đổi chính:
- **Pipeline 1** (pipeline1-ai.js): Gộp AI Rewrite + TTS thành một chain liên tục.
  `triggerAutoAiRewrite` → AI xong → tự động `triggerAutoTts`.
  TTS lưu `job.ttsAudioPath`, `job.ttsTimedSrt` — KHÔNG ghép video ở đây.
- **Pipeline 3** (pipeline3-finalize.js): Module MỚI — hoàn thiện video.
  Nhận video đã xóa sub + audio TTS từ Pipeline 1, ghép audio, burn subtitle → `_final.mp4`.
- **pipeline3-sub.js**: Re-export alias sang pipeline3-finalize.js.
- **app.js**: Viết lại từ đầu — điều phối đúng 3 pipeline, fix bug log/prompt.

### Các Module đã implement đầy đủ:
1. `[x]` **store.js** — Global state
2. `[x]` **dom.js** — DOM refs
3. `[x]` **logger.js** — addLog (dual-signature), showToast (dual-signature), tab filtering
4. `[x]` **formatters.js** — fmtTime, fmtTimeFull, formatFileSize, fmtPercent, msToSrtTime
5. `[x]` **prompt-manager.js** — initPromptManager, renderPromptDropdown (modal buttons fixed)
6. `[x]` **video-preview.js** — Live preview polling
7. `[x]` **job-manager.js** — createJob, renderJobList, processNextJob, onJobFinished, loadVideo
8. `[x]` **pipeline1-ai.js** — AI rewrite + TTS chain (kết quả lưu vào job, không ghép video)
9. `[x]` **pipeline2-remove.js** — Tham khảo (logic tích hợp vào app.js)
10. `[x]` **pipeline3-finalize.js** — Finalize: ghép audio + burn sub → _final.mp4
11. `[x]` **pipeline3-sub.js** — Re-export alias
12. `[x]` **settings.js** — loadSettingsValues, voice clone, TTS test, checkTTSStatus

### Bugs đã fix:
- `[x]` Card log chưa hiển thị log — logger.js hỗ trợ dual-signature, app.js expose `window.addLog`
- `[x]` Nút popup quản lý prompt không hoạt động — prompt-manager.js fix signature showToast, bind cả step1 buttons
- `[x]` settings.js stub rỗng — implement đầy đủ
- `[x]` formatters.js stub rỗng — implement đầy đủ
- `[x]` pipeline3-sub.js stub rỗng — re-export pipeline3-finalize

### Vấn đề còn lại:
- Pipeline 3 UI (Step 3 — Export Final) chưa wire button `btn-export-final` vào `finalizeVideo()`
- Step 3 video preview (`step3-video-preview`) chưa load video khi chọn job finished
