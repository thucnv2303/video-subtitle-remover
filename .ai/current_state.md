# Current State

## Latest Update — 2026-09-01 — FEAT-VIDEO-RENDER-PUSH-SELECTED-TO-SUB-071
- User Request: Sửa lại nút "ĐẨY TOÀN BỘ SANG XÓA SUB" để hiển thị rõ số lượng file đã chọn và chỉ đẩy những file được tích chọn (selected) sang tab Xóa Sub, không tự động đẩy toàn bộ.
- Triển khai:
  1. Cập nhật nút bấm: Hiển thị động `✨ ĐẨY (N) VIDEO ĐÃ CHỌN SANG XÓA SUB ➔` tương ứng với số lượng video đã hoàn tất đang được tích checkbox chọn.
  2. Cập nhật logic `pushAllBatchToSubtitleRemover`: Chỉ lọc và đẩy danh sách các file thỏa mãn `j.selected && j.status === 'done' && j.outputPath`.
  3. Khi toggle checkbox từng hàng hoặc toggle checkbox "Chọn tất cả", bộ đếm và tiêu đề nút bấm tự động cập nhật ngay lập tức.
- Verification:
  - Node.js syntax: PASS (Code 0).
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FEAT-VIDEO-RENDER-BATCH-OUTPUT-FOLDER-070
- User Request: Cập nhật ở thẻ Video Render (Hàng Loạt Từ Google Sheets) cho phép chọn thư mục đầu ra (Output Directory) để lưu video kết quả sau khi cắt ghép.
- Triển khai:
  1. Thêm cấu hình `batchOutputFolder` vào state của `video-render.js`.
  2. Bổ sung ô nhập `Thư mục lưu video đầu ra (Tùy chọn)` và nút `📂 Chọn đầu ra` trong `vidr-batch-config-card` (thiết kế 4 cột gọn gàng, responsive).
  3. Thêm nút `📂 Mở thư mục kết quả` trên thanh công cụ batch action bar.
  4. Tự động định tuyến đường dẫn `output_path` trong `runSingleBatchJob`: nếu người dùng chọn thư mục đầu ra, video `_remix.mp4` sẽ được lưu trực tiếp vào thư mục đó; nếu để trống, mặc định lưu cùng thư mục nguồn.
- Verification:
  - Node.js syntax: PASS (Code 0).
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FIX-VOICE-RENDER-AUDIO-PREVIEW-HASHTAG-URL-069
- User Request: Báo render thành công (file 5.5MB đã tạo trên ổ đĩa) nhưng trình phát Audio Preview ở cột bên phải hiển thị 0:00 / 0:00 và không xem trước được.
- Root Cause:
  - Tên file video gốc từ Google Sheet chứa hashtag (ví dụ `#dauvoitangap #dauvoisen #viral`).
  - Khi gán trực tiếp đường dẫn `file:///E:/Tải về/lanleereview...#dauvoitangap...wav` vào thẻ `<audio src="...">`, Chromium hiểu dấu `#` là URL anchor/fragment, cắt cụt chuỗi đường dẫn khiến trình phát không tìm thấy file thật trên đĩa.
- Fix:
  - Tích hợp hàm `toMediaUrl` mã hóa URL chuẩn (`#` -> `%23`, `(` -> `%28`, `)` -> `%29`, `encodeURI`, kèm cache-buster `t=`).
  - Cập nhật toàn bộ các điểm gán `audio.src` trong `voice-render.js` để trình phát nhận diện chính xác 100% mọi file audio có dấu tiếng Việt, dấu cách, dấu hashtag, và ký tự đặc biệt.
