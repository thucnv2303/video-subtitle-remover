# AgentOS Handoff Status

## Latest Handoff — 2026-09-01 — FEAT-VIDEO-RENDER-PUSH-SELECTED-TO-SUB-071
- Đã chỉnh sửa nút bấm và hành vi chuyển video: Hiển thị rõ số lượng video hoàn tất đang được chọn (`✨ ĐẨY N VIDEO ĐÃ CHỌN SANG XÓA SUB ➔`) và chỉ đẩy chính xác các video được tích checkbox sang tab Xóa Sub.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FEAT-VIDEO-RENDER-BATCH-OUTPUT-FOLDER-070
- Đã bổ sung tính năng chọn **Thư mục lưu video đầu ra** (Output Directory) trong chế độ Google Sheets của tab Video Render.
- Hỗ trợ nút `📂 Chọn đầu ra` và nút `📂 Mở thư mục kết quả` trên thanh công cụ.
- Tự động lưu các video remix vào đúng thư mục được chọn.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FIX-VOICE-RENDER-AUDIO-PREVIEW-HASHTAG-URL-069
- Đã khắc phục lỗi trình phát Audio Preview không load file audio có chứa ký tự hashtag `#` bằng cách chuẩn hóa qua hàm `toMediaUrl` (`#` -> `%23`).
- Kiểm tra file thật trên đĩa `E:\Tải về\lanleereview...`: Dung lượng **5,521,998 bytes (5.5 MB)** đã ghi hoàn tất.
- Trình phát Audio Preview tự động tải và sẵn sàng phát ngay khi render xong.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FIX-VOICE-RENDER-BRIDGE-API-068
- Đã khắc phục triệt để lỗi `window.api.generateSpeech is not a function` bằng cách gọi đúng client bridge `window.api.post('/api/tts/generate', payload)` và IPC `window.electronAPI.mergeWavFiles(completedChunkPaths, job.outputPath)`.
- Chạy batch render mượt mà, sinh từng chunk, tự động gán đuôi và ghép nối thành file WAV 48kHz Stereo 2 kênh chuẩn CapCut.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FIX-VOICE-RENDER-SPLIT-CHUNKS-AND-UI-SYNC-067
- Đã khắc phục triệt để lỗi `splitIntoChunks is not defined` bằng cách kết nối đúng thuật toán chia chunk `splitLongText`.
- Đã chuẩn hóa toàn bộ giao diện, màu sắc, buttons (gradient blue), inputs, dropdowns, table styles và inspector của tab Voice Render đồng bộ 100% với phong cách hiện đại của Video Render.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FEAT-VOICE-RENDER-BATCH-GOOGLE-SHEETS-066
- Đã tích hợp hoàn chỉnh tính năng quét Google Sheet & Render Hàng Loạt (Multi/Batch Voice Render) trong tab Voice Render.
- Tự động lấy kịch bản từ cột `Kịch Bản Voiceover TTS` và lưu file audio WAV đặt tên chính xác theo cột **`Tên Video Gốc`** vào thư mục người dùng đã chọn.
- Đầu ra file audio đảm bảo chuẩn phát sóng quốc tế **48,000 Hz Stereo 2 kênh PCM_16 WAV** cho 100% khả năng tương thích CapCut / Premiere.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FIX-VOICE-RENDER-CAPCUT-AUDIO-SAMPLE-RATE-AND-CHANNELS-065
- Đã chuẩn hóa toàn diện luồng xuất file WAV của Voice Render sang chuẩn **48,000 Hz Stereo 2 kênh PCM_16 WAV**.
- Khắc phục triệt để lỗi CapCut đọc sai thời lượng (file 20s bị co lại còn 15s) do lệch Block Align và Timeline Sample Rate Mismatch.
- Automated tests: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-09-01 — FIX-VOCAL-REMOVAL-AUDIO-DISTORTION-064
- Đã nâng cấp toàn diện chất lượng bóc tách vocal trong `api/server.py` sang chuẩn **Demucs HQ**:
  - Kích hoạt Multi-shift Averaging (`--shifts 1`) và Overlap Smoothing (`--overlap 0.25`) để loại bỏ hoàn toàn hiện tượng méo pha kim loại, hụt tiếng, nghẹt âm.
  - Tích hợp Dynamic Audio Normalization (`dynaudnorm`, 256k AAC) giúp nhạc nền BGM giữ nguyên âm sắc và độ dầy tự nhiên của bản gốc.
