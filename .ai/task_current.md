# Current Task

## Task ID
FEATURE-SMART-THUMBNAIL-STUDIO-WITH-UNIFIED-MULTI-VIDEO-NAMING

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `api/thumbnail_generator.py`, `api/server.py`, `src/renderer/js/api.js`, `src/renderer/js/ai-auto-remix.js`, `src/renderer/styles/ai-auto-remix.css`.

## User outcome
1. Tích hợp module **Thumbnail Studio (`api/thumbnail_generator.py`)** tự động quét tìm frame sản phẩm sắc nét nhất từ video (đo điểm Laplacian clarity) và thiết kế ảnh Thumbnail chuyên nghiệp với viền 3D, tiêu đề nổi bật và nhãn trending.
2. Chuẩn hóa quy trình đặt tên đồng bộ 100% cho mọi tác vụ chạy Multi-Video hàng loạt:
   - Video Remix: `<base_name>_REMIX.mp4`
   - Thumbnail sản phẩm: `<base_name>_THUMBNAIL.jpg`
   - Frame sản phẩm gốc: `<base_name>_PRODUCT_FRAME.jpg`
   - Kịch bản lồng tiếng: `<base_name>_SCRIPT.txt`
3. Cập nhật giao diện tab **AI Auto-Remix** hiển thị trực tiếp ảnh Thumbnail preview và cho phép mở xem/tải ảnh tức thì.

## Gates
- Automated verification: PASS (Đã kiểm thử trọn gói tạo 4 tệp tài nguyên đồng nhất tên thành công).
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.









