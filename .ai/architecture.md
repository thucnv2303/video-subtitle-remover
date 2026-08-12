# Project Architecture

## 1. CURRENT IMPLEMENTATION
Electron renderer ES modules + main-process IPC + Python backend.

Relevant P1 modules:
```text
src/main/
├── main.js
├── preload.js
├── p1-vision-ipc.js                 # Semantic Remix reasoning
├── p1-standard-vision-ipc.js        # exact pre-semantic Standard reasoning snapshot
└── p1-standard-vision-wrapper.js    # isolated Standard IPC names

src/renderer/js/
├── pipeline1-run-config.js           # mode UI/persistence/job snapshot
├── pipeline1-analysis.js             # mode router + artifacts
├── pipeline1-semantic-validator.js   # BUG-036 fail-closed guard
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

Preference key:
```text
p1_semantic_remix_enabled
```
Default false. Start snapshots mode into `job.p1Config.semanticRemixEnabled`; running Jobs do not read live UI state.

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

Standard reasoning is deliberately isolated from the Semantic implementation using the exact starting-ref pre-semantic `p1-vision-ipc.js` blob registered under separate IPC names.

Standard invariants:
- normal script generation remains available without enabling Semantic Remix;
- it still analyzes original-video transcript + Vision evidence;
- it does not issue authoritative scene reorder instructions to P3;
- artifacts use `multimodal-standard-script-v4` / `semantic_remix_enabled:false`;
- `edit_plan.json` is `authoritative:false` with `plan:[]`;
- source-duration preview compatibility is retained;
- narration remains one continuous TTS input.

### 2.2 Semantic Remix — explicit opt-in
```text
ORIGINAL VIDEO
  ├─ timestamped ASR
  └─ adaptive Vision
          ↓
canonical global scene inventory
          ↓
video_profile
product_profile
customer_profile
          ↓
remix_strategy
          ↓
ordered remix_beats
  ├─ role/message
  ├─ source_scene_indexes[]
  ├─ edit action
  ├─ target_duration_sec
  └─ reason
          ↓
ONE continuous narration_script
          ↓
BUG-036 renderer semantic guard
          ↓
Semantic v4 artifacts
          ↓
ONE full-text TTS
```

Canonical Semantic scenes contain globally unique index, chunk index, evidence time and deterministic midpoint start/end source windows. These are MVP evidence ranges, not CV-detected exact shot boundaries.

Semantic invariants:
- not a translation-only/transcript-summary feature;
- profiles/strategy must remain grounded in source transcript + Vision evidence;
- every beat references existing canonical source scenes;
- strategy target must reconcile with summed beat targets within `max(2s,5%)`;
- guarded process/action terms must be supported by referenced scene evidence;
- CTA must use final-result evidence when available in late scenes;
- selected health/composition/product claims without source evidence are rejected;
- predicted narration duration must be 70–130% of summed beat target duration;
- invalid semantic output fails before accepted artifact persistence/TTS.

This renderer guard is in addition to existing main-process structural/schema/language/repetition checks. It does not add another LLM pass solely for duration.

## 3. P1 ARTIFACT CONTRACT — VERSION 4
Artifact root:
```text
jobs/<job_id>/p1/
```

Shared files:
- `scenes.json`
- `multimodal_timeline.json`
- `remix_script.json`
- `edit_plan.json`
- `remix_script.srt`
- `voice.wav` when TTS enabled
- `tts_timed.srt` when TTS enabled

Mode authority is explicit inside artifacts.

Standard:
```text
analysis_mode: multimodal-standard-script-v4
semantic_remix_enabled: false
edit_plan.authoritative: false
```

Semantic:
```text
analysis_mode: multimodal-semantic-remix-v4
semantic_remix_enabled: true
edit_plan.authoritative: true
```

Only validated Semantic artifacts may later become P3 scene-selection/reorder authority. Standard artifacts never implicitly request semantic editing.

## 4. DURATION RESPONSIBILITY — BUG-034 PRESERVED
P1 does not require narration voice to fill 95–100% of the ORIGINAL source video.

- Original-source underlength alone is warning/telemetry, not failure.
- P1 does not run another LLM/TTS pass solely to fill original duration.
- Pathological P1 overlength protection remains inherited.
- Semantic mode separately verifies narration coverage against its OWN beat plan. This is plan-coherence validation, not source-occupancy enforcement.
- P3 owns final edited timeline and final voice/video alignment.

## 5. PIPELINE 2 — SUBTITLE REMOVAL ONLY
P2 receives ORIGINAL source video and only removes burned-in subtitles.

Output:
```text
clean_video.mp4
```

No script generation, semantic planning, final mixing, scene reorder or voice-driven video retiming belongs to P2.

## 6. PIPELINE 3 — FINAL COMPOSITION
P3 consumes approved P1 artifacts + P2 clean video.

Current responsibilities:
- final cut/mix/subtitle/render;
- final timeline authority;
- bounded derived voice fit from BUG-034;
- never overwrite immutable P1 artifacts.

Current inherited voice-fit policy:
```text
voice/video < 0.90     keep natural P1 voice
~1.00                  use P1 voice
0.90–1.15 mismatch     may create derived pitch-preserving P3 voice
>1.15                  refuse automatic extreme stretch
```

Semantic scene cut/reorder execution is NOT implemented by task 007. It remains blocked until Owner verifies corrected Semantic artifacts.

## 7. SOURCE IDENTITY
Every artifact remains traceable to the same Job/source fingerprint. P3 must not mutate P1/P2 source artifacts. Standard-vs-Semantic mode must remain explicit; P3 must never infer Semantic authority from file presence alone.

## 8. STANDALONE UTILITIES — OUTSIDE THE THREE PIPELINES
Standalone app utilities may reuse shared engines only when they remain outside the video Job lifecycle and do not mutate pipeline artifacts or gates.

### Voice Render — VOICE-RENDER-TAB-008
```text
USER TEXT
  + language
  + optional saved clone reference
  + chosen WAV output path
          ↓
existing POST /api/tts/generate
          ↓
existing OmniVoice TTS engine
          ↓
standalone WAV file
```

Voice Render source:
```text
src/main/preload.js                    # loads isolated renderer utility
src/renderer/js/voice-render.js        # standalone UI/state/render orchestration
src/renderer/styles/voice-render.css   # isolated utility styling
```

Voice Render invariants:
- sidebar destination is below Home and before Settings;
- uses OmniVoice default or saved clone references from existing `tts_voices` settings storage;
- does not create a P1/P2/P3 Job;
- does not read/write pipeline status or downstream gates;
- does not attach generated audio to video automatically;
- does not create or mutate P1/P2/P3 artifacts;
- does not require a new backend or TTS-engine contract for the demo;
- backend `voice_name` is omitted so the utility stays on the existing OmniVoice route;
- output is a user-selected standalone WAV file.

This utility can share the OmniVoice engine implementation with Pipeline 1 without becoming part of Pipeline 1.

## 9. CURRENT VERIFICATION STATUS
- Parent corrective opt-in/BUG-036 source remains on Draft PR #48 with its own static and Owner two-mode verification still required.
- Standalone Voice Render demo is published on Draft PR #49. Node syntax for its changed JavaScript has been checked by Project Manager; final exact-head docs/source review and Owner real-app visual/runtime verification remain required.
- Merge remains blocked until the relevant task gates pass.