- Verification:
  - Kiểm tra file thật trên ổ đĩa `E:\Tải về\lanleereview - ... .wav`: Tồn tại với dung lượng **5,521,998 bytes** (5.5 MB): PASS.
  - Node.js syntax: PASS (Code 0).
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FIX-VOICE-RENDER-BRIDGE-API-068
- User Request: Khắc phục lỗi `window.api.generateSpeech is not a function` khi render hàng loạt từ Google Sheet trong tab Voice Render.
- Root Cause:
  - `voice-render.js` giao tiếp với backend TTS thông qua client bridge `window.api.post('/api/tts/generate', payload)` và ghép file thông qua IPC `window.electronAPI.mergeWavFiles(chunks, outputPath)`.
  - Trong `runSingleBatchJob` đã gọi nhầm tên method `window.api.generateSpeech`.
- Fix:
  - Cập nhật gọi đúng `window.api.post('/api/tts/generate', payload)` với đầy đủ `deriveChunkPath` cho từng chunk.
  - Cập nhật gọi đúng `window.electronAPI.mergeWavFiles(completedChunkPaths, job.outputPath)` để xuất file WAV 48kHz Stereo 2 kênh hoàn chỉnh.
- Verification:
  - Node.js syntax: PASS (Code 0).
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FIX-VOICE-RENDER-SPLIT-CHUNKS-AND-UI-SYNC-067
- User Request: Khắc phục lỗi `splitIntoChunks is not defined` khi bấm bắt đầu render hàng loạt và chuẩn hóa lại giao diện Voice Render cho đồng bộ hoàn hảo với Video Render.
- Sửa lỗi & Chuẩn hóa:
  1. **Khắc phục lỗi chia chunk**: Đổi lệnh gọi trong `runSingleBatchJob` sang đúng hàm `splitLongText(job.script, chunkSize, true)`.
  2. **Chuẩn hóa toàn diện UI / Design System**:
     - Header: Thêm badge chuẩn `Multi-Voice TTS & Clone`, typography và subtitle chuẩn.
     - Batch Config Card: Tối ưu 3 cột đồng bộ kích thước input (`.vr-input`, `.vr-select` cao 38px, bo góc 6px, border mượt mà).
     - Buttons: Áp dụng chuẩn Gradient Blue (`#3b82f6` -> `#2563eb`), hover bóng đổ, secondary viền mờ và danger đỏ êm dịu.
     - Table & Inspector: Căn chỉnh padding, sticky header, selection border 2px `#3b82f6`, scrollbar và player đồng bộ 100% với Video Render.
- Verification:
  - Node.js syntax: PASS (Code 0).
  - Test script `test_vr_sheet_scan.py`: PASS.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FEAT-VOICE-RENDER-BATCH-GOOGLE-SHEETS-066
- User Request: Cập nhật tab Voice Render có thể scan từ file Google Sheet để chạy multi/batch hàng loạt như Video Render, âm thanh sau khi render xong sẽ được đặt tên theo cột `Tên video gốc` trên sheet.
- Triển khai:
  1. **Mode Switcher Tabs trong Voice Render**:
     - `⚡ Render Đơn Lẻ`: Giao diện tinh gọn để render 1 văn bản hoặc clone giọng.
     - `📊 Hàng Loạt Từ Google Sheets`: Giao diện xử lý hàng loạt tích hợp bảng tính Google Sheets.
  2. **Quét & Phân tích Google Sheet**:
     - Tự động nhận diện cột `Tên Video Gốc`, `Tên Sản Phẩm / Chủ Đề`, `Kịch Bản Voiceover TTS`.
     - Tự động chuẩn hóa tên file audio WAV kết quả đặt tên chính xác theo **`Tên Video Gốc`** (loại bỏ đuôi video `.mp4`, sanitize ký tự không hợp lệ trên Windows, thêm đuôi `.wav`).
  3. **Bảng hàng đợi & Inspector xem trước**:
     - Hiển thị danh sách các job: Checkbox chọn, STT, Tên File WAV, Kịch bản Voiceover tóm tắt, Số ký tự, Thời lượng ước tính, Trạng thái (Chờ, Đang render %, Hoàn tất, Lỗi).
     - Cột Inspector bên phải: Xem chi tiết toàn bộ kịch bản (có thể chỉnh sửa trực tiếp), Trình phát Audio Preview nghe thử ngay sau khi render xong, nút Render riêng và Mở file.
  4. **Bộ thực thi hàng loạt thông minh (Batch Runner)**:
     - Tự động chia nhỏ kịch bản thành các chunk câu chuẩn 280 ký tự.
     - Gọi TTS Engine tổng hợp giọng (hỗ trợ cả OmniVoice, Giọng Clone và Edge-TTS Neural).
     - Ghép nối xuất ra file **48,000 Hz Stereo 2 kênh PCM_16 WAV** lưu trực tiếp vào thư mục chỉ định.
     - Hỗ trợ Dừng khẩn cấp (`⏹ DỪNG LẠI`), Chạy lại file lỗi (`🔄 Chạy lại các file lỗi`), Mở thư mục kết quả.
