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

## 2. PIPELINE 1 — SEMANTIC REMIX + NATURAL CONTINUOUS NARRATION

```text
ORIGINAL VIDEO
  ├─ audio -> P1 Whisper ASR with timestamps
  └─ duration/FPS/frame metadata
          ↓
adaptive keyframe/chunk plan
          ↓
chronological Vision evidence
          ↓
canonical scene inventory
  ├─ global unique scene index
  ├─ chunk index
  ├─ evidence timestamp
  └─ deterministic source start/end window
          ↓
semantic global reasoning
  ├─ full timestamped transcript
  ├─ canonical Vision scene inventory
  ├─ visual evidence/conflicts
  ├─ source duration
  ├─ selected voice/speed
  └─ user prompt intent
          ↓
video_profile
product_profile
customer_profile
          ↓
remix_strategy
  ├─ objective / angle / hook / story arc / CTA
  ├─ deliberate target_duration_sec
  └─ rationale
          ↓
ordered remix_beats
  ├─ content role + message
  ├─ source_scene_indexes[]
  ├─ keep | trim | reorder | montage
  └─ target_duration_sec + reason
          ↓
ONE grounded `narration_script`
          ↓
P1 v4 semantic artifacts
          ↓
ONE full-text TTS
  ├─ selected P1 voice/speed
  ├─ exact duration measured
  └─ narration quality/artifact validation
          ↓
P1 duration telemetry
          ↓
P2 may become READY
```

### P1 semantic invariants
- P1 analyzes the ORIGINAL video only.
- P1 is not a transcript-translation or transcript-summary feature. The narration must be the result of video/product/customer understanding and an explicit remix strategy.
- Adaptive Vision remains bounded; no chunk receives more than 8 sampled frames and the existing total safety cap remains in force.
- Vision chunk scene indexes are not trusted as global authority. Code assigns globally unique canonical scene indexes after all Vision chunks finish.
- Canonical scene start/end windows are deterministic midpoint windows around sampled evidence timestamps. They are an MVP edit map, not claimed as CV-detected scene boundaries.
- Every remix beat must reference at least one canonical source scene that actually exists.
- The semantic edit plan must preserve beat-to-source-scene/time-range provenance so P3 does not need to rediscover evidence.
- Product/customer claims must remain grounded in transcript or visual evidence; unknown/conflicting facts must not silently become claims.
- `remix_strategy.target_duration_sec` is the intended remix timeline and may be shorter than the original source when the strategy deliberately removes/reorders content.
- The speech authority is one coherent `narration_script`, not separately synthesized scene segments.
- `/api/tts/generate` remains the continuous-narration path; legacy segmented `/api/tts-retry` is not the P1 narration path.
- Narration character budget is guidance/ceiling telemetry, not proof of final audio duration and not a hard minimum occupancy target.
- P1 does not require voice to occupy 95–100% of the original timeline.
- Normal P1 completion does not run a second LLM duration-fill request or a second TTS solely for occupancy.
- Measured voice/source ratio outside 90–110% remains telemetry/warning; pathological voice/source ratio above 150% remains the inherited P1 safety block.
- Narration quality, semantic contract validity, valid TTS artifact, source identity and required P1 artifacts remain blocking.
- Same-session late TTS/finalization retry may reuse valid analysis/TTS checkpoints when dependency signatures match.

### P1 artifact contract — version 4
P1 artifacts live under `jobs/<job_id>/p1/` and use:

```text
artifact_version: 4
analysis_mode: multimodal-semantic-remix-v4
```

Artifacts include:
- `scenes.json`: canonical globally indexed source-scene evidence with source windows;
- `multimodal_timeline.json`: source transcript + sampling provenance + scene inventory + video/product/customer profiles;
- `remix_script.json`: remix strategy + target duration + ordered remix beats + continuous narration + provenance;
- `edit_plan.json`: target duration + ordered beat plan + source scene indexes/time ranges for P3;
- `remix_script.srt`: semantic narration preview timing;
- `voice.wav`: natural P1 narration audio when TTS enabled;
- `tts_timed.srt`: subtitle timing against actual P1 voice when TTS enabled.

P1 outputs are immutable inputs to later pipelines.

## 3. PIPELINE 2 — SUBTITLE REMOVAL ONLY

Pipeline 2 receives the ORIGINAL video and only removes burned-in subtitles.

Output: `clean_video.mp4`.

P2 must preserve timeline compatibility: no narration generation, no final mix, no automatic speed change for voice matching, no unrelated crop/reorder.

## 4. PIPELINE 3 — FINAL TIMELINE + VOICE FIT + RENDER

Pipeline 3 reads approved P1 semantic artifacts plus P2 clean video. P3 owns final cut/reorder/mix/subtitle/render decisions and therefore owns final voice/video duration alignment.

The v4 `edit_plan.json` is the semantic source for future P3 scene selection/reordering. Task 007 prepares this contract only; it does not implement the new P3 cut/reorder executor yet.

Current inherited BUG-034 voice-fit path:

```text
P2 clean/final-mix video
      +
P1 edit plan + voice.wav + P1 tts_timed.srt
          ↓
P3 establishes final video timeline
          ↓
probe actual mixing-video duration
          ↓
voice/video ratio
  ├─ <0.90
  │    keep natural P1 voice
  │    remaining timeline may carry visuals/music/silence
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
- P3 may cut/reorder only according to validated P1 edit-plan provenance; it must not invent source-scene references.
- Initial automatic P3 voice-fit range is 0.90–1.15 and remains subject to Owner listening validation before release.
- Strong underlength is not stretched extremely to occupy the timeline.
- Overlength above 1.15 is not silently distorted.
- Any adjusted voice is a NEW P3 artifact and never overwrites P1 `voice.wav`.
- If P3 changes voice tempo, subtitle timing must follow the measured derived audio before burn-in.

Derived artifacts when adjustment is required:

```text
jobs/<job_id>/p3/
├── voice.wav
└── tts_timed.srt
```

## 5. SOURCE IDENTITY & BOUNDARIES

Every pipeline artifact must preserve or remain traceable to the same job/source identity. Pipeline 3 must not mutate P1/P2 source artifacts. P2 clean video remains the clean video basis; P3 creates only derived finalization artifacts and final output.

## 6. CURRENT VERIFICATION STATUS

PIPELINE1-SEMANTIC-REMIX-007 source is published on Draft PR #48 on top of `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.

Published task-007 source commits:
- `862e68d5c47447f0033817145757429f38cf830f` — semantic reasoning schema, canonical scene inventory, semantic validation;
- `4a2712c41ad26284e4ecfb2a1f955606051729e8` — v4 semantic artifact persistence and beat-to-source-range edit plan.

Direct GitHub diff/full-source review is in progress/logic-reviewed, but exact-head local Node syntax checks and fresh Owner semantic runtime/artifact verification are still required. Merge remains blocked.