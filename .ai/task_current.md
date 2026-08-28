# Current Task

## Task ID
FEATURE-AI-AUTO-REMIX-MULTI-VIDEO-DIRECTOR

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `api/face_detector.py`, `src/renderer/js/ai-auto-remix.js`, `src/renderer/styles/ai-auto-remix.css`, `api/server.py`, `src/renderer/js/api.js`, `src/renderer/index.html`.

## User outcome
1. Tạo tab mới **AI Auto-Remix (Smart Multi-Video Director)** với giao diện 3 cột Dark Mode tối ưu.
2. Tích hợp bộ quét nhận diện khuôn mặt siêu tốc bằng OpenCV Haar / Face Detection, tự động phát hiện và loại bỏ triệt để các frame chứa mặt người.
3. Tích hợp AI Local Director (Ollama) tự động tái cấu trúc Timeline cắt dựng hấp dẫn (Hook -> Tính năng -> Trải nghiệm -> CTA) và tự sinh kịch bản Voiceover lồng tiếng có cảm xúc, nhấn nhá.
4. Tự động hóa 1-Click Multi-Video: Nạp hàng loạt video hoặc thư mục, xử lý trọn gói từ A-Z chỉ với 1 nút bấm (Lọc mặt -> Cắt ghép -> TTS Voice -> Khử giọng cũ giữ BGM -> Xuất video).

## Gates
- Automated verification: PASS (Đã kiểm thử trọn gói toàn bộ pipeline 1-Click trên video thực tế).
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.