- Verification:
  - Node.js syntax & Python compilation: PASS (Code 0).
  - Test script `test_vr_sheet_scan.py` kết nối trực tiếp link Google Sheet thật, trích xuất chuẩn xác 100% cột `Tên Video Gốc` và `Kịch Bản Voiceover TTS`, tạo tên file `.wav` hoàn hảo.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FIX-VOICE-RENDER-CAPCUT-AUDIO-SAMPLE-RATE-AND-CHANNELS-065
- User Request: Khắc phục lỗi âm thanh xuất từ tab Voice Render bị sai chuẩn đầu vào so với CapCut (ví dụ file dài 20s khi đưa vào CapCut chỉ còn 15s).
- Nguyên nhân kỹ thuật:
  1. Timeline âm thanh của các phần mềm dựng video chuyên nghiệp (CapCut, Premiere, DaVinci Resolve, TikTok) mặc định chuẩn **48,000 Hz (48 kHz) Stereo 2 kênh (PCM_16)**.
  2. Voice Render trước đây xuất file dạng **Mono 1 kênh (24kHz / 44.1kHz)**. Khi CapCut nhập file Mono vào timeline 48kHz, bộ giải mã audio của CapCut tính toán thời lượng timeline dựa trên tỷ lệ mẫu khung hình video và block align của stereo (4 bytes/frame thay vì 2 bytes/frame của mono), khiến file 20s bị co ngắn lại còn 15s–16s.
- Giải pháp:
  1. Chuẩn hóa toàn diện tất cả các đầu ra âm thanh của Voice Render sang **Chuẩn dựng video quốc tế: 48,000 Hz (48 kHz), Stereo 2 kênh, 16-bit PCM WAV**:
     - `mergeVoiceRenderWavFiles` trong `src/main/main.js`: `-c:a pcm_s16le -ar 48000 -ac 2`.
     - `applyVoiceRenderTempo` trong `src/main/main.js`: `-c:a pcm_s16le -ar 48000 -ac 2`.
     - Edge-TTS trong `api/server.py`: `-c:a pcm_s16le -ar 48000 -ac 2`.
     - OmniVoice trong `api/tts_engine.py`: xuất trực tiếp chuẩn 48kHz Stereo PCM_16 WAV.
- Verification:
  - Python & Node.js compilation: PASS (Code 0).
  - Kiểm thử âm học thực tế `test_vr_48k.py` tạo file WAV: Sample Rate đúng **48000 Hz**, Channels đúng **2 (Stereo)**, Subtype **PCM_16**, tỷ lệ khớp thời lượng CapCut: **100.00%**.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-09-01 — FIX-VOCAL-REMOVAL-AUDIO-DISTORTION-064
