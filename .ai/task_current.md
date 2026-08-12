# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Semantic Remix — Profiles, Remix Beats and P3 Scene Mapping

## Status
SOURCE_PUBLISHED_PM_REVIEW_PASS_STATIC_AND_OWNER_RUNTIME_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Source commits: `862e68d5c47447f0033817145757429f38cf830f` and `4a2712c41ad26284e4ecfb2a1f955606051729e8`.
- PM review: `4913808619` — PASS logic/scope only.

## User outcome
Pipeline 1 now has a semantic-remix contract rather than a translation/summary-only contract. It must understand the original video, product/subject and target customer, create a deliberate remix strategy with an intended target duration, write one grounded new narration, and map every remix beat back to actual source scenes/time ranges for later Pipeline 3 editing.

## Implemented
1. Canonical globally unique scene indexes are assigned in code after Vision chunks complete.
2. Canonical scenes include deterministic source `start_sec/end_sec` windows.
3. Global reasoning requires `video_profile`, `product_profile`, `customer_profile`, `remix_strategy`, `remix_beats`, `narration_script`, `edit_notes`.
4. Prompt explicitly requires full transcript + Vision evidence and forbids translation/summary-only behavior.
5. Semantic validation rejects invalid target duration, empty beats, duplicate beat indexes, invalid role/action, missing source scenes and nonexistent scene references.
6. Narration remains one continuous grounded Vietnamese script and retains deterministic language/repetition quality checks.
7. P1 artifacts use `artifact_version: 4` / `multimodal-semantic-remix-v4`.
8. `multimodal_timeline.json` persists source transcript, canonical scenes and the three semantic profiles.
9. `remix_script.json` persists remix strategy, intended target duration, ordered beats, narration and semantic coverage.
10. `edit_plan.json` maps each beat to canonical source time ranges.
11. BUG-034 behavior is preserved: no hard P1 minimum occupancy and no second LLM/TTS pass solely to fill original timeline.
12. P2/P3/backend/dependencies remain untouched by task-007 source changes.

## Verification required
- Exact final `git rev-parse HEAD`.
- `node --check src/main/p1-vision-ipc.js`.
- `node --check src/renderer/js/pipeline1-analysis.js`.
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.
- Owner reruns same/equivalent 97.57s video on exact final HEAD.
- Inspect `scenes.json`: indexes globally unique; source windows valid.
- Inspect `multimodal_timeline.json`: meaningful video/product/customer profiles, not transcript-only metadata.
- Inspect `remix_script.json`: deliberate target duration + multiple ordered beats + new grounded narration.
- Inspect `edit_plan.json`: every beat references valid source scenes/time ranges.
- Runtime must not emit `Narration evidence-fit` solely because narration is shorter than original source.

## Known limits
- Scene windows are deterministic midpoint windows around sampled Vision evidence, not CV scene-boundary detection.
- Semantic factual correctness still requires Owner inspection; schema/reference validation alone cannot prove every inferred marketing insight.

## Gates
Execution PASS; automated/static WAITING; code review PASS logic/scope; Owner semantic verification NOT STARTED; docs sync PASS; merge BLOCKED.