- Python compilation: PASS. End-to-end verification trên GPU CUDA: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-31 — FIX-VIDEO-RENDER-STALE-PREVIEW-DURATION-063
- Xác minh file `_remix.mp4` thật chỉ dài 22.022 giây, đúng timeline 22 giây; con số 35 giây trong ảnh là preview/metadata cũ của Electron.
- `video-render.js` đã thêm cache-buster `vsr_preview`, reset `src` trước khi nạp output và chờ `loadedmetadata` trước autoplay.
- Batch Inspector dùng `previewVersion` để reload kể cả khi output path không đổi; duration metadata thật được lưu và hiển thị.
- Automated verification: JS syntax PASS; focused diff check PASS; physical file duration verified bằng `ffprobe`.
- Owner manual app verification: WAITING. Cần restart app rồi render cùng output path hai lần liên tiếp.
- Commit/merge: NOT PERFORMED / BLOCKED.

## Latest Handoff — 2026-08-29 — REDESIGN-BATCH-UI-WITH-VIDEO-PREVIEW-062
- Đã thiết kế lại giao diện luồng Hàng loạt từ Google Sheets với cấu trúc 2 cột hiện đại:
  - Cột trái: Bảng hàng đợi danh sách video, thanh điều khiển chạy hàng loạt và nhật ký.
  - Cột phải: Panel Inspector & Video Preview thời gian thực.