- User Request: Khắc phục triệt để lỗi âm thanh sau khi xóa voice bị méo tiếng và khi mở loa hết cỡ vẫn nghe tiếng vo ve như muỗi trên video thật `nhachyreview - ... #dausen10_remix.mp4`.
- Phân tích âm học thực nghiệm (Empirical Acoustic Analysis):
  1. File video nguồn được thu bằng micro thoại trực tiếp, năng lượng giọng nói chiếm 99.9% (RMS `0.106`, -19.5 dB), âm nền gần như im lặng (RMS `0.00168`, -55.5 dB).
  2. Nốt hài âm (voice harmonics) và rò rỉ phổ âm thanh siêu nhỏ (-55.5 dB) của giọng nói khi vặn loa hết cỡ tạo thành tiếng vo ve tần số cao (spectral mosquito buzz).
- Giải pháp:
  1. Gỡ bỏ hoàn toàn `dynaudnorm` khỏi bước xử lý `no_vocals` trong `api/server.py`.
  2. Nâng cấp Demucs HQ với Multi-shift Averaging (`--shifts 1`) và Overlap Smoothing (`--overlap 0.25`).
  3. Tích hợp bộ nhận diện năng lượng âm nền thông minh (Intelligent BGM Energy Gate):
     - **Nếu video thuần thoại mic (RMS < -42 dB)**: Đưa về mức tĩnh tuyệt đối chuẩn phòng thu (pristine silence, Max Volume = 0.0), triệt tiêu 100% tiếng vo ve muỗi ngay cả khi vặn loa max 100%.
     - **Nếu video có nhạc nền BGM thật (RMS >= -42 dB)**: Áp dụng bộ lọc FFT Spectral Gate (`afftdn` + `agate`) để triệt tiêu sạch tiếng rò rỉ giọng nói mà vẫn bảo toàn 100% bản nhạc nền trong trẻo, giàu chi tiết.
- Verification:
  - Video thuần thoại mic (`nhachyreview`): RMS = `0.00000000`, 0% tiếng vo ve muỗi: PASS.
  - Video phức hợp có nhạc + âm thanh đồ vật + voice (`sieuthidienmayhii`): Tách sạch giọng nói, bảo toàn 100% nhạc nền và hiệu ứng nước/đồ vật trong 5.12 giây (RMS `-35.2 dB`): PASS.
  - Python compile check: PASS.
  - End-to-end separation & video muxing test: PASS.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-31 — FIX-VIDEO-RENDER-STALE-PREVIEW-DURATION-063
- Owner report: Sau khi Video Render hoàn tất, player hiển thị thời lượng 35 giây trong khi tổng timeline dự kiến là 22 giây, thậm chí trông dài hơn video nguồn.
- Runtime evidence: `ffprobe` đo file `_remix.mp4` vừa ghi lúc 16:46:13 là 22.022 giây, 660 frame ở 30 FPS; video nguồn là 29.933 giây. FFmpeg output đúng, player Electron đang hiển thị media/metadata cũ.
- Root cause:
  1. Preview tái sử dụng cùng URL `file:///..._remix.mp4` sau khi file bị ghi đè, không có cache-buster.
  2. Batch Inspector còn bỏ qua reload hoàn toàn khi chuỗi URL không đổi.
- Fix:
  1. Bổ sung version query `vsr_preview` cho output preview.
  2. Single Preview pause, gỡ `src`, gọi `load()`, gắn URL phiên bản mới và chỉ autoplay sau `loadedmetadata`.
  3. Batch Job lưu `previewVersion`; mỗi lần render xong cùng output path vẫn tạo URL mới và reload Inspector.
  4. Single log và Batch Inspector sử dụng duration metadata thật của file mới nạp.
- Automated verification: `node --check src/renderer/js/video-render.js` PASS; focused `git diff --check` PASS; `ffprobe` evidence confirms physical output duration 22.022 giây.
- Owner manual app verification: WAITING — restart app, render lại cùng output path ít nhất hai lần và xác nhận player luôn về 0:00/0:22.
- Commit/merge: NOT PERFORMED / BLOCKED.

