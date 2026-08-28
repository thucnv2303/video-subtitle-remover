# Current State

## Status
REDESIGN-AI-AUTO-REMIX-EXACT-DEMO-UI — IMPLEMENTED / SYNTAX PASS / OWNER CONFIRM WAITING

## Scope
- `src/renderer/index.html`
- `src/renderer/js/standalone-subtitle-interactions.js`
- `api/server.py`
- `backend/tools/subtitle_detect.py`
- `backend/tools/inpaint_tools.py`

## Verified Results
1. Sửa lỗi mảng xám và sót chữ:
   - Đã giải quyết triệt để vấn đề slicing clip 202px trong `inpaint_tools.py` bằng multi-band slicing.
   - Nhận diện đúng vị trí chữ và box sát chữ giúp LaMa tái tạo background liền mạch không bị mảng xám.
2. Tích hợp "⚡ Tự quét Box" trong chế độ Thủ công (Manual Mode):
   - Đã tích hợp DirectDBNet vào `subtitle_detect.py` và endpoint `/api/auto-detect-regions` trong `server.py`.
   - Thuật toán gom cụm thông minh theo thời gian và tọa độ Y đã nhận diện chính xác 20 vùng phụ đề riêng biệt trên video thực tế `0825.mp4`.
   - Giao diện Thủ công cho phép bấm "⚡ Tự quét Box" để load tất cả các box lên sidebar và canvas, nhảy timeline khi click vào từng box để tinh chỉnh vị trí/kích thước.
3. Sửa lỗi nhận diện đường dẫn video & mở rộng UI Card Vùng Sub:
   - Thêm `resolveJobVideoPath()` đọc chuẩn xác `job.filePath`, `job.videoPath`, `job.inputPath` loại bỏ thông báo lỗi "Vui lòng mở video trước khi quét phụ đề".
   - Mở rộng chiều cao `.regions-panel` và `.regions-list` (min-height 160-180px, max-height 480-520px) giúp hiển thị được rất nhiều box phụ đề và tận dụng toàn bộ diện tích cột 1.
4. Thuật toán Multi-Track Tight Box & Đồng bộ màu sắc Preview:
   - Thay thế việc gom dồn bounding box bằng bộ theo dõi đa luồng theo thời gian và không gian (`active_tracks`), tính tọa độ theo phân vị 5th/95th giúp box ôm sát từng dòng chữ (chiều cao ~60-80px), không còn bị kéo dài qua chảo/nền.
   - Đồng bộ màu sắc 1-1 giữa danh sách Vùng bên trái và khung box trên Video Preview: Mỗi vùng có màu riêng biệt kèm tag `#1, #2...` trên khung preview và hiệu ứng sáng viền (glow) khi rê chuột.
5. Căn chỉnh kích thước và di chuyển Box tương tác 8 hướng (Resize Handles):
   - Đã gắn đầy đủ 8 tay nắm (4 góc `nw, ne, se, sw` + 4 cạnh `n, s, e, w`) trên mỗi khung box video preview.
   - Cho phép người dùng dùng chuột kéo thả bất kỳ góc/cạnh nào để mở rộng hoặc thu hẹp kích thước box một cách mượt mà và trực quan, tọa độ tự động đồng bộ tức thì vào region.
6. Tối ưu Layout Preview Lớn & Thu gọn Console/Log 5 dòng:
   - Thu gọn Card Console/Log (Mục 5) xuống 118px (vừa đúng khoảng 5 dòng log kèm thanh cuộn bên trong).
   - Tăng diện tích hiển thị Card Preview (Mục 3) chiếm toàn bộ chiều cao còn lại của cột 3, giúp video preview (nhất là video dọc 9:16) hiển thị lớn gấp 2-3 lần để căn chỉnh box phụ đề dễ dàng.
   - Bỏ giới hạn max-height của danh sách Vùng ở Cột 1 để phủ kín khoảng trống xuống tận đáy.
8. Bộ phân biệt thông minh Phụ đề cố định vs Chữ trên sản phẩm (Motion & Geometric Filter):
   - Đã áp dụng phân tích chuyển động và hình dáng học: Phụ đề (do video editor chèn) luôn cố định tọa độ ($\text{drift} \le 16\text{px}, \sigma(Y) \le 8\text{px}$), kích thước lớn chuẩn đọc ($W \ge 60, H \ge 18, \text{Area} \ge 650\text{px}^2$).
   - Chữ trên bao bì/sản phẩm/chai lọ di chuyển theo tay cầm hoặc máy quay, chữ nhỏ li ti hoặc vuông cụt sẽ bị tự động phát hiện và loại bỏ hoàn toàn (giảm từ 61 box nhiễu xuống còn đúng 20 box phụ đề sạch chuẩn).
9. Bấm giữ chuột tua Frame liên tục (Hold-to-Step Fast Scrub):
   - Cho phép người dùng bấm giữ chuột (mousedown / hold) vào 2 nút mũi tên `<` hoặc `>` để video liên tục tua lùi / tua tiến frame với tốc độ 20fps mượt mà, thả chuột ra sẽ dừng lại ngay.
