# API and Artifact Contracts

## Scope
This file is canonical project-state documentation for cross-pipeline contracts. It describes the currently published Pipeline 1 semantic-remix v4 artifact boundary and the inherited Pipeline 2 / Pipeline 3 responsibilities. Source code remains implementation truth.

## Pipeline 1 semantic analysis input
Pipeline 1 analyzes the ORIGINAL source video.

Reasoning input must include:
- full timestamped ASR transcript for the source video;
- adaptive Vision evidence sampled from the same source video;
- canonical source-scene inventory derived from Vision evidence;
- source duration/FPS/frame metadata;
- user prompt intent;
- selected TTS voice/speed as guidance/telemetry only.

The final semantic reasoning contract must not operate as transcript translation or transcript-only summary.

## Canonical scene contract
Each accepted source scene is code-assigned a globally unique integer `index` after all Vision chunks complete.

Required persisted scene provenance:
```json
{
  "index": 0,
  "chunk_index": 0,
  "time_sec": 1.25,
  "start_sec": 0.0,
  "end_sec": 2.7,
  "visual": "grounded visual description",
  "speech_context": "related speech context",
  "purpose": "semantic purpose"
}
```

Rules:
- scene indexes are globally unique inside one P1 job;
- `0 <= start_sec < end_sec <= source_duration`;
- `start_sec/end_sec` are deterministic midpoint evidence windows for MVP use, not CV-accurate scene boundaries;
- later pipelines may consume these ranges but must not reinterpret an invented scene ID as source truth.

## Pipeline 1 semantic reasoning output
Required top-level semantic fields:
- `summary`;
- `video_profile`;
- `product_profile`;
- `customer_profile`;
- `remix_strategy`;
- ordered `remix_beats`;
- one continuous `narration_script`;
- `edit_notes`.

### `video_profile`
Must describe the source video's content type, goal, story structure, visual style, pacing, strengths and weaknesses.

### `product_profile`
Must separate product/subject identity, category, value proposition, features, benefits, proof points and unknowns. Unsupported claims must remain unknown/neutral rather than becoming facts.

### `customer_profile`
Must express target audience, pains, desires, objections, awareness level and buying motivation only to the extent supported by transcript/Vision evidence.

### `remix_strategy`
Required fields include:
- `objective`;
- `angle`;
- `hook`;
- `story_arc`;
- `cta`;
- `target_duration_sec`;
- `rationale`.

`target_duration_sec` is the intended semantic remix duration. It may be shorter than the original source when the strategy deliberately removes or reorders content. It is not derived merely from accidental narration length.

### `remix_beats[]`
Each beat must include:
```json
{
  "beat_index": 0,
  "role": "hook",
  "message": "semantic message",
  "source_scene_indexes": [3, 4],
  "edit_action": "reorder",
  "target_duration_sec": 4.5,
  "reason": "why these source scenes support this beat"
}
```

Allowed roles:
- `hook`
- `problem`
- `product`
- `demo`
- `benefit`
- `proof`
- `transition`
- `cta`
- `custom`

Allowed edit actions:
- `keep`
- `trim`
- `reorder`
- `montage`

Validation rules:
- beat indexes must be unique non-negative integers;
- every beat references at least one source scene;
- every referenced scene must exist in the canonical scene inventory;
- beat target duration must be positive;
- semantic target duration must be positive and remain within the source-defined safety ceiling;
- invalid semantic references fail before accepted artifact/TTS completion.

## Pipeline 1 artifact contract v4
All semantic-remix artifacts use:
```text
artifact_version: 4
analysis_mode: multimodal-semantic-remix-v4
```

Artifact root:
```text
jobs/<job_id>/p1/
```

### `scenes.json`
Contains source identity/metadata plus canonical globally indexed scene evidence and deterministic source windows.

### `multimodal_timeline.json`
Contains:
- source identity and metadata;
- source transcript SRT;
- sampling/chunk/keyframe provenance;
- canonical scenes;
- `video_profile`;
- `product_profile`;
- `customer_profile`;
- semantic coverage telemetry when available.

### `remix_script.json`
Contains:
- source identity and metadata;
- `remix_strategy`;
- ordered `remix_beats`;
- one continuous `narration_script`;
- original source duration;
- semantic target duration;
- narration budget telemetry;
- semantic coverage;
- preview segment/SRT data.

### `edit_plan.json`
This is the P3-consumable semantic edit contract.

Each plan item contains:
```json
{
  "beat_index": 0,
  "role": "hook",
  "message": "semantic message",
  "edit_action": "reorder",
  "source_scene_indexes": [3, 4],
  "source_ranges": [
    {"scene_index": 3, "start_sec": 8.1, "end_sec": 11.4, "time_sec": 9.7},
    {"scene_index": 4, "start_sec": 11.4, "end_sec": 15.2, "time_sec": 13.1}
  ],
  "target_duration_sec": 4.5,
  "reason": "mapping rationale"
}
```

P3 must consume this provenance when semantic cut/reorder is implemented. P3 must not invent source ranges or overwrite P1 artifacts.

### `remix_script.srt`
Preview timing for the continuous semantic narration. In v4 its preview end is based on semantic target duration rather than automatically forcing original source duration.

### `voice.wav` and `tts_timed.srt`
When TTS is enabled, P1 produces one natural continuous narration audio artifact and timing derived from actual P1 voice. These remain immutable inputs to P3.

## Duration responsibility contract
Inherited from D-012 / BUG-034:
- P1 does not require voice to occupy 95–100% of the original source timeline;
- underlength alone is not a P1 failure;
- P1 does not run a second LLM/TTS pass solely to fill original duration;
- P1 retains only the inherited pathological overlength safety block;
- P3 owns the final edited video timeline and final voice/video alignment.

## Pipeline 2 contract
Pipeline 2 receives the ORIGINAL source video and only removes burned-in subtitles.

Required output:
```text
clean_video.mp4
```

P2 must not generate narration, perform semantic cut/reorder, or render final composition.

## Pipeline 3 contract
Pipeline 3 receives approved P1 semantic artifacts plus P2 clean video.

P3 responsibilities:
- consume the validated semantic `edit_plan.json` when semantic cut/reorder is implemented;
- cut/reorder only from validated source ranges;
- use P2 clean video as video basis;
- mix voice/audio/subtitles;
- own final duration alignment;
- render final video;
- create derived P3 voice/subtitle artifacts when needed without overwriting P1 artifacts.

Task `PIPELINE1-SEMANTIC-REMIX-007` publishes the P1/P3 semantic contract only. P3 semantic cut/reorder execution remains blocked until Owner runtime/artifact verification for task 007 passes.