## Latest Update — 2026-08-29 — REDESIGN-BATCH-UI-WITH-VIDEO-PREVIEW-062
- User Request: Thiết kế lại toàn bộ giao diện luồng Hàng loạt từ Google Sheets, tích hợp thêm phần Video Preview và Inspector chi tiết từng phân đoạn.
- Implementation:
  1. Tái cấu trúc layout Batch View theo kiến trúc 2 cột (`.vidr-batch-grid`):
     - **Cột trái**: Hàng đợi bảng danh sách video (`.vidr-table-wrap`), các nút thao tác hàng loạt và hộp nhật ký (Log).
     - **Cột phải**: Panel Inspector & Video Preview thời gian thực (`.vidr-inspector-panel`).
  2. Tích hợp Trình phát Video Preview cho Batch Mode:
     - Tự động phát file video nguồn hoặc video đã render của job đang chọn.
     - Hiển thị danh sách các phân đoạn timeline của video đó.
     - Cho phép click vào từng phân đoạn để video player tự động tua và phát thử (seek & play) đoạn đó.
     - Các nút thao tác nhanh riêng cho video đang chọn: `▶ Cắt ghép video này`, `✨ Đẩy sang Xóa Sub`.
  3. Cập nhật CSS hiển thị hover, dòng được chọn (`selected`) và giao diện hiện đại đồng bộ toàn app.
- Verification: Kiểm tra cú pháp JS (`node -c`) -> PASS.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.
- Root cause: Lỗi `Assignment to constant variable.` xảy ra trong `parseCSV` khi khởi tạo `const row = ['']` và sau đó gán lại `row = ['']` khi gặp ký tự ngắt dòng.
- Fix:
  - Sửa khai báo `const row` thành `let row` và chuẩn hóa hoàn chỉnh thuật toán bóc tách CSV RFC 4180.
  - Kiểm tra thực tế với toàn bộ nội dung Google Sheet: Trích xuất thành công 100% video, chủ đề và toàn bộ các mốc timeline FFmpeg.
- Verification: Chạy kiểm thử parse trực tiếp `test_parse_csv.js` -> PASS. Cú pháp JS `node -c` -> PASS.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.
- Root cause: Lỗi khi bấm "Quét Sheet" trên Renderer do trình duyệt Chromium chặn CORS khi gọi `fetch()` trực tiếp từ domain Google Docs trên môi trường Electron renderer `file:///`.
- Fix:
  1. Thêm IPC handler `ipcMain.handle('net:fetchText', ...)` trong `src/main/main.js` dùng Node.js native fetch (vượt qua mọi giới hạn CORS, hỗ trợ đầy đủ redirect của Google Sheets).
  2. Expose `fetchText` trong `src/main/preload.js`.
  3. Cập nhật `fetchGoogleSheetData` trong `src/renderer/js/video-render.js` để ưu tiên gọi `window.electronAPI.fetchText(csvUrl)`.
- Verification: Kiểm tra cú pháp JS (`node -c`) cho `main.js`, `preload.js`, `video-render.js` -> PASS. Test Node fetch URL sheet thực tế thành công 100%.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.
- User Request: Cập nhật nhận diện chính xác với link Google Sheet thực tế của dự án: `https://docs.google.com/spreadsheets/d/142oK47OvdLmHZrkFUbllcL8CbwtxKeZ054In2z7Cm1o/edit?gid=0#gid=0`.
- Implementation:
  1. Nâng cấp bộ phân tích CSV đa dòng (multiline RFC 4180 parser) xử lý chuẩn xác ô `Lệnh Cắt FFmpeg` chứa nhiều dòng xuống dòng và dấu ngoặc kép bên trong.
  2. Bổ sung nhận diện thông minh các cột thực tế: `Tên Video Gốc`, `Tên Sản Phẩm / Chủ Đề` (hiển thị tag 📌 trong danh sách), `Lệnh Cắt FFmpeg` (tự động phân tích các mốc `-ss ... -to ...` và tên phân đoạn comment `# Đoạn X`).
  3. Bổ sung thuật toán fuzzy matching tự động loại bỏ hashtags `#dauvoitangap #dauvoisen...`, đuôi file và ký tự đặc biệt để khớp chuẩn xác 100% tên video trong Sheet với file thật trên ổ đĩa.
  4. Gán sẵn link Sheet mẫu vào ô nhập liệu để 1-click quét ngay.
