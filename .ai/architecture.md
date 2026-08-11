# Project Architecture

## 1. CURRENT IMPLEMENTATION — CODE OBSERVED

Dự án dùng Electron + renderer ES6 Modules với bridge pattern để tương thích code legacy.

```text
src/renderer/
├── index.html
└── js/
    ├── app.js                       (legacy queue/navigation/UI coordinator)
    ├── pipeline-state.js            (P1/P2/P3 compatibility state + handoff gate)
    ├── pipeline1-run-config.js       (snapshot ASR/AI/TTS/voice/speed for each P1 run)
    ├── pipeline1-analysis.js         (adaptive keyframes/chunks + P1 artifact builder)
    ├── pipeline1-artifact-gate.js    (fail-closed guard before P2 handoff)
    └── pipelines/
        ├── pipeline1-ai.js           (P1 reasoning → continuous narration → TTS chain)
        ├── pipeline2-remove.js
        └── pipeline3-finalize.js

src/main/
├── main.js
├── preload.js                       (contextBridge for P1 Vision/narration/audio IPC)
└── p1-vision-ipc.js                 (Ollama Vision chunks + compact global reasoning + narration fit + audio preparation)
```

### Compatibility pipeline state
Until the shared legacy job runner is fully refactored, each job keeps independent lifecycle fields:

```text
p1Status: idle | queued | processing | finished | error
p2Status: locked | ready | queued | processing | finished | error
p3Status: locked | ready
```

Rules:
- new upload belongs to P1; P2/P3 remain locked;
- P1 queued/processing/error/cancel never unlocks P2;
- P1 success -> `p1Status=finished`, `p2Status=ready`, `p3Status=locked`;
- P2 does not accept direct upload and performs subtitle-removal-only behavior;
- P2 success -> `p2Status=finished`, `p3Status=ready`;
- this remains a compatibility layer around legacy shared `state.jobs`, not the final artifact-store model.

## 2. PIPELINE 1 CURRENT CANDIDATE — ADAPTIVE VISION + CONTINUOUS NARRATION V3

`PIPELINE1-CONTINUOUS-NARRATION-006` supersedes the segmented narration/duration-fit candidate from PR #46.

```text
ORIGINAL VIDEO
  ├─ audio -> P1 Whisper ASR (language=auto)
  └─ duration/FPS/frame-count metadata
          ↓
adaptive keyframe planner
  ├─ baseline ≈ 1 keyframe / 4 seconds
  ├─ short-video minimum evidence
  ├─ hard total safety cap = 80 frames
  └─ max 8 frames / Vision chunk
          ↓
chronological Vision chunks
  ├─ each chunk gets overlapping timestamped transcript only
  ├─ each chunk returns structured scene/visual evidence only
  └─ any chunk failure fails P1; no silent evidence drop
          ↓
compact GLOBAL reasoning
  ├─ full source transcript
  ├─ ordered Vision evidence from all chunks
  ├─ source duration
  ├─ selected TTS voice
  ├─ selected TTS speed
  └─ user prompt intent/style
          ↓
voice-aware final JSON
  ├─ summary / compact insights
  ├─ ONE continuous `narration_script`
  └─ compact edit plan / notes
          ↓
full-text TTS pass
  ├─ `/api/tts/generate` exactly once for the whole narration
  ├─ selected speed applied with ffmpeg `atempo`
  └─ ffprobe exact generated-file duration
          ↓
95–100% of source duration?
  ├─ YES -> accept `voice.wav`
  └─ NO  -> measured chars/sec -> ONE whole-narration fit -> ONE final TTS pass
                    └─ second miss -> P1 FAIL / P2 stays locked
          ↓
post-synthesis subtitle display timing
  └─ `tts_timed.srt` may be split for readable subtitle display;
     this segmentation never causes separate speech synthesis clips/gaps
          ↓
jobs/<job_id>/p1/
  ├─ scenes.json
  ├─ multimodal_timeline.json
  ├─ remix_script.json
  ├─ edit_plan.json
  ├─ remix_script.srt
  ├─ voice.wav
  └─ tts_timed.srt
          ↓
p1ArtifactsReady=true only after required narration/TTS gates succeed
          ↓
P2 may become READY
```

