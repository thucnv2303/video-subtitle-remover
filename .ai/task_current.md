# Current Task

## Task ID
FIX-VIDEO-RENDER-HASH-FILENAME-ENCODING-AND-CLIP-PREVIEW

## Status
SOURCE_IMPLEMENTED_SYNTAX_PASS_TESTED_OWNER_CONFIRM_WAITING

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Scope: `src/renderer/js/video-render.js`.

## User outcome
1. Sửa lỗi không phát được video thành phẩm và video nguồn khi tên file chứa ký tự `#` (hashtag từ TikTok/YouTube) bằng hàm `toMediaUrl` mã hóa `%23`.
2. Khắc phục lỗi bấm xem trước từng phân đoạn (`▶`) bằng cách lắng nghe sự kiện `loadedmetadata` trước khi gán `currentTime`, loại bỏ lỗi video bị đen hoặc không phát được.

## Gates
- Automated verification: PASS.
- Code review: PASS.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.






