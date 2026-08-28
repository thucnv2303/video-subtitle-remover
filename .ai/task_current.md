# Current Task

## Task ID
VIDEO-RENDER-REMOVE-VOCAL-PRESERVE-BGM

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `api/server.py`, `src/renderer/js/api.js`, `src/renderer/js/video-render.js`.

## User outcome
1. Bổ sung tính năng **Xóa giọng nói gốc (Voice/Vocal Removal) và giữ lại toàn bộ âm thanh nền / nhạc nền (BGM)** cho video.
2. Tích hợp tùy chọn `[x] Xóa giọng nói gốc` trực tiếp trong quy trình Cắt & Ghép video tại Tab **Video Render**.
3. Cung cấp nút tiện ích 1-Click: **`🎵 Tách nhạc nền video nguồn`** để xuất video không còn lời thoại hoặc bóc tách nhạc nền BGM độc lập.
4. Backend hỗ trợ xử lý đa tầng (AI Demucs -> Librosa stereo center separation -> FFmpeg cancellation).

## Gates
- Automated verification: PASS (Đã kiểm thử tự động bóc tách vocal và tạo video nền BGM thành công).
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.