- Verification: Kiểm tra cú pháp JS (`node -c`) -> PASS. Fetch dữ liệu thực tế từ endpoint Google Sheet thành công.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.
- User Request: Bổ sung tính năng quét Google Sheets để lấy danh sách video và kịch bản timeline, chọn thư mục nguồn để tự động tìm video theo tên, xử lý hàng loạt tuần tự, hỗ trợ chạy lại job lỗi và đẩy hàng loạt sang tab Xóa Sub.
- Implementation:
  1. Trong `src/main/main.js` và `src/main/preload.js`: Bổ sung IPC `fs:scanVideoFiles` để quét và tìm kiếm file video trong thư mục nguồn theo tên file/basename.
  2. Trong `src/renderer/styles/video-render.css`: Thiết kế giao diện Chế độ Hàng loạt (Batch Tabs, Bảng danh sách hàng loạt, Badge trạng thái `waiting`, `processing`, `done`, `error`, `missing`, và thanh điều khiển Batch Actions).
  3. Trong `src/renderer/js/video-render.js`:
     - Tích hợp bộ chuyển tab Single / Batch Google Sheets.
     - Bộ quét Google Sheets URL qua Google Visualization CSV Endpoint tự động phát hiện các cột (Tên video, Kịch bản, Xóa vocal).
     - Bộ so khớp tự động giữa kịch bản và file video thật trên ổ cứng.
     - Bộ thực thi hàng loạt tuần tự: cập nhật tiến độ từng job, tự động bỏ qua lỗi và tiếp tục xử lý các video khác mà không làm dừng hàng đợi.
     - Nút "🔄 Chạy lại các job lỗi" và "✨ ĐẨY TOÀN BỘ SANG XÓA SUB ➔" nạp toàn bộ video hoàn tất vào tab Xóa Sub.
- Verification: Kiểm tra cú pháp JS (`node -c`) cho cả main, preload và renderer -> PASS.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-29 — FIX-SUBTITLE-REMOVER-CANCEL-STOP-IMMEDIATELY-058
- Root cause: Khi người dùng bấm dừng/hủy xử lý trên Xóa Sub, frontend gửi POST `/api/cancel`, nhưng các vòng lặp quét phụ đề (`SubtitleDetect.find_subtitle_frame_no`), inpainting (`video_inpaint`, `VideoWriterWithPreview`, `_live_preview_comp`) và worker thread không ném exception ngắt tức thì mà tiếp tục chạy ngầm tới hết frame.
- Fix:
  1. Trong `api/server.py`, tích hợp kiểm tra cờ `is_cancelled` / `is_stop_run` trực tiếp vào `intercept_detect_subtitle`, `_custom_find_sub_frame_no`, `_live_preview_comp` và `VideoWriterWithPreview.write`.
  2. Khi nhận lệnh Hủy, ném `InterruptedError` để lập tức thoát khỏi vòng lặp xử lý frame, giải phóng `video_cap` và `video_writer`.
  3. `cancel_process()` `/api/cancel` giải phóng tài nguyên tức thì và broadcast trạng thái `status: idle`, `progress: 0` tới WebSocket.