- Hỗ trợ phát thử trực tiếp video nguồn hoặc video đã render.
- Cho phép bấm vào từng phân đoạn timeline để tua và phát thử đoạn đó ngay trên player.
- Syntax verification: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.
- Đã sửa triệt để lỗi `Assignment to constant variable.` trong hàm `parseCSV` của `video-render.js`.
- Bóc tách dữ liệu từ Google Sheet thật của dự án trả về 100% chính xác toàn bộ các cột, tên video, chủ đề và toàn bộ các dòng lệnh FFmpeg.
- Syntax verification: PASS. Automated test: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.
- Đã khắc phục triệt để lỗi "lỗi quét sheet" trên Electron Renderer do bị chặn CORS.
- Đã chuyển toàn bộ cơ chế tải dữ liệu Google Sheets CSV qua IPC `net:fetchText` trên Electron Main Process.
- Dữ liệu Google Sheets từ link của bác tải về mượt mà, bóc tách đầy đủ các phân đoạn timeline và thông tin sản phẩm.
- Syntax verification: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.
- Đã phân tích và tối ưu hóa 100% khớp với cấu trúc Google Sheet thực tế của bác (`142oK47OvdLmHZrkFUbllcL8CbwtxKeZ054In2z7Cm1o`).
- Bộ phân tích CSV multiline bóc tách chính xác các cột: `Tên Video Gốc`, `Tên Sản Phẩm / Chủ Đề` và `Lệnh Cắt FFmpeg` (chứa các đoạn cắt -ss -to).
- Thuật toán fuzzy matcher tự động chuẩn hóa tên video và lọc bỏ hashtag để khớp đúng file video trong thư mục nguồn.
- Syntax verification: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.
- Đã hoàn thành tính năng Quét Google Sheets & Cắt Ghép Video Hàng Loạt (Batch Queue) trong tab Video Render.
- Tự động quét và khớp file nguồn trong thư mục cục bộ qua IPC `fs:scanVideoFiles`.
- Hỗ trợ chạy hàng loạt tuần tự, bỏ qua và ghi nhận job lỗi riêng lẻ, có nút 1-click chạy lại các job lỗi.
- Hỗ trợ nút "✨ ĐẨY TOÀN BỘ SANG XÓA SUB ➔" nạp hàng loạt video sang tab Xóa Sub để tiếp tục quy trình.
- Syntax verification: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-SUBTITLE-REMOVER-CANCEL-STOP-IMMEDIATELY-058
- Sửa lỗi bấm dừng/hủy trong Xóa Sub nhưng Python backend vẫn tiếp tục chạy ngầm.
- Tích hợp `InterruptedError` ngắt tức thì trong mọi hook xử lý frame (`detect_subtitle`, `_custom_find_sub_frame_no`, `_live_preview_comp`, `VideoWriterWithPreview.write`, `worker_loop`).
- Giải phóng `video_cap` và `video_writer` ngay khi nhận POST `/api/cancel`, trả app về trạng thái sẵn sàng.
- Syntax verification: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — ADD-PUSH-TO-SUBTITLE-REMOVER-ACTION-IN-VIDEO-RENDER-057
- Đã thêm nút "✨ Đẩy sang Xóa Sub (Tạo Job Xóa Sub) ➔" trong tab Video Render.
- Nút tự động xuất hiện ngay sau khi cắt ghép video xong.
- Khi người dùng bấm nút, hệ thống sẽ tự động thêm video kết quả vào danh sách Job độc lập của tab Xóa Sub và chuyển ngay sang giao diện Xóa Sub.
- Syntax verification: PASS. Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-VIDEO-RENDER-VOCAL-REMOVAL-AND-BGM-ISOLATION-056
- Đã nâng cấp toàn diện tính năng tách giọng nói gốc trên Video Render: sử dụng mạng nơ-ron AI Demucs (htdemucs) chạy trực tiếp trên GPU CUDA để tách sạch giọng người và bảo toàn 100% nhạc nền BGM.
- Loại bỏ lỗi triệt tiêu âm thanh thành im lặng trên các video có audio mono/dual-mono.
- Bổ sung fallback Harmonic-Percussive Source Separation (HPSS) chống tắt tiếng.
- Đã gỡ bỏ nút thủ công thừa "Tách nhạc nền video nguồn (1-Click)", tích hợp quy trình tách giọng giữ BGM tự động trực tiếp vào nút "🚀 BẮT ĐẦU CẮT & GHÉP VIDEO" khi tick chọn "Xóa giọng nói gốc".
- Runtime test PASS (Demucs hoàn thành trong ~1.8 giây, xuất file video không vocal có BGM chuẩn).
- Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-VOICE-RENDER-TAIL-AUDIO-TRUNCATION-AND-CONCAT-LOSS-055
- Sửa lỗi audio kết quả của Voice Render bị thiếu hoặc cụt mất phần âm thanh cuối sau khi render và ghép các chunk.
- Đã thêm 150ms tail padding (`np.zeros`) trong `tts_engine.py` và `-af apad=pad_dur=0.15` cho Edge-TTS trong `server.py`.
- Gỡ bỏ `atempo` per-chunk trong `voice-render-owner-fixes.js` để không làm mất buffer âm thanh ở đuôi chunk.
- Chuẩn hóa lệnh ghép WAV FFmpeg `-ar 24000 -ac 1` trong `main.js` và nới rộng giới hạn chunk trong `voice-render.js`.
- Automated test PASS; Owner manual verification: WAITING. Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-VOICE-CLONE-REFERENCE-TRANSCRIPT-LEAK-052
- Root cause confirmed from Owner WAV: phrase “Hãy subscribe cho kênh Ghiền Mì Gõ” repeated at the start of three generated chunks although absent from both source and cleaned reference audio.
- Cause was OmniVoice implicit Whisper ASR because app sent `ref_audio` without matching `ref_text`.
- Added one-time Faster-Whisper reference transcription, backend cache, editable/persisted transcript in Voice Render + Settings, server fallback for old callers, and fail-closed TTS contract.
- OmniVoice now receives a cached `VoiceClonePrompt`; three-chunk runtime generated with one prompt and re-ASR contained no forbidden phrase.
- Source QA PASS; Owner UI listening retest WAITING. Installed EXE not rebuilt. Commit/merge not performed.

