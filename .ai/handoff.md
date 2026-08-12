# AgentOS Handoff Status

## Active task
`PIPELINE1-SEMANTIC-REMIX-007 — Profiles, Remix Beats and P3 Scene Mapping`

## Status
IMPLEMENTATION AUTHORIZED / SOURCE NOT YET PUBLISHED

## Review basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Starting ref: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Spec commit: `b0597b40e3a3411280344c94ba961644cb6c5d9a`.
- ACTIVE pointer commit: `602ce0781eed359a0145f65b0ec10c392407d320`.

## Why this task exists
Fresh Owner runtime proves BUG-034 no longer needs to force voice to fill the original timeline, but it exposes a deeper product gap: the current P1 contract can generate a short narration without proving that the short result came from an intentional remix strategy. Owner requires actual remix planning, not transcript translation/summary.

## Required semantic flow
Original video -> ASR + adaptive Vision -> globally indexed scene inventory -> video profile -> product/subject profile -> customer profile -> remix strategy + recommended target duration -> ordered remix beats -> grounded continuous narration -> edit plan with beat-to-source-scene/time-range mapping -> P1 artifacts/TTS.

## Non-negotiable constraints
- Full transcript and Vision evidence both remain reasoning inputs.
- Narration may be newly composed/reordered but factual claims must be grounded.
- A beat may only reference source scenes that actually exist.
- Scene indexes must be globally unique across Vision chunks.
- Artifact version becomes 4 and analysis mode `multimodal-semantic-remix-v4`.
- BUG-034 duration responsibility remains: no hard P1 minimum occupancy and no second LLM/TTS call solely to fill timeline.
- P2 is untouched.
- P3 cut/reorder implementation is NOT part of this task; this task produces the contract it will consume.

## Allowed source
- `src/main/p1-vision-ipc.js`
- `src/renderer/js/pipeline1-analysis.js`
- `src/renderer/js/pipelines/pipeline1-ai.js` only if semantic target telemetry requires it

## Required implementation evidence
- exact changed files and commit SHA;
- `node --check` on every changed JS file;
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`;
- no out-of-scope changes;
- PM review before Owner runtime.

## Owner verification after PM PASS
Run same/equivalent 97.57s source on exact final HEAD. Inspect `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`. The artifacts must show meaningful video/product/customer profiles, explicit remix target duration, multiple ordered beats, and valid source-scene/time-range mappings. Exact tested `git rev-parse HEAD` is mandatory.

## Gates
Execution IN PROGRESS; automated/static WAITING; code review WAITING; Owner runtime NOT STARTED; docs final sync WAITING; merge BLOCKED.