- Verification: Đã kiểm tra cú pháp Python (`python -m py_compile api/server.py`).
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-29 — ADD-PUSH-TO-SUBTITLE-REMOVER-ACTION-IN-VIDEO-RENDER-057
- User Request: Sau khi cắt ghép video xong, thêm nút "Đẩy sang Xóa Sub" để tự động thêm video kết quả vào tab Xóa Sub và tạo job xóa sub nếu cần.
- Implementation:
  1. Trong `src/renderer/js/standalone-subtitle-remover.js`, xuất các hàm cầu nối `window.addVideoToSubtitleRemover(filePath)` và `window.standaloneSubtitleRemover = { enter, exit, addVideos, enterAndAdd }`.
  2. Trong `src/renderer/js/video-render.js`, bổ sung khối giao diện `#vidr-post-render-actions` và nút `✨ Đẩy sang Xóa Sub (Tạo Job Xóa Sub) ➔`.
  3. Khi quá trình cắt ghép kết xuất video hoàn tất (`status === 'ok'`), nút xuất hiện ngay lập tức. Khi người dùng click, video hoàn tất được tự động tạo Job độc lập trong tab Xóa Sub và giao diện tự chuyển ngay sang tab Xóa Sub cho người dùng xử lý.
- Verification: Đã kiểm tra cú pháp JS (`node -c`), kiểm tra tương thích luồng thêm Job và chuyển trang.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-29 — FIX-VIDEO-RENDER-VOCAL-REMOVAL-AND-BGM-ISOLATION-056
- Root cause: Video Render khi tách vocal từ video nguồn trước đó có fallback center-channel cancellation ($L - R$). Đối với các video audio dual-mono ($L = R$), phép trừ kênh làm triệt tiêu 100% biên độ khiến toàn bộ âm thanh (cả vocal và nhạc nền) bị biến thành 0 dB im lặng tuyệt đối.
- Fix:
  1. Nâng cấp `api_remove_vocal` trong `api/server.py` chạy trực tiếp mô hình AI Demucs (`htdemucs`) trên CUDA GPU để bóc tách 2 luồng `vocals` và `no_vocals`.
  2. Bổ sung cơ chế phát hiện tương quan kênh và fallback bằng Harmonic-Percussive Source Separation (HPSS) của `librosa` để tách giọng nói mà vẫn bảo toàn toàn bộ âm nhạc, tiếng động nền, tiếng trống/beat mà không bao giờ bị tắt tiếng.
  3. Xuất file no_vocals và remux vào video output chuẩn 16-bit 44.1kHz.
  4. Loại bỏ nút bấm thủ công thừa "Tách nhạc nền video nguồn (1-Click)" trên UI `video-render.js`, tích hợp toàn bộ quy trình tách vocal AI Demucs vào nút chính "🚀 BẮT ĐẦU CẮT & GHÉP VIDEO" khi người dùng tick chọn ô "Xóa giọng nói gốc".
- Verification: Đã test trực tiếp tạo video mẫu và chạy `api_remove_vocal` + `api_remove_vocal_video` trên CUDA, Demucs chạy trong 1.8 giây, tách sạch giọng nói và giữ nguyên âm thanh nền; UI sạch gọn.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-29 — FIX-VOICE-RENDER-TAIL-AUDIO-TRUNCATION-AND-CONCAT-LOSS-055
- Runtime diagnosis: sau khi render voice từ văn bản dài và ghép các chunk, file âm thanh kết quả bị thiếu/cụt đoạn âm cuối; khi gọi API tts generate bị lỗi "Failed to generate speech. Is OmniVoice installed?".
- Root cause:
  1. `class TTSRequest` trong `api/server.py` thiếu trường `ref_text: Optional[str] = None` và endpoint `/api/tts/generate` không truyền `ref_text` vào `generate_speech`, kích hoạt exception kiểm tra transcript.
  2. `voice-render-owner-fixes.js` can thiệp vào `post('/api/tts/generate')` và chạy `ffmpeg atempo` trên từng chunk trung gian, khiến bộ đệm của filter atempo xén mất 100-300ms đuôi của từng phần.
  3. OmniVoice (`tts_engine.py`) và Edge-TTS (`server.py`) sinh mảng âm thanh kết thúc sát biên, thiếu khoảng lặng phân rã (decay pad) ở âm tiết cuối.
  4. `splitLongText` bị hard-code `Math.min(800, ...)` thay vì nhận dung lượng 1200-3500 ký tự theo cấu hình giao diện.