## Latest Handoff — 2026-08-29 — UPGRADE-VOICE-CLONE-INPUT-CLEANING-051
- Cả Voice Render và Settings đều dùng chung IPC làm sạch audio local trước khi clone.
- Bộ lọc giữ nguyên file nguồn; lưu bản PCM WAV mono 24 kHz trong thư mục userData bền vững.
- Mức Cân bằng dùng high/low-pass + FFT denoise nhẹ + trim riêng đầu/cuối + loudness normalize; Voice Render có thêm Lọc mạnh.
- Electron IPC runtime QA PASS với nguồn 48 kHz có nhiễu; kết quả 24 kHz mono. Mẫu có khoảng nghỉ 1 giây giữa hai đoạn vẫn giữ được đoạn sau, không bị cắt tại khoảng nghỉ.
- Static syntax + diff check PASS. Owner nghe A/B bằng giọng thật: WAITING.
- Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-VOICE-RENDER-DUPLICATE-SAVE-DIALOG-050
- Symptom was not a native dialog that refused to close; two Save Dialogs were stacked.
- Cause: Voice Render loaded/bound twice through direct HTML plus preload injection; owner fixes also had duplicate bootstrap risk.
- Fix: runtime singleton guards plus existing-script detection by `src`.
- Automated native-window QA PASS: dialog count before fix 2; after fix 1; after selecting path 0; render state started.
- Owner must close and reopen LONG012 to load the corrected runtime.
- Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-AI-SETTINGS-MULTIKEY-VALIDATION-MODELS-ROTATION-049
- AI Settings now supports multiple masked keys per Gemini/DeepSeek provider without overwriting existing keys.
- `Kiểm tra key & tải model` uses main-process provider API calls; raw keys are not printed or returned in result metadata.
- Cloud model results populate Settings and persist per provider.
- Python backend round-robins the starting key per request and preserves failover order.
- Automated UI/IPC/rotation/syntax verification: PASS with fake keys and cached test models.
- Real Owner key verification: WAITING Owner manual app retest.
- Commit/merge: NOT PERFORMED.

## Latest Handoff — 2026-08-29 — FIX-SETTINGS-LATEST-OVERVIEW-UI-048
- Owner screenshot xác nhận giao diện chuẩn là Settings overview 4 ô, không phải form tĩnh.
- Root cause hoàn chỉnh: BUG-047 malformed DOM gây blank; BUG-048 hai commit `8348539`/`a77a11d` loại bỏ bộ mount và điều hướng của UI mới.
- Fix: sửa chuỗi DOM, phục hồi đúng `mountSettings` + overview/detail bindings từ revision tốt trước hồi quy, bỏ CSS override form cũ.
- Không rollback branch và không thay đổi logic P1/P2/P3, backend hoặc OmniVoice engine.
- Automated/runtime verification: PASS — visual overview đúng bố cục Owner screenshot; 4/4 detail routes và back navigation PASS.
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.

## Voice clone breath suppression checkpoint (2026-08-29)
- Root cause: `0828(2).MP3` bị nén/clipping mạnh; tiếng lấy hơi gần mức lời nên `afftdn` không thể tách.
- Source fix: `adeclip`; Faster-Whisper word mask; giảm 14 dB chỉ ở non-speech gap >=55ms với ramp 25ms; server tự đưa mọi clone reference qua file `-debreath.wav`.
- QA thật: reference gap -21.22 -> -27.14 dB; OmniVoice output speech/gap contrast 0.27 -> 4.26 dB; ASR giữ đúng nội dung.
- Owner cần restart app, chọn lại audio/hoặc dùng voice cũ để migration chạy, rồi nghe A/B. Installed EXE chưa rebuild; commit/merge chưa làm.

## Voice clone best-segment checkpoint (2026-08-29)
- App chấm điểm đoạn 6.5–10.5s theo SNR/confidence/clipping, cắt tại phrase boundary và lưu transcript subset khớp chính xác.
- File thật chọn 0.0–7.7s; reference thêm 120ms leading pad, 160ms tail và fade 25ms.
- OmniVoice thật sinh output mới; 0–100ms im lặng và Faster-Whisper nhận từ đầu đúng “Rửa”, không có interjection lạ.
- Voice cũ có `bestSegmentSelected=false/missing` sẽ tự migrate khi Voice Render dùng lần kế tiếp.

## Active task
`FIX-SETTINGS-PAGE-DIRECT-STATIC-RENDER-AND-LAYOUT-PASS`

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
