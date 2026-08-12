# QA Checklist

## Active task
`PIPELINE1-SEMANTIC-REMIX-007 — Profiles, Remix Beats and P3 Scene Mapping`

## Review basis
- [x] Active branch `review/PIPELINE1-SEMANTIC-REMIX-007`.
- [x] Draft PR #48 targets `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- [x] Base SHA `9981da334ca10fd845c971241d541894d736c13b`.
- [x] Exact spec `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- [x] Semantic reasoning source `862e68d5c47447f0033817145757429f38cf830f`.
- [x] Semantic artifact source `4a2712c41ad26284e4ecfb2a1f955606051729e8`.
- [x] PM review `4913808619` PASS logic/scope only.
- [x] Task-007 application source changes are limited to `src/main/p1-vision-ipc.js` and `src/renderer/js/pipeline1-analysis.js`.
- [x] No P2/P3/backend/TTS-engine/dependency source change in task 007.

## Semantic remix source logic review
### Evidence + scene inventory
- [x] P1 still receives full timestamped transcript and adaptive Vision evidence from the original video.
- [x] Vision chunk-local scene indexes are not used as global authority.
- [x] Code assigns globally unique canonical scene indexes after all Vision chunks complete.
- [x] Canonical scenes carry `chunk_index`, `time_sec`, deterministic `start_sec`, and `end_sec`.
- [x] Source windows are bounded to source duration and positive-length.
- [x] Midpoint windows are explicitly treated as MVP deterministic evidence windows, not CV scene-boundary detection.

### Semantic reasoning contract
- [x] Global reasoning requires `video_profile`.
- [x] Global reasoning requires `product_profile`.
- [x] Global reasoning requires `customer_profile`.
- [x] Global reasoning requires `remix_strategy` with deliberate `target_duration_sec` and rationale.
- [x] Global reasoning requires ordered `remix_beats`.
- [x] Prompt explicitly rejects transcript translation/summary-only behavior.
- [x] Narration must be newly composed from transcript + Vision evidence + semantic strategy.
- [x] Product/customer claims must remain grounded; unknown/conflicting facts cannot silently become claims.
- [x] Narration remains one continuous Vietnamese script.
- [x] Existing CJK/repetition quality gates remain active.

### Beat/reference validation
- [x] Empty beat plan is rejected.
- [x] Duplicate `beat_index` is rejected.
- [x] Invalid beat role/action is rejected.
- [x] Missing `source_scene_indexes` is rejected.
- [x] A beat referencing a nonexistent canonical scene is rejected.
- [x] Invalid/non-positive semantic target duration is rejected.
- [x] Semantic target above the configured safety ceiling is rejected.

### Artifact v4 contract
- [x] `artifact_version: 4`.
- [x] `analysis_mode: multimodal-semantic-remix-v4`.
- [x] `scenes.json` persists canonical globally indexed scene evidence + source windows.
- [x] `multimodal_timeline.json` persists source transcript, scene provenance, and video/product/customer profiles.
- [x] `remix_script.json` persists remix strategy, target duration, ordered beats, narration, and semantic coverage.
- [x] `edit_plan.json` maps each beat to source scene indexes and deterministic source time ranges.
- [x] `remix_script.srt` preview duration uses semantic target duration rather than automatically forcing original source duration.

### BUG-034 regression invariants
- [x] P1 does not restore a hard 95–100% original-video voice occupancy minimum.
- [x] Normal successful P1 does not launch another LLM request solely to fill original timeline.
- [x] Normal successful P1 does not launch a second TTS solely for occupancy.
- [x] P3 remains final timeline/voice-fit authority.
- [x] P2 remains subtitle-removal only.

## Exact static checks — BLOCKING
- [ ] `git rev-parse HEAD` equals the exact PR #48 head being tested.
- [ ] `node --check src/main/p1-vision-ipc.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] Recommended regression syntax: `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.
- [ ] GitHub CI/status: none configured; absence is not CI PASS.

## Fresh Owner semantic runtime — BLOCKING
Use the same/equivalent ~97.57s source on the exact final PR #48 head.

### Runtime flow
- [ ] ASR completes with timestamped source transcript.
- [ ] Adaptive Vision completes all planned chunks.
- [ ] Log reports canonical semantic scene inventory with globally indexed scenes.
- [ ] Global semantic remix reasoning completes.
- [ ] P1 produces one continuous narration and one normal full-text TTS when TTS is enabled.
- [ ] A short voice relative to the original source only produces duration telemetry/warning and does NOT emit `Narration evidence-fit` solely for occupancy.
- [ ] P1 completes and downstream gate behavior remains valid when semantic artifacts/TTS are valid.

### `scenes.json`
- [ ] `artifact_version == 4` and `analysis_mode == multimodal-semantic-remix-v4`.
- [ ] Scene indexes are unique across the whole video.
- [ ] Scene indexes referenced by remix beats exist.
- [ ] Every scene used by a beat has valid `start_sec < end_sec` within source duration.
- [ ] Scene descriptions correspond plausibly to the actual video evidence.

### `multimodal_timeline.json`
- [ ] Contains source transcript provenance.
- [ ] Contains meaningful `video_profile`, not generic filler.
- [ ] Contains meaningful `product_profile`, with unsupported facts left unknown/neutral.
- [ ] Contains meaningful `customer_profile`, grounded in available evidence rather than invented demographics/claims.
- [ ] Profiles reflect both visual evidence and transcript content rather than transcript-only translation.

### `remix_script.json`
- [ ] Contains deliberate `remix_strategy.target_duration_sec` and rationale.
- [ ] Target duration is explainable as a remix decision, not merely equal to accidental narration length.
- [ ] Contains multiple ordered `remix_beats` when the source contains multiple meaningful sections.
- [ ] Beat sequence reflects a coherent hook/problem/product/demo/benefit/proof/CTA or equivalent story arc when evidence supports it.
- [ ] Narration is newly composed and does not simply translate/paraphrase the original transcript line by line.
- [ ] Narration contains no unsupported product claim, duplicated CTA, repetitive filler, or stray CJK.

### `edit_plan.json`
- [ ] Every beat has at least one source scene reference.
- [ ] Every source scene reference resolves to a real source range.
- [ ] `source_ranges` are deterministic and within source duration.
- [ ] Reordered/montage beats still preserve source provenance.
- [ ] Plan is sufficiently explicit for future P3 cut/reorder implementation without re-running Vision.

## Regression coverage
- [ ] Second queued P1 Job still auto-advances after first Job failure/success.
- [ ] Manual Job browsing remains usable while another P1 Job processes.
- [ ] No segmented `/api/tts-retry` narration path reappears.
- [ ] P2 subtitle-removal behavior remains unchanged.
- [ ] Existing P3 BUG-034 voice-fit behavior remains unchanged by task 007.

## Gates
Execution PASS for task-007 source publication; automated/static WAITING; code review PASS logic/scope (`4913808619`); Owner semantic runtime/artifact verification NOT STARTED; documentation synchronization PASS after semantic architecture/QA/decision/dynamic-state sync; merge BLOCKED.