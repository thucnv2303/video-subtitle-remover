# Current Task

## Task ID
FIX-VOICE-RENDER-LOCAL-AI-OLLAMA-INTEGRATION

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `src/renderer/js/voice-render.js`, `api/server.py`.

## User outcome
1. Sửa lỗi `No API key configured` khi bấm "✨ AI Thêm cảm xúc & Nhấn nhá" với AI Local (Ollama) bằng cách đọc đúng `ai_model_ollama`, `ai_endpoint` và bỏ qua yêu cầu API key đối với Local LLM.
2. Tối ưu backend `api_ai_rewrite` để phân biệt chính xác giữa kịch bản text nói thường và phụ đề SRT có timestamp.

## Gates
- Automated verification: PASS (Đã kiểm thử khởi tạo payload Ollama thành công).
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.







