# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Voice-Aware Continuous Narration, Bounded Reasoning, Narration Quality Gate, and Evidence-Aware Duration Control

## Status
BUG033_SOURCE_PUBLISHED_PM_REVIEW_PASS_STATIC_AND_OWNER_RUNTIME_WAITING

## Authority
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Approved BUG-033 spec: `fb9aed75de3c15a83c8aecec7b8cb0a55e09a198`.
- Evidence-aware IPC source: `77f5e2186ddb4660c9ba35de245bc8b86d297f33`.
- Duration-controller/resume renderer source: `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- PM source review: `4912637906` — PASS logic/scope only.

## Problem closed at source level
Fresh 97.57s Owner evidence showed 601-char narration -> 35.27s/36.1%, measured target 1579–1663, then narration-only fit returned 735 chars. The measured rate was close to the configured clone estimate; the large correction failed because the fit phase no longer had the full transcript and Vision evidence needed to add grounded content.

## Implemented BUG-033 controller
1. Large duration misses now call the existing P1 fit IPC with full persisted transcript + compact persisted Vision evidence + current narration + measured audio/video duration.
2. IPC evidence mode computes the measured hard range and validates both length and deterministic quality before returning a candidate.
3. One bounded evidence-backed retry is allowed for JSON/truncation/length/quality contract failure; no unbounded loop.
4. Near misses that require <=5% correction use whole-audio pitch-preserving tempo adjustment and remeasurement instead of an AI rewrite.
5. At most two full-text TTS syntheses are allowed; pass 2 may receive only the same small final tempo correction, then fail closed if still outside 95–100%.
6. A pass-1 checkpoint is kept in Job memory and written to `p1_checkpoint.json` for audit/recovery.
7. Same-session retry can bypass ASR/keyframes/Vision/global reasoning when source fingerprint + model + prompt signature still match.
8. If voice/reference/speed also match and pass-1 audio remains reusable, retry skips pass-1 TTS as well. Voice changes invalidate TTS only.
9. Once final TTS may replace `voice.wav`, pass-1 reuse is conservatively disabled.
10. Legacy `/api/ai-rewrite` is not used because verified backend constraints explicitly oppose the required large expansion.

## Source scope
Compare `fb9aed75... -> da3644f3...` changes exactly:
- `src/main/p1-vision-ipc.js` (+81/-1)
- `src/renderer/js/pipelines/pipeline1-ai.js` (+264/-16)
No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Verification required before release
- Exact final docs/head `git rev-parse HEAD`.
- `node --check src/main/p1-vision-ipc.js`.
- `node --check src/main/preload.js`.
- `node --check src/renderer/js/pipeline1-analysis.js`.
- `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- Fresh Owner 97.57s runtime: large miss must log evidence-fit hard target, produce candidate inside range/quality before TTS2, use <=2 full-text TTS requests, and finish at 95–100%.
- Resume runtime: after a late duration-control failure, retry with unchanged dependencies must log reuse of multimodal artifacts and must not rerun Adaptive Vision/global reasoning; if pass-1 remains reusable it must also log reuse of pass-1 measurement.
- Queue isolation: a second queued Job still auto-advances if the first fails.

## Gates
Execution PASS for source publication; automated/static WAITING; PM code review PASS logic/scope; Owner runtime WAITING; docs sync PASS after canonical update; merge BLOCKED; Step 3 BLOCKED.