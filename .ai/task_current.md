# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Semantic Remix — Profiles, Remix Beats and P3 Scene Mapping

## Status
NEEDS_REVISION_BUG_036_OWNER_V4_ARTIFACT_FAIL

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Published source commits: `862e68d5c47447f0033817145757429f38cf830f` and `4a2712c41ad26284e4ecfb2a1f955606051729e8`.
- Prior PM source review `4913808619` was PASS logic/scope only and is superseded for release by fresh Owner artifact evidence.

## Fresh Owner v4 artifact evidence
Owner supplied a real v4 artifact set for Job `kkx59hfu0` from the same 97.57s source:
- `artifact_version: 4` / `multimodal-semantic-remix-v4`;
- 25 globally indexed canonical scenes;
- 7 remix beats;
- strategy target 75s;
- semantic coverage 18/25 scenes.

## Confirmed BUG-036 blockers
1. Beat/source-scene semantic mismatch: the molding beat references scenes 12–14, which actually show refined bean powder / ingredients / syrup rather than molding; CTA maps to cooking/portioning scenes rather than final product.
2. Scenes 18–24, which contain filling, shaping/mold, finished product, interior texture and final plate, are omitted from all remix beats even though the narration claims these stages.
3. Unsupported claims appear in artifacts: `nướng`, `không pha tạp chất`, `dễ tiêu hóa`, and `tự nhiên/an toàn` are not supported by supplied transcript/Vision evidence.
4. Timeline is internally inconsistent: strategy target is 75s while beat target durations sum to 50s; there is no explicit visual-only 25s contract.
5. Narration remains strongly underwritten relative to its own strategy: about 500 chars / ~30s expected speech for a 75s intended remix timeline.
6. Uploaded `remix_script.json`/SRT spans the full 97.567s source timeline, while current GitHub `pipeline1-analysis.js` writes preview timing from semantic target duration. Exact tested local HEAD was not supplied, so runtime/source identity remains unproven.

## Corrective requirements
- Beat-to-scene mapping must be semantically checked against the beat message/purpose, not only validate that a scene ID exists.
- Critical source scenes needed by a claimed beat must not be silently skipped.
- Product/customer profiles and narration must not elevate unsupported inferences into facts/benefits.
- Remix target duration must reconcile with beat durations; any visual-only/music-only span must be explicit and P3-consumable.
- Narration coverage must be judged against the semantic remix plan, not original source occupancy. Do not reintroduce the old 95–100% source-duration gate or a second LLM pass solely to fill duration.
- Preserve one continuous TTS and BUG-034 P3 duration authority.

## Required verification after correction
- Exact final `git rev-parse HEAD`.
- `node --check src/main/p1-vision-ipc.js`.
- `node --check src/renderer/js/pipeline1-analysis.js`.
- If changed: `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.
- Fresh Owner rerun on same/equivalent 97.57s source.
- Review v4 `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json` for semantic grounding, correct scene mapping and coherent target/beat/narration timing.

## Gates
Execution: NEEDS_REVISION; automated/static WAITING; code review NEEDS_REVISION; Owner semantic artifact verification FAIL; docs synchronization PASS after BUG-036 intake; P3 semantic cut/reorder BLOCKED; merge BLOCKED.