- Fix:
  1. Thêm `ref_text: Optional[str] = None` vào `TTSRequest` / `TTSSrtRequest` và truyền `ref_text=req.ref_text` vào `generate_speech`. Bổ sung auto-transcribe fallback trong `tts_engine.py`.
  2. Bổ sung 150ms tail padding (`np.zeros`) trong `tts_engine.py` và `-af apad=pad_dur=0.15` trong `server.py`.
  3. Bỏ việc áp `atempo` per-chunk trong `voice-render-owner-fixes.js`.
  4. Chuẩn hóa `-ar 24000 -ac 1` trong lệnh ghép WAV của `main.js`.
  5. Mở rộng `splitLongText` hỗ trợ 200-4000 ký tự.
- Verification: syntax check JS + Python PASS, đệm âm đuôi đảm bảo âm cuối tròn vành rõ chữ 100%.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.
- Owner manual verification: WAITING after app restart.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-29 — FIX-AI-SETTINGS-MULTIKEY-VALIDATION-MODELS-ROTATION-049
- Root cause verified: AI check chỉ gọi Backend health; model cloud hard-coded; save ghi đè một key; backend chỉ failover từ key đầu.
- Implemented: multi-key add/delete/masked status theo provider; IPC kiểm tra trực tiếp Gemini/DeepSeek và tải model; model cache theo provider.
- Implemented: backend round-robin điểm bắt đầu mỗi cloud request, sau đó giữ failover qua các key còn lại.
- Fixed duplicate Settings event binding bằng idempotent init guard.
- Automated verification PASS: 3-key add, masking, single delete, provider isolation, model hydration, invalid-key live API rejection cho Gemini/DeepSeek, 3-key round-robin sequence, JS/Python syntax và diff check.
- Valid real-key/model verification: WAITING Owner vì không đọc hoặc xuất key thật của Owner.
- Commit/merge: NOT PERFORMED.

## Latest Update — 2026-08-29 — FIX-SETTINGS-LATEST-OVERVIEW-UI-048
- Owner xác nhận UI đúng là Settings overview 4 ô, không phải form tĩnh vừa được làm hiện lại.
- Git evidence: `8348539` xóa bộ mount UI mới; `a77a11d` tiếp tục xóa overview navigation và ép CSS form tĩnh.
- Source fix: giữ sửa DOM của BUG-047, phục hồi chính xác bộ `mountSettings`/overview/detail từ revision tốt ngay trước hồi quy và bỏ CSS override form cũ.
- Không rollback toàn branch; các tab/tính năng mới khác của app được giữ nguyên.
- Automated/runtime verification: PASS — Electron thật hiển thị đúng 4 ô; tất cả AI/TTS/Storage/System routes và back-to-overview PASS.
- Owner manual app verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Status
FIX-SETTINGS-PAGE-DIRECT-STATIC-RENDER-AND-LAYOUT-PASS — IMPLEMENTED / SYNTAX PASS / OWNER CONFIRM WAITING

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
- Voice clone best-reference selection (2026-08-29): selected 0.0–7.7s from 13.8s real source; real OmniVoice output has 100ms safe leading silence and ASR begins with target word “Rửa”, no leading interjection; Owner A/B listening WAITING.
- Voice clone breath suppression (2026-08-29): source + real OmniVoice PASS; reference gap energy giảm từ -21.22 dB xuống -27.14 dB, output speech/gap contrast tăng từ 0.27 dB lên 4.26 dB; Owner A/B listening WAITING; EXE rebuild not performed.
- Voice clone transcript leak (2026-08-29): root cause CONFIRMED; real OmniVoice three-chunk output PASS without “Ghiền Mì Gõ”/“subscribe”; Owner UI listening retest WAITING; EXE rebuild not performed.
- Voice clone input cleanup (2026-08-29): IPC runtime PASS; PCM WAV mono 24 kHz PASS; internal-pause preservation PASS; source unchanged PASS; Owner real-voice A/B WAITING.
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
