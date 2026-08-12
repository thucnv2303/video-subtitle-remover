# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Semantic Remix — Profiles, Remix Beats and P3 Scene Mapping

## Status
IMPLEMENTATION_AUTHORIZED_SOURCE_NOT_YET_PUBLISHED

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Starting ref: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Spec commit: `b0597b40e3a3411280344c94ba961644cb6c5d9a`.
- ACTIVE pointer: `.ai/task_specs/ACTIVE.md` at `602ce0781eed359a0145f65b0ec10c392407d320`.

## User outcome
Pipeline 1 must understand the original video as a marketing/storytelling asset, not merely translate or summarize source speech. It must combine scene Vision evidence + transcript/voice context to derive video/product/customer understanding, create a deliberate remix strategy, write a new narration, and emit a beat-to-source-scene/time-range edit plan that Pipeline 3 can consume.

## Required implementation
1. Make scene indexes globally unique across all Vision chunks and derive deterministic source windows around evidence points.
2. Require structured `video_profile`, `product_profile`, `customer_profile`.
3. Require `remix_strategy` with explicit recommended `target_duration_sec` and rationale.
4. Require ordered `remix_beats` with role, message, source scene indexes, edit action, target duration and reason.
5. Validate all scene references before artifact persistence/TTS.
6. Keep one continuous narration, grounded by transcript + visual evidence, not literal translation-only output.
7. Persist artifact version 4 / `multimodal-semantic-remix-v4`.
8. `edit_plan.json` must map every beat to deterministic source time ranges for later P3 cut/reorder implementation.
9. Preserve BUG-034 policy: no hard P1 minimum occupancy and no second duration-fill reasoning/TTS loop.

## Scope allowed
- `src/main/p1-vision-ipc.js`
- `src/renderer/js/pipeline1-analysis.js`
- `src/renderer/js/pipelines/pipeline1-ai.js` only if needed for semantic target telemetry
- affected canonical `.ai/`

## Scope forbidden
No P2 changes, no P3 cut/reorder implementation yet, no backend TTS rewrite, no new dependency, no CV scene-boundary dependency, no broad UI redesign.

## Verification required
- exact source commit SHA;
- `node --check` for every changed JS file;
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`;
- PM exact diff/full-file review;
- fresh 97.57s Owner runtime with v4 artifacts;
- artifact proof of meaningful profiles + multiple valid remix beat mappings;
- exact tested `git rev-parse HEAD`.

## Gates
Execution IN PROGRESS; automated/static WAITING; code review WAITING; Owner verification NOT STARTED; docs final sync WAITING; merge BLOCKED.