### Adaptive Vision invariants
- fixed `FRAME_SAMPLE_COUNT = 8` is not the global sampling authority;
- evidence scales with source duration but remains bounded;
- first/last timeline coverage is retained by distributed sampling;
- no Vision request receives more than 8 sampled frames;
- current total evidence ceiling is 80 frames / 10 chunks; this is a safety bound, not unlimited-video coverage;
- global reasoning starts only after all Vision chunks succeed;
- global reasoning receives the complete transcript, so chunking does not replace whole-video linguistic context;
- `multimodal_timeline.json` records sampling/chunk provenance and never stores base64 images;
- no local vision-capable Ollama model means P1 fails closed; transcript-only fallback cannot unlock P2.

### Continuous narration invariants
- the speech authority is one coherent `narration_script`, not a list of per-scene speech segments;
- selected voice/speed and source duration are known before final narration generation;
- final qwen reasoning does not regenerate Vision scene descriptions;
- for short inputs (<=60s), current global reasoning timeout is 150s; longer inputs use bounded larger timeouts;
- the initial narration character budget targets approximately 97.5% of source duration and is an estimate, not the final gate authority;
- exact generated audio file duration after selected-speed processing is the final authority;
- accepted ratio is inclusive `0.95 <= voice_duration / source_duration <= 1.00`;
- first miss allows exactly one whole-narration rewrite using the measured actual voice rate and exactly one final TTS pass;
- no video speed manipulation and no voice truncation are allowed to satisfy the gate;
- Pipeline 1 does not call legacy `/api/tts-retry` for continuous narration; that endpoint's segment expansion/gap behavior is not part of the P1 v3 path;
- subtitle display chunks may be derived after speech synthesis, but speech itself is synthesized continuously;
- queue processing remains safe sequential auto-advance; simultaneous Gemma/Qwen/OmniVoice heavy GPU jobs are not introduced.

### P1 artifact version 3
All current P1 JSON artifacts carry source identity metadata. For this candidate:

```text
artifact_version: 3
analysis_mode: multimodal-adaptive-continuous-narration-v3
```

`remix_script.json` contains the authoritative `narration_script`, narration budget/provenance, and compatibility timing metadata. `voice.wav` is the normalized accepted speech track. `tts_timed.srt` is derived after audio generation.

Current limitation: adaptive sampling remains duration-driven and uniformly distributed rather than CV scene-boundary/content-density driven. Very long inputs that reach the 80-frame cap need a future scene-aware prioritization refinement; the cap must not be silently removed.

## 3. TARGET PRODUCT ARCHITECTURE

### Pipeline 1: Analysis, Script and Voice
- Analyze ORIGINAL video only.
- ASR + adaptive visual evidence + insights + coherent narration + TTS + subtitle timing + edit plan.
- Artifacts: `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`, narration audio, SRT.
- Strict rule: no subtitle removal, no video cutting, no final render.

### Pipeline 2: Subtitle Removal
- Input is ORIGINAL video.
- Only remove hard/burned-in subtitles; support automatic/manual region selection.
- Output: `clean_video.mp4`.
- Timeline contract: no trimming, scene reordering, speed changes or automatic crop. Original scene timecodes remain valid or deterministically mappable.
- Exact allowed tolerance for duration/FPS/frame count/timebase is still NOT YET VERIFIED and must be established before P3 relies on it.

### Pipeline 3: Video Remix and Finalize
- Read approved P1 artifacts plus P2 `clean_video.mp4`.
- Use original source timecodes/edit plan for cut/reorder where approved.
- Mix accepted narration/background audio, burn final SRT, render final video.
- Strict rule: do not modify P1/P2 outputs; block when source identity does not match.

## 4. ARTIFACT BOUNDARIES & SOURCE IDENTITY

P1 artifacts live at `jobs/<job_id>/p1/`.
Every pipeline artifact must retain `job_id`, `source_fingerprint`, source duration, FPS/timebase where applicable, and artifact version.

Pipeline 2 `clean_video.mp4` must remain timeline-compatible with the original. Pipeline 3 must verify P1/P2 source identity before combining them.
