# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — BUG-033 SOURCE PUBLISHED / PM LOGIC-SCOPE REVIEW PASS / STATIC + OWNER RUNTIME WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- BUG-033 approved design/spec commit: `fb9aed75de3c15a83c8aecec7b8cb0a55e09a198`.
- Evidence-aware IPC source commit: `77f5e2186ddb4660c9ba35de245bc8b86d297f33`.
- Duration-controller/resume renderer source commit: `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- PM source review: `4912637906` — PASS logic/scope only, not release PASS.

## BUG-033 Owner evidence that drove this revision
97.57s input:
- Adaptive Vision: 25 keyframes / 4 chunks / 8,8,8,1 frames.
- Global narration: 601 chars while soft target was 1529–1610.
- Quality gate: PASS on the short draft.
- Full-text TTS pass 1: 35.27s = 36.1%.
- Measured target: 1579–1663 chars.
- Previous narration-only fit returned 735 chars and was rejected.
- Measured voice rate was about 17.04 char/s, close to the existing clone estimate; the primary defect was missing grounded source context during large recomposition, not gross voice-rate estimation error.

## Verified root cause / design correction
1. Initial global reasoning has full transcript + Vision evidence, but its lower narration target is intentionally soft.
2. Previous large duration-fit received only the already-short narration + durations; it had lost the full transcript and Vision evidence.
3. Legacy `/api/ai-rewrite` is unsuitable for this expansion because its backend injects constraints to preserve SRT shape, avoid adding ideas and cap output near 130% of source words.
4. Therefore BUG-033 keeps the existing P1 IPC path and extends `ollama:p1FitNarration` with an evidence-backed mode instead of using the legacy rewrite endpoint.

## Source correction published
Compare `fb9aed75... -> da3644f3...` changes exactly two P1 source files:
- `src/main/p1-vision-ipc.js`: +81 / -1.
- `src/renderer/js/pipelines/pipeline1-ai.js`: +264 / -16.
No P2/P3/STTN/Settings/backend/TTS-engine source changed.

### Evidence-backed large correction
- Renderer passes the persisted full transcript plus compact persisted Vision scene/chunk evidence into the existing `fitP1Narration` IPC.
- IPC computes the hard measured range from actual pass-1 voice rate.
- Evidence-backed recomposition may use transcript facts and visually grounded actions/objects, but prompt forbids unsupported claims, repeated CTA/conclusion and filler.
- Candidate is code-validated for hard measured length plus CJK/repeated sentence/near-duplicate/repeated long-phrase quality before final TTS.
- Contract/quality failure gets at most one evidence-backed retry with failure feedback.

### Closed-loop duration controller
- Actual prepared audio duration remains authority; successful range is 95–100%, target 97.5%.
- A near miss that requires no more than ±5% whole-audio tempo correction uses pitch-preserving `atempo` through the existing audio-preparation bridge and is re-measured; no narration rewrite is spent.
- A large miss performs one evidence-backed whole-narration recomposition and one final full-text TTS.
- Pass 2 may receive only the same bounded ±5% final tempo correction.
- Total full-text TTS syntheses are capped at two; otherwise fail closed.

### Late-stage resume
- After pass 1, the Job stores an in-memory duration checkpoint and writes `p1_checkpoint.json` for audit/recovery evidence.
- Same-session retry reuses ASR/Vision/global reasoning when source fingerprint + reasoning model + prompt signature still match.
- If voice/reference/speed signature also matches and pass-1 audio is still reusable, retry reuses its measured duration instead of synthesizing pass 1 again.
- If voice changes, analysis may still be reused but TTS is regenerated.
- Once final TTS begins, old pass-1 audio is conservatively marked non-reusable because `voice.wav` can be replaced.
- Automatic resume after a full app restart remains outside this narrow source patch; persisted JSON is not silently treated as runtime authority without a read/rehydration contract.

## Review / verification status
- Exact source compare and relevant full-file inspection: PASS for logic/scope.
- PM review `4912637906`: PASS logic/scope only.
- GitHub CI/status checks: none configured; absence is not CI PASS.
- ChatGPT environment exact `node --check`: WAITING because container cannot resolve `raw.githubusercontent.com`; no static PASS is claimed.
- Exact final-head `git diff --check`: WAITING.
- Fresh Owner runtime: WAITING.

## Gates
- Execution: PASS for BUG-033 source publication.
- Automated/static verification: WAITING.
- Code review: PASS for logic/scope (`4912637906`), release review still depends on final-head static/runtime evidence.
- Owner manual app verification: WAITING fresh retest.
- Documentation synchronization: PASS after BUG-033 docs publication.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Run exact static checks on the final docs/head, then Owner reruns the 97.57s case and a queued second Job. Required runtime evidence: pass-1 measurement; evidence-fit receives full transcript/Vision context for a large miss; candidate lands inside the logged measured hard range and passes quality; no more than two full-text TTS syntheses; final measured voice is 95–100%; a deliberately retried late duration-control failure resumes without rerunning Adaptive Vision/global reasoning when dependencies are unchanged. Do not merge or start Step 3 before Owner PASS is recorded in canonical `.ai/`.