# Current Task

## Task ID
FIX-VIDEO-RENDER-FILE-PICKER-AND-DRAG-DROP

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `src/renderer/js/video-render.js`.

## User outcome
1. Khắc phục triệt để lỗi không mở được hộp thoại chọn file video ở tab Video Render (chuẩn hóa gọi qua `electronAPI.openFile(...)`).
2. Bổ sung hỗ trợ **Kéo thả chuột trực tiếp (Drag & Drop)** file video vào cửa sổ ứng dụng để mở ngay lập tức.
3. Thêm fallback input file chuẩn HTML5 để đảm bảo luôn mở được file trong mọi môi trường.

## Gates
- Automated verification: PASS.
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.




