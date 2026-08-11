# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Voice-Aware Continuous Narration and Bounded Reasoning

## Status
OWNER_FAIL_RECORDED_IMPLEMENTATION_READY

## Authority
- Parent failed head: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Parent Draft PR: #46.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Exact task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner outcome
Pipeline 1 must keep the useful multi-job queue behavior while generating one coherent narration that is written for the selected voice/speed and source duration before TTS. Successful final audio must be 95–100% of source-video duration without cutting voice or changing video speed.

## Required product flow
1. ASR + adaptive Vision collect evidence.
2. Final reasoning receives source duration, selected voice and selected speed.
3. Reasoning returns one continuous `narration_script`, not a per-scene speech script.
4. Synthesize the full narration once.
5. Measure the actual generated audio file duration.
6. If outside 95–100%, rewrite the whole narration once using measured voice rate, then synthesize once more.
7. If still outside range, fail closed and keep P2 locked.
8. Subtitle display timing is generated after full-audio synthesis and must not create speech gaps.

## Source scope allowed
- `src/main/p1-vision-ipc.js`
- `src/main/preload.js`
- `src/renderer/js/pipeline1-analysis.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- canonical `.ai/` files affected by this task.

## Forbidden
- No P2/P3/STTN/Settings changes.
- No broad `app.js` refactor.
- No backend/TTS-engine rewrite merely to preserve legacy segmented TTS.
- No `/api/tts-retry` in the final continuous P1 narration path.
- No video tempo manipulation or voice truncation.
- No unlimited retry loop.
- No true parallel heavy GPU inference.

## Runtime evidence forcing this revision
- 24.30s source -> 48.10s exported voice after pass 2 (197.9%): FAIL.
- 16 separate speech segments were synthesized for the failed narration: wrong product behavior.
- Next queued Job auto-started: preserve this sequential continuation.
- 17.6s Job global reasoning was still running at 349s after Vision completed: latency regression requiring bounded compact reasoning.

## Verification required before Owner retest
- Exact Node syntax checks for every changed JS file.
- Deterministic voice/char-budget tests and 95/100 boundary tests.
- Source proof: no P1 `/api/tts-retry` call; one full-text `/api/tts/generate` call per pass.
- Source proof: final reasoning schema has one narration string and does not regenerate Vision scene descriptions.
- Source proof: at most one whole-script repair and one re-TTS.
- Exact diff hygiene.
- PM diff + full-file review.

## Gates
Execution NOT STARTED; automated/static WAITING; code review WAITING; Owner WAITING; docs sync PASS for failure intake/task definition; merge BLOCKED; Step 3 BLOCKED.