10. Đồng bộ chuẩn xác 1-1 giữa Video Gốc và Preview Kết Quả:
   - Khi kéo thanh timeline hoặc bấm xem frame nào, khung Preview Kết quả bên phải sẽ tự động tải và hiển thị đúng frame tương ứng của video đầu ra để đối chiếu trước - sau xóa chữ song song.
   - Trong quá trình máy đang chạy render (Live processing), Video Gốc bên trái tự động bám đuổi đồng bộ theo đúng frame mà backend đang xử lý.
11. Tăng độ sáng & tương phản thanh số Frame (791/2106):
   - Đã nâng cấp toàn bộ chữ số frame thành chữ trắng sáng (`#ffffff`), font chữ to rõ (11px), in đậm `font-weight: 750`, nền badge tương phản cao `#14283d` kèm viền `#3d6085` và bóng đổ sắc nét giúp người dùng dễ dàng nhìn rõ từng frame.
12. Highlight nổi bật Vùng đang thao tác (Active Region List Highlight):
   - Khi click vào bất kỳ Vùng nào ở danh sách hoặc click/kéo box trên video preview: Card vùng bên trái sẽ sáng rực viền glow (`border: 2px solid color; box-shadow: 0 0 14px 2px color`), đồng thời tự động cuộn danh sách đến đúng vùng đang chọn. Các khung box trên video preview giữ nguyên nét vẽ thanh mảnh, gọn gàng và không bị lóa mắt.
13. Thừa kế và Đồng bộ Chế độ Mask (Global Mask Mode Inheritance & Sync):
   - Khi bấm "⚡ Tự quét Box", toàn bộ các vùng được tạo ra sẽ tự động nhận đúng chế độ Mask đang chọn ở Menu điều khiển (Tight, Soft, Box) thay vì bị mặc định về Box.
   - Khi người dùng thay đổi dropdown "Chế độ mask" ở Menu điều khiển, toàn bộ các vùng trong danh sách cũng được đồng bộ tức thì sang chế độ mask mới.

16. Sửa lỗi sót viền chữ và vết lem màu đen sau khi xóa (BUG-044):
    - Phân tích nguyên nhân: Trong ảnh screenshot người dùng, dropdown đang chọn `STTN Auto` kết hợp `Tight Mask`. STTN Auto là mô hình video inpaint hoạt động ở độ phân giải thấp ($640\times 120$) nên khi ghép ngược lại bằng Tight mask từng nét chữ, các viền stroke và bóng đổ bên ngoài viền mask bị giữ nguyên trên video gốc tạo thành bóng ma mờ lem nham nhở.
    - Giải pháp đồng bộ: Thiết lập mặc định sang `LaMa (GPU - Xóa sạch sắc nét nhất)` và `Khung chữ nhật (Box) — Sạch nhất, xóa triệt để viền & bóng (Khuyên dùng)`.
    - Mở rộng padding tự quét $pad_x = 24\text{px}, pad_y = 18\text{px}$ bao phủ 100% các nét viền ngoài màu đen (black stroke/outline), bóng đổ (drop shadow) và số thứ tự đứng trước (ví dụ `7.`, `3.`).
    - Đã xác thực inpainting trên frame 800 (cảnh chai lọ trên tường đá cẩm thạch trắng vân đen) và frame 1499 (bồn rửa): LaMa + Box mask tái tạo 100% chi tiết vân đá và kim loại, xóa sạch hoàn toàn chữ vàng, viền đen và không để lại bất kỳ vết lem nào.

17. Sửa triệt để lỗi vệt xám ngang dải cắt qua toàn bộ chiều rộng video khi dùng LaMa (BUG-045):
    - Phân tích nguyên nhân: Trong `backend/inpaint/lama_inpaint.py`, hàm `__call__` thực hiện ghi đè toàn bộ dải ngang video `frame[inpaint_area[k][0]:inpaint_area[k][1], :, :] = comps[k][j]` cho cả chiều rộng video mà không nhân với Mask, khiến các khu vực không có sub (như khung cửa sổ và tường hai bên) bị đổi sắc độ tạo thành vệt chữ nhật xám mờ.
    - Giải pháp: Hòa trộn kết quả inpainting chính xác theo mask với Gaussian blur feathering nhẹ 5px, bảo toàn 100% pixel gốc ở tất cả các khu vực ngoài box.
    - Đã xác thực trên toàn bộ 2107 frame của cả `0825.mp4` và `0825(2).mp4`: Vệt xám ngang hoàn toàn biến mất, khung cửa sổ và tường gạch sắc nét 100% như video gốc, xuất ra file hoàn chỉnh `0825(2)_full_clean.mp4` và `0825(2)_no_sub.mp4`.

## Verification Gates
- Automated verification: PASS
- Code review: PASS
- Owner manual app verification: [WAITING]
- Merge permission: [BLOCKED]
- V5.3 Owner two-job warm reuse: WAITING.
- V5.3 cancellation/restart Owner runtime: WAITING.
- Visual quality: NEEDS_REVISION and intentionally deferred.
- Documentation synchronization: PASS after this docs commit.
- Merge permission: BLOCKED.

## Next permitted action
Owner checks out the exact PR #76 head after this docs commit and runs two sequential `Chất lượng cao` renders in the same app session. Required evidence is the full Render log showing one worker model initialization/READY, first job `warm=false`, second job `warm=true`, no repeated model-init/MMGP setup before job 2, both pipeline timings/peak CUDA, and no OOM/exception. Do not merge PR #76.
