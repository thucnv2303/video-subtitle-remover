# AgentOS Handoff Status

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006 — Evidence-Aware Continuous Narration, Bounded Reasoning, Quality Gate, and Duration Control`

## Status
BUG-033 SOURCE PUBLISHED / PM LOGIC-SCOPE REVIEW PASS / STATIC + OWNER RUNTIME WAITING

## Review basis
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Approved BUG-033 spec: `fb9aed75de3c15a83c8aecec7b8cb0a55e09a198`.
- Evidence-aware IPC source: `77f5e2186ddb4660c9ba35de245bc8b86d297f33`.
- Duration-controller/resume renderer source: `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- PM review: `4912637906` — PASS logic/scope only, not release PASS.

## Fresh Owner runtime that drove BUG-033
97.57s input -> 25 adaptive keyframes / 4 Vision chunks. Global reasoning produced a clean 601-char narration against soft target 1529–1610. Full-text TTS pass 1 measured 35.27s = 36.1%. Measured target became 1579–1663 chars, but the old narration-only fit returned only 735 chars and was rejected before final TTS.

## Verified root cause
- Measured clone voice rate was about 17.04 char/s, close to the configured estimate, so gross TTS-rate estimation was not the main defect.
- Initial reasoning has full transcript + Vision evidence but allows the lower target to remain soft.
- The old large duration-fit had only the already-short narration + durations, so it lacked grounded source material for a safe 2x–3x expansion.
- Legacy `/api/ai-rewrite` is not a valid substitute because its backend forces SRT-shape preservation, no idea expansion, and an output-word cap near 130% of source.

## Published correction
- Large miss now sends full persisted transcript + compact persisted Vision evidence into the existing `ollama:p1FitNarration` IPC.
- IPC evidence mode computes the hard measured range, uses structured bounds, validates narration length and deterministic quality, and allows at most one bounded evidence-backed retry before returning a candidate.
- Near misses requiring <=5% correction use whole-audio pitch-preserving tempo adjustment and remeasurement instead of an LLM rewrite.
- Large misses use one evidence-backed whole-narration recomposition and one final full-text TTS; total full-text syntheses are capped at two.
- Pass 2 may receive only the same <=5% final tempo correction; otherwise the Job fails closed.
- A late duration-control failure writes an in-memory checkpoint plus `p1_checkpoint.json` audit evidence. Same-session retry can reuse valid ASR/Vision/global reasoning and, when voice signature/pass-1 artifact still match, can reuse pass-1 measured TTS instead of restarting the whole Job.
- Cross-app-restart automatic restore is intentionally not claimed because the current app lacks a checkpoint read/rehydration contract.

## Source scope verified
Compare `fb9aed75... -> da3644f3...` changes exactly:
- `src/main/p1-vision-ipc.js`: +81 / -1.
- `src/renderer/js/pipelines/pipeline1-ai.js`: +264 / -16.
No P2/P3/STTN/Settings/backend/TTS-engine source change.

## Evidence status
- GitHub source compare + relevant full-file inspection: PASS for logic/scope.
- PM review `4912637906`: PASS logic/scope only.
- GitHub CI/status checks: none configured; absence is not PASS.
- Exact final-head Node syntax checks: WAITING.
- Exact final-head `git diff --check`: WAITING.
- Fresh Owner runtime on 97.57s case: WAITING.
- Same-session late-failure resume runtime: WAITING.
- Queued second-Job regression: WAITING.

## Next action
Owner fetches the final docs/head, runs exact static checks, then reruns the same 97.57s case plus a queued second Job. For a large miss, logs must show evidence-backed fit using persisted transcript/Vision context, a candidate inside its measured hard range and quality gate before TTS2, no more than two full-text TTS syntheses, and final measured voice 95–100%. A late-failure retry with unchanged dependencies must log duration-control resume without rerunning Adaptive Vision/global reasoning.

## Gates
Execution PASS; automated/static WAITING; code review PASS logic/scope; Owner verification WAITING; documentation synchronization PASS after final canonical sync; merge BLOCKED; Step 3 BLOCKED.