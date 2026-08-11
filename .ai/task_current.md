# Current Task

## Task ID
PIPELINE1-ADAPTIVE-VISION-004

## Name
Pipeline 1 Adaptive Keyframe Sampling and Hierarchical Vision

## Status
SOURCE_REVIEW_PASS_STATIC_AND_OWNER_RETEST_WAITING

## Authority
- Parent: `review/PIPELINE1-MULTIJOB-RESILIENCE-003@4508eaed5be1130519e57f927f761976dd5a5458`.
- Review branch: `review/PIPELINE1-ADAPTIVE-VISION-004`.
- Draft PR: #45.
- Current reviewed source: `1bde0d6db589f53406de4038f2781d9c3164fbd9`.
- PM review: `4904434998`.
- Exact task spec: `.ai/task_specs/PIPELINE1-ADAPTIVE-VISION-004.md`.

## Goal
Remove fixed-eight sampling as the P1 visual-analysis authority. Calculate keyframe evidence from the actual input duration, bound each Vision request, and preserve whole-video context through one final global reasoning pass.

## Scope
Application source changes are limited to:
- `src/renderer/js/pipeline1-analysis.js`
- `src/main/p1-vision-ipc.js`

No P2/P3/STTN/Settings/TTS source changes.

## Implementation
1. Duration-aware sample count uses approximately 1 frame / 4 seconds.
2. Minimum evidence protects short videos; total frames are hard capped at 80.
3. Samples are evenly distributed over the full source timeline.
4. At most 8 frames are sent per Vision chunk.
5. Chunk boundaries are chronological and cover 0 -> video duration.
6. Chunk transcript contains only overlapping timestamped SRT blocks.
7. Each chunk returns `VISION_SCHEMA` evidence only.
8. All chunk evidence is ordered and supplied with the complete transcript to one global reasoning/remix pass.
9. Final artifacts retain the existing P1 output contract and add sampling/chunk provenance; artifact version becomes 2.
10. Any chunk failure/cancel prevents false P1 success.

## Deterministic checks completed
- 24s: 8 frames / 1 chunk.
- 60s: 15 / 2.
- 300s: 75 / 10.
- 400s: 80 / 10 safety cap.
- Max 8 frames/chunk and complete boundary coverage: PASS.
- SRT overlap slicing simulation: PASS.
- PM source/diff review: PASS `4904434998`.

## Verification still required
- Exact published `node --check src/renderer/js/pipeline1-analysis.js`.
- Exact published `node --check src/main/p1-vision-ipc.js`.
- Exact final `git diff --check` against parent head.
- Owner short-video runtime.
- Owner >60-second runtime proving automatic >8 evidence and multiple chunks.
- Final artifacts + P1->P2 unlock only after all chunks/global reasoning/TTS succeed.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner NOT STARTED; documentation sync PASS after current docs publication; merge BLOCKED; Step 3 BLOCKED.
