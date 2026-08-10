# Project Architecture

## 1. CURRENT IMPLEMENTATION — CODE OBSERVED

Dự án tuân theo kiến trúc ES6 Modules với bridge pattern để tương thích script thường.
TUYỆT ĐỐI tuân thủ khi tìm kiếm hoặc thêm mới tính năng.

```text
src/renderer/
├── index.html               (Giao diện chính. Load api.js, pipeline.js dạng script thường;
│                             load các ES6 module qua <script type="module"> bridge,
│                             expose hàm lên window.*; load app.js defer)
├── styles/
│   └── main.css             (File CSS chính)
└── js/
    ├── app.js               (Main entry point — IIFE non-module. Điều phối toàn bộ:
    │                         job queue, pipeline 2 inpaint, navigation, UI events.)
    ├── pipeline-state.js    (Compatibility P1/P2/P3 state/handoff gate.)
    ├── pipeline1-run-config.js (BUG-005 run snapshot; ASR auto + multimodal mode.)
    ├── pipeline1-analysis.js (BUG-005 original-video keyframe collection, multimodal artifact builder.)
    ├── pipeline1-artifact-gate.js (BUG-005 fail-closed guard before P2 handoff.)
    ├── store.js
    ├── api.js
    ├── pipeline.js          (Owner-approved Pipeline 1 UI adapter.)
    ├── pipelines/
    │   ├── pipeline1-ai.js  (P1 multimodal analysis/remix → TTS chain; no render.)
    │   ├── pipeline2-remove.js
    │   ├── pipeline3-finalize.js
    │   └── pipeline3-sub.js
    └── components/
        ├── job-manager.js
        ├── prompt-manager.js
        ├── video-preview.js
        └── settings.js

src/main/
├── main.js                  (Electron main; registers P1 vision IPC.)
├── preload.js               (contextBridge for P1 vision/audio artifact IPC.)
└── p1-vision-ipc.js         (local Ollama capability/vision analysis + source fingerprint + audio artifact persistence.)
```

### Current compatibility handoff state
Until the legacy shared-job runner is fully refactored, `pipeline-state.js` separates pipeline lifecycle state on each shared job:

```text
p1Status: idle | queued | processing | finished | error
p2Status: locked | ready | queued | processing | finished | error
p3Status: locked | ready
```

Rules:
- a newly uploaded job belongs to P1 and is P2/P3 locked;
- P1 queued/processing/error/cancel never unlocks P2;
- P1 success maps to `p1Status=finished`, `p2Status=ready`, `p3Status=locked`;
- P2 does not accept direct upload and is guarded from starting while any P1 job is queued/processing;
- P2 start forces subtitle-removal-only behavior: no ASR extraction, AI rewrite, or TTS chaining;
- P2 success maps to `p2Status=finished`, `p3Status=ready`;
- this remains a compatibility layer around legacy `state.jobs` / `job.status`, not the final artifact-store state model.

### BUG-005 multimodal revision — CODE CANDIDATE / OWNER RETEST REQUIRED
The previous text-only `ASR → rewrite → TTS` candidate was invalidated by Owner runtime evidence. The revised candidate aligns P1 more closely with the target artifact boundary:

```text
ORIGINAL VIDEO
  ├─ audio → dedicated P1 Whisper ASR (language=auto)
  └─ sampled original-video keyframes + video metadata
          ↓
local Ollama multimodal analysis
  ├─ selected model used directly when it has vision capability
  └─ otherwise installed local vision model supplies visual context
       to the selected reasoning model
          ↓
structured JSON
  ├─ summary / insights
  ├─ scenes
  ├─ timed remix script segments
  └─ edit plan
          ↓
jobs/<job_id>/p1/
  ├─ scenes.json
  ├─ multimodal_timeline.json
  ├─ remix_script.json
  ├─ edit_plan.json
  ├─ remix_script.srt
  ├─ voice.*            (when TTS enabled)
  └─ tts_timed.srt      (when TTS enabled)
          ↓
p1ArtifactsReady=true
          ↓
P2 may become READY
```

Candidate invariants:
- source SHA256 fingerprint is calculated from the ORIGINAL video and stored with JSON artifacts;
- duration, FPS, frame count, artifact version and reasoning/vision model identity are stored with artifacts;
- no local vision-capable Ollama model means P1 fails closed; transcript-only fallback cannot unlock P2;
- prompt preset controls content intent/style, but the system JSON artifact schema is authoritative over prompt formatting instructions;
- the running Job is the authoritative Job for P1 detail text/audio/status;
- legacy `finished` without `p1ArtifactsReady=true` is relocked by the candidate-specific artifact guard;
- P1 still never inpaints/removes subtitles/renders video.

Current limitation: this candidate enables multimodal P1 only for local Ollama. Gemini/DeepSeek are deliberately blocked in P1 rather than silently degrading to text-only. Scene understanding currently uses sampled keyframes + vision reasoning; deterministic CV scene-boundary detection is not yet claimed.

## 2. TARGET PRODUCT ARCHITECTURE — OWNER CONFIRMED / PROPOSED

Kiến trúc chia thành 3 pipeline hoạt động hoàn toàn độc lập, giao tiếp qua Artifact Boundaries.

### Pipeline 1: Analysis, Script and Voice
- Phân tích ORIGINAL video.
- Dịch vụ/chức năng: detect scenes/keyframes, build multimodal timeline, extract insights, remix script (chia đoạn có cấu trúc), hỗ trợ script approval.
- Output sinh ra: TTS/Voice cloned, SRT dựa trên TTS timing.
- Các artifacts JSON: `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.
- **Strict Rule:** Tuyệt đối không xóa subtitle, không cắt video, không ráp hay render video ở Pipeline này.

### Pipeline 2: Subtitle Removal
- Nhận input là ORIGINAL video.
- Chỉ thực hiện xóa hard subtitles. Hỗ trợ chọn vùng xóa tự động/thủ công.
- Output: `clean_video.mp4`.
- **Timeline Contract:** Pipeline 2 `clean_video.mp4` must remain timeline-compatible with the original source within a defined and verified tolerance.
  - no trimming of beginning or end;
  - no scene reordering;
  - no speed changes;
  - no automatic crop;
  - original scene timecodes remain valid or deterministically mappable.

  **Exact allowed tolerance for duration, FPS, frame count and timebase: NOT YET VERIFIED.**
  Giá trị tolerance này phải được xác định thông qua audit và owner runtime testing trước khi Pipeline 3 có thể phụ thuộc vào nó một cách an toàn.

### Pipeline 3: Video Remix and Finalize
- Đọc artifacts từ Pipeline 1 (approved script, TTS audio, SRT, scenes, edit plan).
- Đọc `clean_video.mp4` từ Pipeline 2 làm nguồn video mặc định.
- Cắt cảnh dùng original source timecodes, sắp xếp lại theo `edit_plan.json` (khi cần).
- Mix TTS và background audio, burn SRT mới.
- Render final video.
- **Strict Rule:** Tuyệt đối không được sửa đổi outputs của Pipeline 1 và Pipeline 2. Bắt buộc BLOCK operation nếu artifacts từ P1 và P2 không đến từ cùng một source video.

### Artifact Boundaries & Source Identity
Artifacts P1 được lưu ở `jobs/<job_id>/p1/`.
Mọi pipeline artifact phải chứa: `job_id`, `source_fingerprint`, `source duration`, `FPS/timebase`, và `artifact version`.
