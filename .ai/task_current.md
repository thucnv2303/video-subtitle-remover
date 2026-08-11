# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Voice-Aware Continuous Narration and Bounded Reasoning

## Status
OWNER_RUNTIME_FAIL_NEEDS_REVISION

## Authority
- Parent failed head: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c` / PR #46 Owner FAIL.
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Owner-tested head: `5d247d8ee37fc8370a3f05983eeac7cfc850e444`.
- Previous reviewed source head: `e07c02776a5918be7a4d2c1a72b26ed3138027cc` / PM review `4905691792`.
- Spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Fresh Owner runtime failure — 2026-08-11
### Job 1
- Video `24.30s`.
- Continuous TTS pass 1 produced `16.52s` voice = `68.0%`.
- Measured-rate repair target was correctly computed as `391–412` characters from a `280`-character narration.
- Reasoning returned `280` characters again; code accepted the out-of-range repaired text and performed pass 2.
- Pass 2 repeated `16.52s / 68.0%`; Job failed closed.

### Job 2
- Video `17.60s`.
- Adaptive Vision completed: 6 keyframes / 1 chunk; gemma4 Vision `28.3s`.
- Global qwen reasoning started output after `55.5s` but did not complete before the new `150s` timeout.
- Job failed with `OLLAMA_PHASE_TIMEOUT`.

### Behavior that still worked
- Job 1 failure did not stall the queue; Job 2 auto-started.
- Continuous TTS uses `/api/tts/generate`; old segmented `/api/tts-retry` behavior did not reappear in the supplied log.

## Verified corrective scope
1. Enforce narration character bounds structurally and in code. Prompt-only length requirements are insufficient.
2. Do not permit final TTS pass when repaired narration is outside the computed repair budget.
3. Make the final reasoning JSON much smaller/bounded for short videos: lower output token floor and cap nonessential insight/edit metadata.
4. Keep the selected reasoning model; no silent model switch.
5. Preserve queue auto-advance, manual Job browsing, continuous full-text TTS, max one narration fit + one re-TTS, and P2 lock on failure.

## Source scope allowed for correction
- `src/main/p1-vision-ipc.js`
- `src/renderer/js/pipelines/pipeline1-ai.js` only if renderer-side validation is needed.
- canonical `.ai/` files affected by the fresh failure.

## Forbidden
- No P2/P3/STTN/Settings change.
- No TTS-engine/backend rewrite.
- No video tempo manipulation to force duration.
- No voice truncation.
- No unlimited retry.
- No silent replacement of qwen3-coder:30b with another reasoning model.

## Verification required before next Owner retest
- Exact Node syntax checks on every changed JS file.
- Deterministic test proving 280 chars is rejected for a 391–412 repair budget before re-TTS.
- Deterministic final-schema/token-budget test for a ~18s narration.
- Source proof of one repair maximum and one final TTS maximum.
- Exact diff hygiene.
- PM diff + full-file review.

## Gates
Execution NEEDS REVISION; automated/static WAITING; code review INVALIDATED by Owner FAIL; Owner FAIL on `5d247d8...`; docs sync PASS after failure intake publication; merge BLOCKED; Step 3 BLOCKED.
