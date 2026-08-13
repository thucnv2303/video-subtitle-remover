# Project Architecture

## 1. CURRENT IMPLEMENTATION
Electron renderer ES modules + main-process IPC + Python backend.

Relevant P1 modules:
```text
src/main/
├── main.js
├── preload.js
├── p1-vision-ipc.js
├── p1-standard-vision-ipc.js
└── p1-standard-vision-wrapper.js

src/renderer/js/
├── pipeline1-run-config.js
├── pipeline1-analysis.js
├── pipeline1-semantic-validator.js
├── pipeline1-artifact-gate.js
└── pipelines/pipeline1-ai.js
```

Lifecycle remains:
```text
p1Status: idle | queued | processing | finished | error
p2Status: locked | ready | queued | processing | finished | error
p3Status: locked | ready
```

A new upload belongs to P1. P2/P3 remain locked until upstream artifact gates pass.

## 2. PIPELINE 1 — TWO SCRIPT MODES
User chooses before Start:
```text
Kịch bản bình thường        [DEFAULT / Semantic Remix OFF]
Semantic Remix theo cảnh    [OPT-IN]
```

Preference key `p1_semantic_remix_enabled` defaults false. Start snapshots mode into `job.p1Config.semanticRemixEnabled`; running Jobs do not read live UI state.

### 2.1 Standard Script — default
```text
ORIGINAL VIDEO
  ├─ ASR transcript
  └─ adaptive Vision keyframes/chunks
          ↓
known pre-semantic multimodal global reasoning
          ↓
summary + compact insights
          ↓
ONE continuous Vietnamese narration
          ↓
Standard v4 artifacts
          ↓
ONE full-text TTS
          ↓
P2 may become READY
```

Standard invariants:
- normal script generation remains available without Semantic Remix;
- original transcript + Vision evidence remain inputs;
- no authoritative scene reorder instructions to P3;
- artifacts use `multimodal-standard-script-v4` / `semantic_remix_enabled:false`;
- `edit_plan.json` is `authoritative:false` with `plan:[]`;
- narration remains one continuous TTS input.

### 2.2 Semantic Remix — explicit opt-in
```text
ORIGINAL VIDEO
  ├─ timestamped ASR
  └─ adaptive Vision
          ↓
canonical global scene inventory
          ↓
video/product/customer profiles
          ↓
remix_strategy
          ↓
ordered remix_beats
          ↓
ONE continuous narration_script
          ↓
BUG-036 renderer semantic guard
          ↓
Semantic v4 artifacts
          ↓
ONE full-text TTS
```

Semantic invariants:
- profiles/strategy remain grounded in source evidence;
- beats reference canonical source scenes;
- strategy/beat durations must reconcile;
- guarded claims/process mappings must be supported;
- invalid semantic output fails before accepted artifact persistence/TTS.

## 3. P1 ARTIFACT CONTRACT — VERSION 4
Artifact root: `jobs/<job_id>/p1/`.

Shared files:
- `scenes.json`
- `multimodal_timeline.json`
- `remix_script.json`
- `edit_plan.json`
- `remix_script.srt`
- `voice.wav` when TTS enabled
- `tts_timed.srt` when TTS enabled

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

## 4. DURATION RESPONSIBILITY — BUG-034 PRESERVED
- P1 does not require narration voice to fill 95–100% of original source duration.
- Original-source underlength alone is warning/telemetry, not failure.
- P1 does not run another LLM/TTS pass solely to fill original duration.
- P3 owns final edited timeline and final voice/video alignment.

## 5. PIPELINE 2 — SUBTITLE REMOVAL ONLY
P2 receives ORIGINAL source video and only removes burned-in subtitles.

Output: `clean_video.mp4`.

No script generation, semantic planning, final mixing, scene reorder or voice-driven video retiming belongs to P2.

## 6. PIPELINE 3 — FINAL COMPOSITION
P3 consumes approved P1 artifacts + P2 clean video.

Current responsibilities:
- final cut/mix/subtitle/render;
- final timeline authority;
- bounded derived voice fit from BUG-034;
- never overwrite immutable P1 artifacts.

Semantic scene cut/reorder execution remains blocked until the independent task-007 Owner verification passes.

