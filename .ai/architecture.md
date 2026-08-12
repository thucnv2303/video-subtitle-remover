# Project Architecture

## 1. CURRENT IMPLEMENTATION — CODE OBSERVED

The app uses Electron with renderer ES6 Modules plus legacy compatibility bridges.

```text
src/renderer/
└── js/
    ├── app.js
    ├── pipeline-state.js
    ├── pipeline1-run-config.js
    ├── pipeline1-analysis.js
    ├── pipeline1-artifact-gate.js
    └── pipelines/
        ├── pipeline1-ai.js
        ├── pipeline2-remove.js
        └── pipeline3-finalize.js

src/main/
├── main.js
├── preload.js
└── p1-vision-ipc.js
```

Compatibility lifecycle remains:

```text
p1Status: idle | queued | processing | finished | error
p2Status: locked | ready | queued | processing | finished | error
p3Status: locked | ready
```

A new upload belongs to P1. P2/P3 stay locked until their upstream artifact gates pass.

## 2. PIPELINE 1 — ADAPTIVE ANALYSIS + NATURAL CONTINUOUS NARRATION

```text
ORIGINAL VIDEO
  ├─ audio -> P1 Whisper ASR
  └─ duration/FPS/frame metadata
          ↓
adaptive keyframe/chunk plan
          ↓
chronological Vision evidence
          ↓
compact global reasoning
  ├─ full transcript
  ├─ ordered Vision evidence
  ├─ source duration
  ├─ selected voice/speed
  └─ user prompt intent
          ↓
ONE grounded `narration_script`
          ↓
ONE full-text TTS
  ├─ selected P1 voice/speed
  ├─ exact duration measured
  └─ quality/artifact validation
          ↓
P1 duration telemetry
  ├─ underlength: warning/telemetry only
  ├─ 90–110%: normal telemetry band
  └─ >150% source duration: pathological overlength FAIL
          ↓
P1 artifacts + subtitle timing
          ↓
P2 may become READY
```

### P1 invariants
- P1 analyzes the ORIGINAL video only.
- Adaptive Vision remains bounded; no chunk receives more than 8 sampled frames and the existing total safety cap remains in force.
- The speech authority is one coherent `narration_script`, not separately synthesized scene segments.
- `/api/tts/generate` is used for continuous narration; legacy segmented `/api/tts-retry` is not the P1 narration path.
- Narration character budget is guidance/telemetry, not proof of audio duration.
- P1 no longer requires voice to occupy 95–100% of the original timeline.
- A short coherent narration may intentionally leave visual/music/silent coverage.
- Normal P1 completion does not run a second LLM duration-fill request or a second TTS solely for occupancy.
- Measured voice/source ratio outside 90–110% is a warning, not a failure, unless pathological overlength exceeds 150%.
- Narration quality, valid TTS artifact, source identity and required P1 artifacts remain blocking.
- Same-session late TTS/finalization retry may reuse valid analysis/TTS checkpoints when dependency signatures match.

### P1 artifacts
P1 artifacts live under `jobs/<job_id>/p1/`, including:
- `scenes.json`
- `multimodal_timeline.json`
- `remix_script.json`
- `edit_plan.json`
- `remix_script.srt`
- `voice.wav`
- `tts_timed.srt`

P1 outputs are immutable inputs to later pipelines.

## 3. PIPELINE 2 — SUBTITLE REMOVAL ONLY

Pipeline 2 receives the ORIGINAL video and only removes burned-in subtitles.

Output: `clean_video.mp4`.

P2 must preserve timeline compatibility: no narration generation, no final mix, no automatic speed change for voice matching, no unrelated crop/reorder.

## 4. PIPELINE 3 — FINAL TIMELINE + VOICE FIT + RENDER

Pipeline 3 reads approved P1 artifacts plus P2 clean video. P3 owns final cut/mix/subtitle/render decisions and therefore owns final voice/video duration alignment.

Current BUG-034 voice-fit path:

```text
P2 clean/final-mix video
      +
P1 voice.wav + P1 tts_timed.srt
          ↓
probe actual mixing-video duration
          ↓
voice/video ratio
  ├─ <0.90
  │    keep natural P1 voice
  │    remaining video may carry visuals/music/silence
  ├─ ~1.00
  │    use P1 voice directly
  ├─ 0.90–1.15 mismatch
  │    create pitch-preserving derived P3 voice
  │    re-measure duration
  │    rescale subtitle timing
  └─ >1.15
       block automatic stretch; require revision/warning
          ↓
mix + burn subtitle + final render
```

### P3 invariants
- Preserve clean-video playback speed by default. Voice matching must not call `adjustVideoTempo()`.
- Initial automatic P3 voice-fit range is 0.90–1.15 and remains subject to Owner listening validation before release.
- Strong underlength is not stretched extremely to occupy the timeline.
- Overlength above 1.15 is not silently distorted.
- P3 may use the existing pitch-preserving ffmpeg audio-preparation bridge; no new audio dependency is introduced by BUG-034.
- Any adjusted voice is a NEW P3 artifact and never overwrites P1 `voice.wav`.
- If P3 changes voice tempo, subtitle timing must follow the measured derived audio before burn-in.

Derived artifacts when adjustment is required:

```text
jobs/<job_id>/p3/
├── voice.wav
└── tts_timed.srt
```

Runtime fields may include `p3VoiceAudioPath`, `p3VoiceDurMs`, `p3VoiceTempo`, `p3TimedSrt`, and `p3TimedSrtPath`.

## 5. SOURCE IDENTITY & BOUNDARIES

Every pipeline artifact must preserve or remain traceable to the same job/source identity. Pipeline 3 must not mutate P1/P2 source artifacts. P2 clean video remains the video basis; P3 creates only derived finalization artifacts and final output.

## 6. CURRENT VERIFICATION STATUS

BUG-034 source implementation is published on PR #47. PM logic/scope review passed at source head `55faf3e734120edec93ba22798599eaf16b6be13`, but static checks and Owner runtime/listening verification remain required. Merge remains blocked.