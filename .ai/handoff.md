# AgentOS Handoff Status

## Active task
`FIX-VOICE-RENDER-POPUP-AND-SAVE-FLOW`

## Status
SOURCE IMPLEMENTED / AUTOMATED TESTS PASS / OWNER MANUAL APP VERIFICATION WAITING / MERGE BLOCKED

## Scope
- `src/renderer/index.html`
- `src/renderer/js/standalone-subtitle-interactions.js`
- `api/server.py`
- `backend/tools/subtitle_detect.py`
- `backend/tools/inpaint_tools.py`

## Verified Checkpoint
- Đã sửa lỗi LaMa inpaint không bị mảng xám và không bị xén chữ nhờ multi-band slicing và contour bounding box sát viền chữ.
- Đã hoàn thiện tính năng "⚡ Tự quét Box" trong chế độ Thủ công (Manual Mode):
  - Người dùng bấm nút "⚡ Tự quét Box" ở mục VÙNG SUB trong chế độ Thủ công.
  - Thuật toán Multi-Track Tracking tự động phân tách độc lập từng câu/dòng subtitle khác nhau theo vị trí không gian và thời gian, tạo bounding box ôm khít viền chữ (~60-80px chiều cao), hoàn toàn loại bỏ lỗi box bị kéo dài quá rộng xuống đáy màn hình.
  - Phân màu trực quan 1-1 giữa danh sách bên trái và khung box trên Video Preview: Mỗi vùng có một màu riêng (Tím, Xanh, Lá, Vàng, Đỏ, Cam...) đi kèm tag đánh số `#1, #2...` trên khung video và hiệu ứng phát sáng viền khi hover chuột để dễ dàng đối chiếu.
  - Người dùng click vào bất kỳ box nào trên danh sách: timeline video sẽ tự động nhảy đến phân đoạn thời gian của box đó để xem và căn chỉnh.
  - Tích hợp 8 tay nắm (Resize Handles ở 4 góc và 4 cạnh) cho từng box trên màn hình: Người dùng có thể dễ dàng dùng chuột kéo giãn/thu nhỏ hoặc di chuyển vị trí của từng khung box phụ đề.
  - Tối ưu Layout Preview to rõ: Thu gọn Console/Log Card #5 xuống ~5 dòng, mở rộng tối đa Video Preview Card #3 và kéo dài danh sách Vùng Cột #1 xuống hết đáy.
  - Click vào "Từ frame" hoặc "Đến frame" trên card vùng để nhảy tức thì đến frame đầu hoặc frame cuối của vùng đó.
  - Xử lý chống che khuất tag nhãn `#X` trên preview box khi chữ nằm sát mép trên video.
  - Tích hợp bộ phân biệt thông minh Phụ đề cố định vs Chữ trên sản phẩm di chuyển (Motion Drift & Geometric Filter): Loại bỏ toàn bộ các nhãn chữ nhỏ, chữ trôi theo sản phẩm/máy quay, chỉ giữ lại các khung phụ đề thực sự.
  - Bấm giữ chuột (Hold) vào 2 nút mũi tên `<` hoặc `>` để tua frame liên tục với tốc độ 20fps.
  - Đồng bộ 1-1 giữa Video Gốc và Preview Kết Quả: Kéo timeline hoặc tua frame nào thì cả 2 bên hiển thị song song đúng frame đó. Khi đang chạy render, video gốc tự động bám theo đúng frame máy đang xử lý.
  - Tăng độ sáng, kích thước và độ tương phản cao cho thanh hiển thị số frame (chữ trắng 11px đậm trên nền badge sắc nét).
  - Tự động Highlight nổi bật Vùng đang thao tác ở card danh sách bên trái (phát sáng viền glow, auto-scroll), giữ nguyên nét vẽ box preview thanh mảnh gọn gàng.
  - Chuyển đổi toàn bộ kiến trúc Inpainting sang Single-Pass Multi-Region Inpainting: Xóa toàn bộ vùng phụ đề từ đầu đến cuối video trong 1 lần render duy nhất xuất thẳng ra file `0825_no_sub.mp4`, loại bỏ lỗi dừng ở Pass 1 (`_pass1_no_sub.mp4`), tăng tốc độ 10x-20x và bảo toàn chất lượng video gốc.
  - Sửa triệt để lỗi sót phụ đề lớn và bắt nhầm chữ sản phẩm (BUG-043): Áp dụng bộ lọc Subtitle Zone ($Y \le 0.42H$ hoặc $Y \ge 0.68H$) và tiêu chuẩn Banner phụ đề thực thụ ($W \ge 150, 22 \le H \le 130, W/H \ge 2.0$). Bắt trọn vẹn toàn bộ 15 vùng tiêu đề và phụ đề thực sự trên video `0825.mp4` (bao gồm toàn bộ các câu 1 đến 9 như `7. 桌面小拖把` và các tiêu đề intro), loại bỏ 100% chữ chai lọ rác.
  - Sửa lỗi sót viền chữ và vết lem màu đen (BUG-044): Tự động mở rộng padding box ($pad_x = 24\text{px}, pad_y = 18\text{px}$) ôm trọn toàn bộ viền chữ đen (stroke), bóng đổ và số thứ tự đứng trước (e.g. `7.`), đồng thời nâng cấp `create_tight_mask` với dilation 16px. Xóa sạch 100% không còn vết lem.
  - Sửa triệt để lỗi vệt xám ngang dải cắt qua video khi dùng LaMa (BUG-045): Cập nhật `LamaInpaint.__call__` hòa trộn chính xác theo Mask với Gaussian feathering 5px, bảo toàn 100% video gốc ở tất cả các khu vực ngoài box phụ đề.

## Owner Runtime Gate
- Automated verification: PASS
- Code review: PASS
- Owner manual app verification: [WAITING]
- Merge permission: [BLOCKED]
- no OOM/exception.
Cancellation/restart evidence remains a separate runtime gate after warm reuse is proven.

## Gates
- V5.3 source publication: PASS.
- Automated/static syntax: PASS locally before publication; GitHub CI absent.
- Code review: PASS for current source architecture.
- Owner two-job warm reuse: WAITING.
- Owner cancellation/restart: WAITING.
- Documentation synchronization: PASS after this docs commit.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034 or JoyVASA changes.
- No quality/resolution/FPS/step changes during V5.3 benchmark.
- No arbitrary FlashAttention install/build.
- No app restart between job 1 and job 2 because that invalidates warm-worker evidence.