## 7. SOURCE IDENTITY
Every pipeline artifact remains traceable to the same Job/source fingerprint. P3 must not mutate P1/P2 source artifacts. Standard-vs-Semantic mode remains explicit.

## 8. SHARED VOICE LIBRARY
The app has one common clone-voice store:
```text
localStorage.tts_voices
```

Existing Settings/Pipeline selectors and Voice Render consume the same store. Voice Render must not create a private clone library.

Compatible clone record:
```text
name
language
audioPath
optional audioFile / samplePath / note / date
```

Voice Render saving a clone refreshes known selectors such as `tts-voice`, `job-tts-voice`, and `step1-tts-voice`. The generated standalone audio itself does not become a pipeline artifact automatically; the reusable voice definition/reference becomes shared.

## 9. VOICE RENDER — SHARED UTILITY OUTSIDE VIDEO JOBS
Task: `VOICE-RENDER-SHARED-LIBRARY-009` / Draft PR #50.

Voice Render is an app utility, not Pipeline 1:
```text
USER TEXT
  + language
  + selected shared/default/clone voice
          ↓
deterministic bounded chunks
          ↓
SEQUENTIAL existing POST /api/tts/generate
          ↓
<final-stem>.part-001.wav
<final-stem>.part-002.wav
...
          ↓
constrained preload FFmpeg merge
          ↓
standalone final WAV
```

### 9.1 Source boundary
```text
src/main/preload.js
  - read-only local CPU/RAM/app info
  - constrained mergeWavFiles bridge

src/renderer/js/voice-render.js
  - page/sidebar mount
  - shared voice list + preview + clone save
  - long-text split/queue/stop/result/log state

src/renderer/styles/voice-render.css
  - current-app navy/blue visual system
  - persistent sidebar status
  - Voice Render layout/queue/voice/log/modal styling
```

No task-009 source change belongs to P1/P2/P3 implementation, shared video Job lifecycle, `api/server.py`, `api/tts_engine.py`, or dependencies.

### 9.2 Long-text invariants
- multi-thousand-word input is split before TTS;
- split favors paragraph/sentence/whitespace boundaries according to UI setting;
- only one TTS chunk runs at a time;
- voice/language selection is frozen for one run;
- Stop is stop-after-current request; no false mid-request cancellation claim;
- one failed/missing chunk blocks final merge success;
- a new run clears stale prior result state.

### 9.3 Merge boundary
`electronAPI.mergeWavFiles(inputs, output)` is intentionally narrow:
- final output must be `.wav`;
- inputs must exist;
- inputs must be in the final output directory;
- inputs must match `<final-stem>.part-###.wav`;
- FFmpeg merges in supplied order to PCM WAV;
- only validated owned chunks are cleaned after successful merge.

There is no generic renderer file-delete bridge.

### 9.4 Global app status
Voice Render installs the current shared UI shell status card in the left sidebar. It reads:
- backend health;
- TTS status;
- GPU information from existing backend API;
- CPU model/core count and RAM values from read-only preload system information;
- app/Electron version.

Unknown/unavailable values are shown explicitly; no fake success percentage is permitted.

### 9.5 Voice preview/selection
Shared voice list is vertically scrollable. Every row has independent preview and explicit selection. Preview generation must not mutate selected voice.

### 9.6 Isolation from pipelines
Voice Render:
- never creates a video Job;
- never changes `p1Status`, `p2Status`, `p3Status`;
- never unlocks a pipeline gate;
- never creates/mutates P1/P2/P3 artifacts;
- never automatically attaches its rendered WAV to a video.

The shared element is the voice library/engine, not the video-processing lifecycle.

## 10. CURRENT VERIFICATION STATUS
- PR #48 / P1 Semantic Remix remains independently unverified for its own static + Owner gates.
- PR #50 / Voice Render task 009 has source published and PM logic/scope review PASS through application source `066a7cc9b369abf992dd0840c336ad0edb17022a`.
- Exact-head Node syntax and `git diff --check` remain WAITING because the PM verification container cannot resolve GitHub git/raw hosts.
- Owner real-app Voice Render verification is NOT STARTED.
- Merge remains BLOCKED.
