# Current Task

## Task ID
FIX-SERVER-SYNTAX-ERROR-AND-FETCH-FAILED

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `api/server.py`.

## User outcome
1. Sửa khối `except` bị thiếu trong `api_remove_vocal` trên `api/server.py`, giúp FastAPI server khởi động hoàn toàn sạch sẽ, không còn lỗi SyntaxError.
2. Khắc phục triệt để lỗi `Failed to fetch` khi bấm "Tách nhạc nền video nguồn" hoặc "Cắt & Ghép video".

## Gates
- Automated verification: PASS (Đã kiểm tra import python `api.server` thành công 100%).
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.





