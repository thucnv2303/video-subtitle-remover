# Project Architecture

## 1. Current implementation
Electron renderer ES modules + main-process IPC + Python backend.

Relevant P1 modules:
```text
src/main/main.js
src/main/preload.js
src/main/p1-vision-ipc.js
src/main/p1-standard-vision-ipc.js
src/main/p1-standard-vision-wrapper.js
src/renderer/js/pipeline1-run-config.js
src/renderer/js/pipeline1-analysis.js
src/renderer/js/pipeline1-semantic-validator.js
src/renderer/js/pipeline1-artifact-gate.js
src/renderer/js/pipelines/pipeline1-ai.js
```

Lifecycle remains `p1Status: idle|queued|processing|finished|error`, `p2Status: locked|ready|queued|processing|finished|error`, `p3Status: locked|ready`.

## 2. Pipeline 1 — two script modes
User chooses before Start. Preference `p1_semantic_remix_enabled` defaults false and Start snapshots it into `job.p1Config.semanticRemixEnabled`.

### 2.1 Standard Script — default
```text
ORIGINAL VIDEO
  + full ASR transcript
  + adaptive Vision evidence
  + source duration
  + selected voice/speed telemetry
          ↓
known isolated Standard multimodal reasoning
          ↓
continuous Vietnamese narration draft
          ↓
D-016 pre-TTS duration/quality guard
          ↓ if severely short
ONE evidence-backed AI recompose using transcript + Vision
          ↓
accepted continuous narration
          ↓
ONE full-text TTS
          ↓
Standard v4 artifacts / P2 gate
```

Standard invariants:
- normal script generation remains available without Semantic Remix;
- first pass remains grounded in transcript + Vision;
- selected voice/speed and source duration define the existing voice-aware narration character budget;
- if the first draft is below that minimum, one grounded recompose occurs before TTS;
- the model may expand evidence-backed explanation, visual sequence and transitions even when original speech is short;
- filler, repetition and unsupported claims are forbidden; invalid recompose fails closed;
- TTS runs only after narration acceptance and remains one continuous synthesis;
- no repeated post-TTS LLM/TTS duration-fit loop is introduced;
- `analysis_mode: multimodal-standard-script-v4`, `semantic_remix_enabled:false`;
- `edit_plan.json` remains `authoritative:false` with `plan:[]`.

### 2.2 Semantic Remix — explicit opt-in
```text
ORIGINAL VIDEO
  + timestamped ASR
  + adaptive Vision
          ↓
canonical global scene inventory
          ↓
video/product/customer profiles
          ↓
strategy + ordered beats
          ↓
continuous narration
          ↓
BUG-036 semantic guard
          ↓
Semantic v4 artifacts
          ↓
ONE full-text TTS
```

Semantic duration is validated against its own strategy/beat plan. D-016 does not force Semantic mode to occupy the original source timeline.

## 3. P1 artifact contract v4
Artifact root: `jobs/<job_id>/p1/`.
Shared files include `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`, `remix_script.srt`, `voice.wav` when TTS is enabled, and `tts_timed.srt` when enabled.

Standard authority:
```text
analysis_mode: multimodal-standard-script-v4
semantic_remix_enabled: false
edit_plan.authoritative: false
```

Semantic authority:
```text
analysis_mode: multimodal-semantic-remix-v4
semantic_remix_enabled: true
edit_plan.authoritative: true
```
Only validated Semantic artifacts may later become P3 scene-selection/reorder authority.

## 4. Duration responsibility — D-012 refined by D-016
- P1 still does not edit/retime/render the final video.
- P3 remains final edited-timeline and voice/video alignment authority.
- Standard P1 must nevertheless avoid pathological narration underfill before TTS when it already has source duration, selected voice/speed, transcript and Vision evidence.
- Standard uses one pre-TTS evidence-backed recompose when its first draft misses the minimum voice-aware writing budget.
- There is no repeated post-TTS LLM/TTS loop solely to chase exact source duration.
- Semantic mode remains governed by its own validated remix target/beat timeline, not original-source occupancy.

## 5. Pipeline 2 — subtitle removal only
P2 receives original source video and only removes burned-in subtitles. Output: `clean_video.mp4`. No script generation, semantic planning, final mixing, scene reorder or voice-driven video retiming belongs to P2.

## 6. Pipeline 3 — final composition
P3 consumes approved P1 artifacts + P2 clean video. It owns final cut/mix/subtitle/render and final timeline alignment, and must not overwrite immutable P1/P2 artifacts. Semantic scene cut/reorder execution remains blocked until task-007 Owner Semantic verification passes.

## 7. Source identity
Every pipeline artifact remains traceable to the same Job/source fingerprint. Standard-vs-Semantic mode is explicit.

## 8. Shared Voice Render utility
Voice Render remains outside P1/P2/P3 Jobs and shares the common clone-voice store `localStorage.tts_voices`. It does not create video Jobs, mutate pipeline gates, or attach its standalone WAV to a video automatically.
