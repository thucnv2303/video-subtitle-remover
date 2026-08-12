# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006`

## BUG-033 review basis
- [x] Active branch `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Base SHA `68c750524f9604b7799d97a2b5604d87368f889c`.
- [x] BUG-033 approved design/spec commit `fb9aed75de3c15a83c8aecec7b8cb0a55e09a198`.
- [x] Evidence-aware IPC source commit `77f5e2186ddb4660c9ba35de245bc8b86d297f33`.
- [x] Duration-controller/resume renderer source commit `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- [x] Compare `fb9aed75... -> da3644f3...` changes exactly `src/main/p1-vision-ipc.js` (+81/-1) and `src/renderer/js/pipelines/pipeline1-ai.js` (+264/-16).
- [x] PM review `4912637906` PASS for logic/scope only.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes in BUG-033 source commits.

## Runtime evidence driving BUG-033
- [x] 97.57s input uses adaptive 25 keyframes / 4 chunks / 8,8,8,1 frames.
- [x] Global reasoning produced 601 chars while soft target was 1529–1610.
- [x] Quality gate accepted the clean short narration.
- [x] TTS pass 1 measured 35.27s / 97.57s = 36.1%.
- [x] Measured hard target became 1579–1663 chars.
- [x] Previous narration-only fit returned 735 chars and was rejected before final TTS.
- [x] Measured clone rate was close to configured estimate; gross TTS-rate error is not the primary defect.
- [x] Legacy `/api/ai-rewrite` was verified unsuitable because backend injects no-expansion/SRT-preservation/130%-word constraints.

## BUG-033 source logic review
- [x] Large duration correction receives the full persisted transcript.
- [x] Large duration correction receives compact persisted Vision scene/chunk evidence.
- [x] Evidence-backed fit computes its hard range from actual pass-1 chars/second.
- [x] Evidence-backed structured output has hard `minLength`/`maxLength` bounds.
- [x] Post-parse hard length validation remains defense-in-depth.
- [x] Deterministic CJK/repeated-sentence/near-duplicate/repeated-long-phrase quality validation runs before final TTS.
- [x] Evidence recomposition allows at most one bounded contract/quality retry; no unbounded LLM loop.
- [x] Near misses use whole-audio pitch-preserving tempo correction only when target factor is within ±5%, then remeasure.
- [x] Large miss consumes at most one evidence-backed recomposition and one final full-text TTS.
- [x] Total full-text TTS syntheses are capped at two.
- [x] Pass 2 may use only the same bounded ±5% final tempo correction; otherwise fail closed.
- [x] No P1 segmented `/api/tts-retry` path reintroduced.
- [x] No legacy `/api/ai-rewrite` used by BUG-033 large correction.
- [x] Duration checkpoint is stored in Job memory and written as `p1_checkpoint.json` audit evidence.
- [x] Same-session retry can bypass `runPipeline1MultimodalAnalysis()` only when source fingerprint + reasoning model + prompt signature match.
- [x] Pass-1 TTS reuse additionally requires matching voice/reference/speed signature and `pass1_reusable=true`.
- [x] Pass-1 reuse is disabled before final TTS may replace `voice.wav`.
- [x] Outer P1 error handling no longer overwrites a more specific TTS/duration error stage.
- [x] Cross-app-restart resume is not claimed without a checkpoint read/rehydration contract.

## Previously closed regression coverage to preserve
- [x] Prior two-Job corrective runtime reported queue failure isolation working.
- [x] >60s adaptive coverage previously passed on 97.57s input.
- [x] All Vision chunks previously completed.
- [x] Continuous full-text TTS architecture previously observed.
- [x] Prior successful long-run duration reached 94.62s / 97.57s = 97.0% before the separate narration-quality defect.
- [x] BUG-031 quality gate detects CJK/repeated sentences/repeated long phrases.

## Exact static checks — BLOCKING ON FINAL DOCS/HEAD
- [ ] `git rev-parse HEAD` equals the exact final head supplied for retest.
- [ ] `node --check src/main/p1-vision-ipc.js`.
- [ ] `node --check src/main/preload.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] GitHub CI/status checks — none configured; absence is not CI PASS.

## Fresh Owner 97.57s runtime — BLOCKING
- [ ] Run on exact final head with same/equivalent 97.57s input.
- [ ] Initial global narration remains quality-gated; no repeated tail/CTA, no stray CJK, coherent subject/ingredients.
- [ ] TTS pass 1 logs exact video/voice duration and ratio.
- [ ] If pass 1 is a large miss, log states `Large duration miss` and uses transcript + Vision evidence.
- [ ] Evidence-fit log includes measured hard target and transcript/evidence path, without dumping private raw payloads.
- [ ] Evidence-fit candidate lies inside the logged hard target before TTS2.
- [ ] Evidence-fit candidate passes deterministic narration quality before TTS2.
- [ ] Full-text `/api/tts/generate` occurs no more than twice for the Job.
- [ ] A near miss uses tempo correction only when the required factor is within ±5% and is re-measured.
- [ ] Final successful prepared voice ratio is 95–100% inclusive.
- [ ] P1 completes/unlocks P2 only after the final duration and quality gates pass.

## Late-failure resume runtime — BLOCKING
- [ ] After pass-1 checkpoint exists, force or observe a late duration-control failure without changing source/model/prompt.
- [ ] Retry logs `Resume duration-control` and does not rerun ASR/keyframe extraction/Adaptive Vision/global reasoning.
- [ ] If voice/reference/speed and pass-1 artifact still match, retry logs reuse of pass-1 measured TTS and does not synthesize pass 1 again.
- [ ] If only voice/reference/speed changes, analysis is reused but pass-1 TTS is regenerated.
- [ ] A second queued Job still auto-advances if the first Job fails.
- [ ] Manual Job-detail browsing remains usable during processing.

## Gates
Execution PASS for BUG-033 source publication; automated/static WAITING; code review PASS logic/scope (`4912637906`); Owner runtime/resume verification WAITING; documentation synchronization PASS after final canonical sync; merge BLOCKED; Step 3 BLOCKED.