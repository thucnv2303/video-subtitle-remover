# API and Artifact Contracts

## Scope
Canonical cross-pipeline contract for Pipeline 1 optional script modes plus inherited Pipeline 2 / Pipeline 3 responsibilities. Source remains implementation truth.

## Pipeline 1 mode snapshot
Per-run Job config:
```json
{"semanticRemixEnabled": false}
```
Preference key: `p1_semantic_remix_enabled`. Default: `false`. The Start snapshot is authoritative for the running Job.

## Standard Script contract — DEFAULT
Inputs:
- full timestamped ASR transcript;
- adaptive Vision evidence from the original video;
- source duration;
- selected voice and speed telemetry;
- user prompt/config.

Outputs:
```text
artifact_version: 4
analysis_mode: multimodal-standard-script-v4
semantic_remix_enabled: false
```

`remix_script.json` contains the authoritative continuous Standard narration. `edit_plan.json` must remain non-authoritative with `plan: []`; Standard mode cannot command P3 scene reorder.

### D-016 Standard narration duration contract
The selected voice/speed and source duration define a voice-aware character budget. For Standard mode, this is a writing-quality target before TTS, not a post-render video-retiming instruction.

Required behavior:
1. Run the normal grounded multimodal first pass.
2. If the first narration is below the existing minimum budget, run one evidence-backed AI recompose BEFORE TTS.
3. Recompose receives the full transcript, accumulated Vision evidence, source duration and selected voice/speed-derived speaking rate.
4. The AI may expand grounded explanation, sequencing and transitions supported by analyzed source evidence even when the original transcript is short.
5. Filler, repetition, unsupported product/process/health claims and invented facts remain forbidden.
6. Repaired narration must enter the configured hard character range before TTS; otherwise Standard fails closed.
7. TTS remains one continuous full-text synthesis after narration acceptance. This correction does not add a second TTS pass or a repeated post-TTS LLM/TTS duration loop.

For the Owner regression case (~97.57s source, clone-speed budget ~1529–1610 chars), a ~612-char first draft must not proceed directly to TTS.

## Semantic Remix contract — OPT-IN
Semantic reasoning uses full ASR + Vision evidence + canonical global scenes and produces:
- video/product/customer profiles;
- remix strategy;
- ordered grounded remix beats;
- one continuous narration;
- candidate scene edit plan.

Artifacts:
```text
artifact_version: 4
analysis_mode: multimodal-semantic-remix-v4
semantic_remix_enabled: true
```

Only validated Semantic output may set `edit_plan.authoritative:true`.

### Semantic fail-closed guard
Before accepted artifact persistence/TTS:
- referenced scenes must exist;
- strategy target and summed beat targets differ by no more than `max(2s, 5%)`;
- guarded process/action terms must be supported by referenced scene evidence;
- CTA must map to available late final-result evidence when applicable;
- selected unsupported hard claims are rejected;
- predicted narration duration must remain within 70–130% of the summed beat target;
- narration must pass existing deterministic language/repetition quality checks.

D-016 does not force Semantic mode to fill the original source duration. Semantic duration authority remains its validated strategy/beat timeline.

## Duration responsibility
- Standard P1 must not knowingly accept severe narration underfill when full transcript/Vision evidence and voice-aware duration telemetry can support a grounded rewrite; D-016 enforces one pre-TTS evidence-backed recompose when needed.
- P1 still does not perform final video retiming/rendering.
- There is no repeated post-TTS LLM/TTS loop solely to chase exact source occupancy.
- P3 remains final edited-timeline and final voice/video alignment authority.

## Pipeline 2
P2 receives the ORIGINAL video and only removes burned-in subtitles. Required output: `clean_video.mp4`.

## Pipeline 3
P3 consumes approved P1 artifacts plus P2 clean video for final cut/mix/subtitle/render. P3 must not overwrite immutable P1 artifacts. Semantic cut/reorder consumption remains blocked until task-007 Owner Semantic verification passes and a later P3 task explicitly implements it.
