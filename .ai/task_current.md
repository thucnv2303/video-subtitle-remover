# Current Task

## Task Name
`FIX-VOICE-RENDER-POPUP-AND-SAVE-FLOW`

## Objective
1. Sửa lỗi modal Clone Voice không tự đóng sau khi chọn audio/lưu giọng trong tab Voice Render.
2. Tự động mở khóa nút Lưu khi đã chọn file audio mẫu, tự động điền tên giọng và đóng popup ngay lập tức sau khi lưu.
3. Sửa lỗi Save Dialog gắn đúng window context trong Electron main process.
- Scope: `src/renderer/js/ai-auto-remix.js`, `src/renderer/styles/ai-auto-remix.css`.

## User outcome
1. Tái thiết kế toàn diện tab **AI Video Auto-Remix** theo phong cách Futuristic Pro Dark Theme chuẩn 100% bản Demo Mockup:
   - **Cột 1 (Batch Video Queue):** Thẻ hàng đợi video hiện đại với icon mini play, tên file, số lượng clip và status badge màu sắc (Done xanh lá, Processing vàng cam nhấp nháy, Idle xám). Khung Drag & Drop mượt mà, hỗ trợ bấm chọn file trực tiếp và nạp thư mục.
   - **Cột 2 (Live AI Director & Remix Timeline):** 
     + Thống kê lọc mặt người trực quan (Đã loại bỏ X đoạn mặt - đỏ, Giữ lại Y cảnh sạch - xanh).
     + Danh sách Remix Timeline với dot tags (🟣 Hook, 🔵 Features, 🟢 Experience, 🟡 CTA) kèm nút ▶ xem trước phân cảnh.
     + Trình soạn kịch bản Voiceover tự động kèm thanh Keyword Chips (`[AI Hook] [Speed] [Features] [Quality]`).
     + Khung Product Thumbnail Preview 3D viền vàng neon và nhãn `⚡ VIRAL`.
   - **Cột 3 (Video Player & 1-Click Action):** Trình phát Video kết quả, thanh đo tiến độ Batch Progress (`Batch Progress: X/Y`), nút bấm phát sáng `🚀 START 1-CLICK AUTO REMIX` và Event Log Console dạng Terminal chuyên nghiệp.

## Gates
- Automated verification: PASS (Node syntax check pass, pipeline integration verified).
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.











