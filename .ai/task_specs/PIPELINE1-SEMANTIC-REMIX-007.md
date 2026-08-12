# PIPELINE1-SEMANTIC-REMIX-007

## Goal
Upgrade Pipeline 1 from compact multimodal rewrite into an explicit semantic remix planner that analyzes the original video scene-by-scene, understands the video/product/customer, creates a new marketing/storytelling strategy, writes a new grounded narration, and emits a P3-consumable beat-to-source-scene edit plan.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Starting ref: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- New review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Parent Draft PR: #47.
- BUG-034 duration behavior is inherited: P1 does not force voice to occupy 95–100% of the original timeline; P3 owns final timeline/voice fitting.

## Owner product requirement
P1 is NOT a translation/summarization feature. It must use all grounded evidence available from the original video:
- visual scenes/actions/objects/product shots;
- source ASR/subtitle/voice content and timestamps;
- scene order and pacing;
- user prompt/preset intent.

From that evidence P1 must explicitly derive:
1. video profile;
2. product/subject profile;
3. target-customer profile;
4. remix strategy and recommended target duration;
5. ordered remix beats;
6. a new coherent narration;
7. a source-scene/time-range mapping that P3 can later cut/reorder/mix.

A short narration is acceptable only when it is the deliberate consequence of the remix strategy. It must not be an unexplained summary accident.

## Architecture
### Vision stage
Adaptive Vision stays chunked/bounded. Each keyframe scene remains evidence, not a script. Scene evidence must keep:
- globally unique `index` assigned by code, never reset per chunk;
- `chunk_index`;
- `time_sec`;
- deterministic `start_sec` / `end_sec` source window derived from neighboring scene timestamps;
- `visual`;
- `speech_context`;
- `purpose`.

No CV scene-boundary dependency is added in this task. The deterministic midpoint windows are an MVP editing map around sampled evidence points; later scene-boundary refinement may replace them without changing the semantic contract.

### Global semantic reasoning stage
The selected reasoning model receives:
- full timestamped transcript;
- compact scene inventory with globally unique indexes/windows;
- Vision evidence/conflicts;
- original source duration;
- selected TTS voice/speed;
- user prompt/preset.

The output schema must require:

`video_profile`
- `content_type`
- `primary_goal`
- `story_structure`
- `visual_style`
- `pacing`
- `strengths[]`
- `weaknesses[]`

`product_profile`
- `product_or_subject`
- `category`
- `value_proposition`
- `features[]`
- `benefits[]`
- `proof_points[]`
- `unknowns[]`

`customer_profile`
- `target_audience`
- `pains[]`
- `desires[]`
- `objections[]`
- `awareness_level`
- `buying_motivation`

`remix_strategy`
- `objective`
- `angle`
- `hook`
- `story_arc`
- `cta`
- `target_duration_sec`
- `rationale`

`remix_beats[]`
- `beat_index`
- `role`: hook | problem | product | demo | benefit | proof | transition | cta | custom
- `message`
- `source_scene_indexes[]`
- `edit_action`: keep | trim | reorder | montage
- `target_duration_sec`
- `reason`

`narration_script`
- one continuous natural Vietnamese narration;
- newly composed from the semantic strategy, not a literal translation of the source transcript;
- every factual/product claim must be grounded in transcript or Vision evidence;
- may reorganize emphasis/order and describe visible actions/products that are grounded by Vision;
- must not invent unsupported product facts, numerical claims, ingredients, benefits or testimonials.

`edit_notes[]`
- short production notes only.

## Semantic validation
Code must fail closed when:
- no `remix_beats` are returned;
- a beat references a nonexistent global scene index;
- a beat has no source scenes;
- beat indexes are duplicated;
- target durations are non-positive;
- `remix_strategy.target_duration_sec` is non-positive or materially exceeds original source duration without an explicit supported reason;
- narration is empty or fails existing deterministic language/repetition quality gates.

Code should normalize beat order by `beat_index` after validation. Character budget remains a soft maximum/telemetry input, not a requirement to fill the original timeline.

