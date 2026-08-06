# Guidelines for AI coding assistant

1. **Kiểm tra kiến trúc trước tiên (Architecture First)**: LUÔN LUÔN đọc file `.ai/architecture.md` và tuân thủ tuyệt đối sơ đồ cây thư mục trước khi sửa chữa hoặc thêm tính năng mới.
2. **Tìm file đúng nhánh (Trace the Tree)**: Mỗi khi cần thêm tính năng mới hoặc sửa lỗi, phải lần theo cây thư mục đã có để tìm file phù hợp hoặc thêm file vào đúng nhánh. TUYỆT ĐỐI TRÁNH việc tự ý tạo nhánh mới, thư mục mới, hoặc file mới trong khi nhánh cũ có cùng chức năng đã tồn tại.
3. **Không triển khai bừa bãi (No haphazard deployment)**: Phân tích kỹ xem tính năng thuộc về Pipeline nào (1, 2, hay 3), thuộc về UI Component nào, hay thuộc về Utils/API. Đặt code đúng chỗ.
4. **Cách ly file nguyên khối cũ (Avoid Monoliths)**: Không viết thêm code logic mới vào `app.js` trừ khi bắt buộc để tương thích. Mọi logic mới phải đưa vào các module tương ứng trong `src/renderer/js/`.
5. **Quản lý trạng thái (State Management)**: Không tự ý tạo biến trạng thái toàn cục trong từng file. Đọc và ghi state qua module quản lý trạng thái tập trung (ví dụ: `store.js`).
6. **ES6 Modules**: Sử dụng chuẩn import/export của ES6 để liên kết các file. Tránh làm ô nhiễm object `window` (global scope).

## INCIDENT-RECOVERY-007E: Small-Fix Governance Directive
- Never blindly reuse or apply a patch broader than what is strictly required to fix the user-reported issue.
- Small cosmetic fixes bundled with layout fixes must be stripped unless explicitly verified as required for layout.
- Always write precise test assertions that do not allow false positives through loose substring matching.
- Commits must isolate source/tests from documentation/evidence to avoid dirty diffs and hook circumventions.
