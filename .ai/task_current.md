# Current Task

## Task ID
FIX-AI-AUTO-REMIX-FILE-PICKER-AND-UI-FLOW

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `src/renderer/js/ai-auto-remix.js`, `src/renderer/styles/ai-auto-remix.css`.

## User outcome
1. Sửa lỗi không bấm chọn tệp video được khi bấm "📁 Thêm Video" do sai định dạng object trả về từ `electronAPI.openFile`.
2. Biến toàn bộ khung Dropzone thành nút bấm chọn file trực quan (`📥 Kéo thả nhiều video vào đây hoặc bấm vào ô này để chọn tệp video`).
3. Hoàn thiện Demo luồng xử lý và giao diện 3 cột trực quan (Cột 1: Hàng đợi Multi-Video; Cột 2: Đạo diễn AI Lọc mặt, Timeline & Kịch bản + Thumbnail Studio; Cột 3: Trình chiếu Video & Nút 1-Click).

## Gates
- Automated verification: PASS.
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.










