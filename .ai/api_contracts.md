# API and Artifact Contracts

## Scope
Canonical cross-pipeline contract for the current Pipeline 1 optional-script modes plus inherited Pipeline 2 / Pipeline 3 responsibilities. Source remains implementation truth.

## Pipeline 1 mode snapshot
Per-run Job config field:
```json
{
  "semanticRemixEnabled": false
}
```

UI preference:
```text
p1_semantic_remix_enabled
```

Default: `false`.

The Job snapshot at Start is authoritative. Later UI changes must not alter an already-running Job.

## Standard Script contract — DEFAULT
Reasoning uses original-video ASR + adaptive Vision + compact global reasoning and produces one normal continuous Vietnamese narration.

Artifacts:
```text
artifact_version: 4
analysis_mode: multimodal-standard-script-v4
semantic_remix_enabled: false
```

`scenes.json`
- audit evidence only; not authoritative P3 scene-reorder input.

`multimodal_timeline.json`
- source transcript;
- sampling/chunk/keyframe provenance;
- standard compact insights;
- scene evidence for audit.

`remix_script.json`
- authoritative normal continuous `narration_script`;
- narration budget/provenance;
- source-compatible preview segment/SRT data.

`edit_plan.json`
```json
{
  "semantic_remix_enabled": false,
  "authoritative": false,
  "plan": []
}
```

Standard mode therefore cannot accidentally command P3 to cut/reorder source scenes.

## Semantic Remix contract — OPT-IN
Semantic reasoning uses:
- full timestamped ASR transcript;
- adaptive Vision evidence;
- canonical source scenes;
- source duration/FPS/frame metadata;
- user prompt;
- selected TTS voice/speed as guidance/telemetry.

Required semantic output:
- `summary`;
- `video_profile`;
- `product_profile`;
- `customer_profile`;
- `remix_strategy`;
- ordered `remix_beats`;
- one continuous `narration_script`;
- `edit_notes`.

Semantic artifacts:
```text
artifact_version: 4
analysis_mode: multimodal-semantic-remix-v4
semantic_remix_enabled: true
```

### Canonical scene
```json
{
  "index": 20,
  "chunk_index": 2,
  "time_sec": 81.267,
  "start_sec": 79.233,
  "end_sec": 83.3,
  "visual": "grounded visual description",
  "speech_context": "related source speech",
  "purpose": "semantic purpose"
}
```

Semantic rules:
- indexes globally unique inside one Job;
- `0 <= start_sec < end_sec <= source_duration`;
- midpoint ranges are deterministic MVP evidence windows, not CV-accurate scene boundaries.

### Remix strategy
Required fields include objective, angle, hook, story arc, CTA, `target_duration_sec`, rationale.

`target_duration_sec` is a deliberate intended remix timeline, not an accidental narration length and not automatically equal to original source duration.

### Remix beat
```json
{
  "beat_index": 3,
  "role": "demo",
  "message": "semantic message",
  "source_scene_indexes": [20, 21],
  "edit_action": "montage",
  "target_duration_sec": 8,
  "reason": "why the source evidence supports this beat"
}
```

Allowed roles: hook, problem, product, demo, benefit, proof, transition, cta, custom.
Allowed actions: keep, trim, reorder, montage.

### Semantic fail-closed guard
Before accepted artifact persistence/TTS, current candidate must satisfy both main-process structural checks and renderer deterministic checks:
- referenced scenes exist;
- strategy target and sum of beat targets differ by no more than `max(2s, 5%)`;
- guarded process/action words in beat content are supported by referenced scene evidence;
- CTA maps to late final-result evidence when such evidence exists;
- selected unsupported health/composition/product claims are rejected;
- predicted narration duration using configured character-rate telemetry remains within 70–130% of summed beat target duration;
- narration passes existing deterministic language/repetition quality checks.

A semantic result that fails these checks must not publish an authoritative edit plan or unlock downstream as a valid semantic result.

### Semantic artifacts
`scenes.json`
- canonical global scenes + source windows.

`multimodal_timeline.json`
- transcript/provenance;
- canonical scenes;
- video/product/customer profiles;
- semantic validation/coverage telemetry.

`remix_script.json`
- strategy;
- ordered beats;
- continuous narration;
- source duration;
- semantic target duration;
- predicted narration duration telemetry;
- preview segment/SRT data.

`edit_plan.json`
```json
{
  "semantic_remix_enabled": true,
  "authoritative": true,
  "target_duration_sec": 50,
  "plan": [
    {
      "beat_index": 3,
      "role": "demo",
      "message": "semantic message",
      "edit_action": "montage",
      "source_scene_indexes": [20, 21],
      "source_ranges": [
        {"scene_index":20,"start_sec":79.233,"end_sec":83.3,"time_sec":81.267}
      ],
      "target_duration_sec": 8,
      "reason": "mapping rationale"
    }
  ]
}
```

P3 must not consume this authority until task-007 Owner Semantic verification passes and a later P3 implementation explicitly supports it.

## Duration responsibility
Inherited from BUG-034 / D-012:
- P1 does not require narration to occupy 95–100% of original source duration;
- source underlength alone is not a P1 failure;
- P1 does not run another LLM/TTS pass solely to fill original duration;
- P3 owns final edited timeline and final voice/video alignment.

Semantic mode adds an internal coherence check between its own beat plan and predicted narration, without restoring the old source-occupancy gate.

## Pipeline 2
P2 receives the ORIGINAL video and only removes burned-in subtitles.

Required output:
```text
clean_video.mp4
```

P2 does not generate scripts, perform semantic editing or final rendering.

## Pipeline 3
P3 receives approved P1 artifacts plus P2 clean video.

Current responsibilities remain:
- final composition/mix/subtitles/render;
- final duration/voice alignment;
- no overwrite of immutable P1 artifacts.

Semantic cut/reorder consumption is still blocked/not implemented in task 007.