## Derived artifacts — version 4
P1 JSON artifacts move to:
- `artifact_version: 4`
- `analysis_mode: multimodal-semantic-remix-v4`

`scenes.json`
- globally unique scene inventory with source windows.

`multimodal_timeline.json`
- source transcript;
- sampling/chunk provenance;
- scene inventory;
- `video_profile`, `product_profile`, `customer_profile`.

`remix_script.json`
- `remix_strategy`;
- ordered `remix_beats`;
- authoritative continuous `narration_script`;
- narration budget/provenance;
- source and predicted duration telemetry.

`edit_plan.json`
- `target_duration_sec`;
- ordered plan derived from remix beats;
- each plan item contains beat role/message/action, source scene indexes, deterministic source ranges and target duration;
- P3 must be able to consume it later without rediscovering which source scenes support each beat.

Compatibility fields may remain where required by current UI, but the v4 semantic fields are authoritative.

## Duration semantics
- `source_duration_sec` = original source duration.
- `remix_strategy.target_duration_sec` = AI-recommended final remix target based on content density/strategy.
- `voice_duration_sec` = measured P1 TTS duration.

Do not infer that a 97s source requires ~97s of narration.
Do not silently accept a 37s narration as "correct" merely because underlength is non-blocking. Logs/artifacts must expose the remix target so Owner can distinguish an intentional 40s remix from an accidental summary.

P1 normal TTS path remains one full-text synthesis. No second LLM duration-fill call is reintroduced.

## Source scope allowed
- `src/main/p1-vision-ipc.js`
- `src/renderer/js/pipeline1-analysis.js`
- `src/renderer/js/pipelines/pipeline1-ai.js` only if needed to log/persist semantic target telemetry without changing BUG-034 duration responsibility
- canonical `.ai/` files for task/gate synchronization

## Source scope forbidden
- No P2 changes.
- No P3 cut/reorder implementation in this task; this task prepares the contract P3 will consume.
- No backend TTS-engine rewrite.
- No new dependencies.
- No CV scene-boundary library.
- No extra Ollama reasoning pass solely for duration.
- No literal-translation-only fallback that can unlock P2.
- No broad UI redesign.

## Acceptance criteria
1. Global reasoning receives full transcript plus globally indexed visual scene evidence.
2. `video_profile`, `product_profile`, `customer_profile`, `remix_strategy`, `remix_beats`, `narration_script` are required structured outputs.
3. Scene indexes are globally unique across all Vision chunks.
4. Every remix beat references at least one valid source scene.
5. P1 rejects hallucinated/nonexistent scene references before artifact persistence/TTS.
6. `edit_plan.json` maps every beat to deterministic source time ranges.
7. `remix_script.json` records explicit recommended remix target duration independent of original duration.
8. Owner can inspect artifacts and determine why a 97s source became, for example, a ~40–60s remix.
9. Narration remains one continuous TTS input and passes existing deterministic quality gate.
10. P1 does not call `Narration evidence-fit` merely because narration is shorter than source.
11. Artifact version is 4 and analysis mode is `multimodal-semantic-remix-v4`.
12. Existing adaptive Vision, queue isolation, retry behavior, P1→P2 artifact gate and BUG-034 P3 duration responsibility remain intact.

## Required verification
- `node --check src/main/p1-vision-ipc.js`.
- `node --check src/renderer/js/pipeline1-analysis.js`.
- If changed: `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.
- PM direct review of complete changed files and exact diff.
- Fresh Owner runtime on the same/equivalent 97.57s video.
- Owner provides/inspects `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json` from that run.
- Runtime/artifact proof must show meaningful product/customer/strategy fields and multiple beat-to-scene mappings, not merely translated transcript text.
- Exact tested `git rev-parse HEAD` is required.

## Gates
Implementation may proceed on `review/PIPELINE1-SEMANTIC-REMIX-007`. Static verification, PM code review, Owner semantic artifact/runtime verification, documentation synchronization and explicit PM merge approval remain mandatory. Parent PR #47 and the new task must not be merged based on source publication alone.