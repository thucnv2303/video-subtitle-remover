# Project Architecture

## 1. CURRENT IMPLEMENTATION â€” CODE OBSERVED

Dá»± Ã¡n tuÃ¢n theo kiáº¿n trÃºc ES6 Modules vá»›i bridge pattern Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch script thÆ°á»ng.
TUYá»†T Äá»I tuÃ¢n thá»§ khi tÃ¬m kiáº¿m hoáº·c thÃªm má»›i tÃ­nh nÄƒng.

```text
src/renderer/
â”œâ”€â”€ index.html               (Giao diá»‡n chÃ­nh. Load api.js, pipeline.js dáº¡ng script thÆ°á»ng;
â”‚                             load cÃ¡c ES6 module qua <script type="module"> bridge,
â”‚                             expose hÃ m lÃªn window.*; load app.js defer)
â”œâ”€â”€ styles/
â”‚   â””â”€â”€ main.css             (File CSS chÃ­nh)
â””â”€â”€ js/
    â”œâ”€â”€ app.js               (Main entry point â€” IIFE non-module. Äiá»u phá»‘i toÃ n bá»™:
    â”‚                         job queue, pipeline 2 inpaint, navigation, UI events.
    â”‚                         Gá»i window.triggerAutoAiRewrite, window.finalizeVideo, v.v.)
    â”œâ”€â”€ store.js             (Global state: state object, loadState, saveState)
    â”œâ”€â”€ api.js               (APIClient: fetch/WebSocket vá»›i backend. Expose window.api)
    â”œâ”€â”€ pipeline.js          (Step chevron navigation â€” 40 lines)
    â”œâ”€â”€ utils/
    â”‚   â”œâ”€â”€ logger.js        (addLog(msg, type), showToast(msg, type, dur), getLogCategory.
    â”‚   â”‚                     Há»— trá»£ cáº£ 2 dáº¡ng gá»i: simple vÃ  legacy el-based)
    â”‚   â”œâ”€â”€ formatters.js    (fmtTime, fmtTimeFull, formatFileSize, fmtPercent, msToSrtTime)
    â”‚   â””â”€â”€ dom.js           (el object ~100 DOM refs, $ vÃ  $$ helpers)
    â”œâ”€â”€ pipelines/
    â”‚   â”œâ”€â”€ pipeline1-ai.js  â˜… PIPELINE 1: AI Analysis + TTS Chain
    â”‚   â”‚                     triggerAutoAiRewrite(job, srtText) â†’ AI rewrite â†’ chain TTS
    â”‚   â”‚                     triggerAutoTts(job, srtText) â†’ táº¡o TTS audio, lÆ°u vÃ o job
    â”‚   â”‚                     Káº¾T QUáº¢: job.ttsAudioPath, job.ttsTimedSrt, job.karaokeAss
    â”‚   â”‚                     KHÃ”NG ghÃ©p video â€” viá»‡c Ä‘Ã³ thuá»™c Pipeline 3
    â”‚   â”œâ”€â”€ pipeline2-remove.js  (Legacy helpers â€” runNextPass, pollProgress, handleWSMessage
    â”‚   â”‚                         â€” hiá»‡n tÃ­ch há»£p vÃ o app.js. File nÃ y giá»¯ láº¡i Ä‘á»ƒ tham kháº£o)
    â”‚   â”œâ”€â”€ pipeline3-finalize.js  â˜… PIPELINE 3: Finalize Video
    â”‚   â”‚                     finalizeVideo(job):
    â”‚   â”‚                       BÆ°á»›c 1: Äiá»u chá»‰nh tempo video khá»›p TTS
    â”‚   â”‚                       BÆ°á»›c 2: TÃ¡ch vocal gá»‘c (náº¿u báº­t tts-remove-vocal)
    â”‚   â”‚                       BÆ°á»›c 3: GhÃ©p TTS audio vÃ o video Ä‘Ã£ xÃ³a sub â†’ _with_voice.mp4
    â”‚   â”‚                       BÆ°á»›c 4: Burn subtitle (náº¿u job.voiceSub) â†’ _final.mp4
    â”‚   â”‚                     INPUT: job.outputPath + job.ttsAudioPath (tá»« Pipeline 1)
    â”‚   â”‚                     OUTPUT: job.finalOutputPath (_final.mp4)
    â”‚   â””â”€â”€ pipeline3-sub.js (Re-export alias â†’ pipeline3-finalize.js)
    â””â”€â”€ components/
        â”œâ”€â”€ job-manager.js   (createJob, renderJobList, processNextJob, onJobFinished, loadVideo)
        â”œâ”€â”€ prompt-manager.js(initPromptManager, renderPromptDropdown â€” quáº£n lÃ½ AI prompts)
        â”œâ”€â”€ video-preview.js (fetchAndDrawLivePreview, startLivePreviewPolling)
        â””â”€â”€ settings.js      (initSettings, loadSettingsValues, renderSavedVoices,
                               updateVoiceDropdown, checkTTSStatus, voice clone management)
```

VÃ¬ `index.html` load `app.js` dáº¡ng `<script src="...">` (non-module), cÃ¡c ES6 module Ä‘Æ°á»£c bridge qua `<script type="module">` inline trong HTML Ä‘á»ƒ expose hÃ m lÃªn `window.*`. `app.js` gá»i cÃ¡c hÃ m module qua `window.*`. CÃ¡c module tá»± gá»i `window.addLog` vÃ  `window.showToast`.

## 2. TARGET PRODUCT ARCHITECTURE â€” OWNER CONFIRMED / PROPOSED

Kiáº¿n trÃºc chia thÃ nh 3 pipeline hoáº¡t Ä‘á»™ng hoÃ n toÃ n Ä‘á»™c láº­p, giao tiáº¿p qua Artifact Boundaries.

### Pipeline 1: Analysis, Script and Voice
- PhÃ¢n tÃ­ch ORIGINAL video.
- Dá»‹ch vá»¥/chá»©c nÄƒng: detect scenes/keyframes, build multimodal timeline, extract insights, remix script (chia Ä‘oáº¡n cÃ³ cáº¥u trÃºc), há»— trá»£ script approval.
- Output sinh ra: TTS/Voice cloned, SRT dá»±a trÃªn TTS timing.
- CÃ¡c artifacts JSON: `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.
- **Strict Rule:** Tuyá»‡t Ä‘á»‘i khÃ´ng xÃ³a subtitle, khÃ´ng cáº¯t video, khÃ´ng rÃ¡p hay render video á»Ÿ Pipeline nÃ y.

### Pipeline 2: Subtitle Removal
- Nháº­n input lÃ  ORIGINAL video.
- Chá»‰ thá»±c hiá»‡n xÃ³a hard subtitles. Há»— trá»£ chá»n vÃ¹ng xÃ³a tá»± Ä‘á»™ng/thá»§ cÃ´ng.
- Output: `clean_video.mp4`.
- **Timeline Contract:** Pipeline 2 `clean_video.mp4` must remain timeline-compatible with the original source within a defined and verified tolerance.
  - no trimming of beginning or end;
  - no scene reordering;
  - no speed changes;
  - no automatic crop;
  - original scene timecodes remain valid or deterministically mappable.

  **Exact allowed tolerance for duration, FPS, frame count and timebase: NOT YET VERIFIED.**
  GiÃ¡ trá»‹ tolerance nÃ y pháº£i Ä‘Æ°á»£c xÃ¡c Ä‘á»‹nh thÃ´ng qua audit vÃ  owner runtime testing trÆ°á»›c khi Pipeline 3 cÃ³ thá»ƒ phá»¥ thuá»™c vÃ o nÃ³ má»™t cÃ¡ch an toÃ n.

### Pipeline 3: Video Remix and Finalize
- Äá»c artifacts tá»« Pipeline 1 (approved script, TTS audio, SRT, scenes, edit plan).
- Äá»c `clean_video.mp4` tá»« Pipeline 2 lÃ m nguá»“n video máº·c Ä‘á»‹nh.
- Cáº¯t cáº£nh dÃ¹ng original source timecodes, sáº¯p xáº¿p láº¡i theo `edit_plan.json` (khi cáº§n).
- Mix TTS vÃ  background audio, burn SRT má»›i.
- Render final video.
- **Strict Rule:** Tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘Æ°á»£c sá»­a Ä‘á»•i (modify) outputs cá»§a Pipeline 1 vÃ  Pipeline 2. Báº¯t buá»™c BLOCK operation náº¿u artifacts tá»« P1 vÃ  P2 khÃ´ng Ä‘áº¿n tá»« cÃ¹ng má»™t source video.

### Artifact Boundaries & Source Identity
Artifacts P1 Ä‘Æ°á»£c lÆ°u á»Ÿ `jobs/<job_id>/p1/`.
Má»i pipeline artifact pháº£i chá»©a: `job_id`, `source_fingerprint`, `source duration`, `FPS/timebase`, vÃ  `artifact version`.
