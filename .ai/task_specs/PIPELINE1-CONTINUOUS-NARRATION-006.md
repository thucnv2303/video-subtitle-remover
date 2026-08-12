# PIPELINE1-CONTINUOUS-NARRATION-006

## Goal
Restore the good multi-job Pipeline 1 flow while replacing post-hoc segmented duration fitting with voice-aware continuous narration generation. The narration must read naturally from beginning to end, target the selected voice/speed and source-video duration before TTS, and remain within the final Owner gate without creating artificial per-segment pauses.

## Exact basis
- Parent review branch: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- Starting SHA: `68c750524f9604b7799d97a2b5604d87368f889c`.
- Parent Draft PR: #46.
- New review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- BUG-033 design authority head before implementation: `ec513bf70ec183b84189f637d39627cf639cbafa`.

## Owner runtime evidence — 2026-08-11
1. PR #46 Job 1 fails the new duration gate after pass 2: source video 24.30s, exported voice 48.10s, ratio 197.9%.
2. The generated narration is split into 16 TTS segments. Owner requires one coherent script read continuously from start to finish; segmentation may be used later only for subtitle display timing, not to synthesize separate speech clips.
3. The current selected voice configuration is available before global reasoning, but the global reasoning request does not receive voice/speed information.
4. Job 2 progresses through adaptive Vision, then `qwen3-coder:30b` global reasoning reaches 349s and is still generating. Current code allows 360s per global reasoning attempt, which is unacceptable runtime for this short 17.6s input.
5. Previous revision behavior of automatically continuing the queued Jobs is preferred. True simultaneous heavy GPU inference is not required; safe sequential auto-advance must remain intact.

## Verified root causes from earlier revisions
- `FINAL_SCHEMA` required `script_segments`; `outputContractPrompt()` asked every script segment to be short. The product therefore generated segmented narration by design.
- `pipeline1-analysis.js` normalized reasoning output back into timed script segments before TTS.
- `pipeline1-analysis.js -> analyzeP1Vision` did not pass `ttsVoice` or `ttsSpeed`, so global reasoning could not budget narration for the selected voice.
- `/api/tts-retry` pre-processed text longer than 30 words into multiple synthesized clips and later placed gaps between them. This directly conflicted with the Owner's continuous-narration requirement.
- PR #46 duration repair preserved exact SRT segment count/timestamps, so it optimized the wrong artifact shape and could remain grossly over duration.
- Global reasoning asked a 30B model to regenerate summary + insights + scenes + segmented script + edit plan under a large structured schema; Vision scenes were already available from chunk analysis, so this duplicated output and increased latency.

## BUG-033 Owner runtime evidence — 2026-08-12
The latest 97.57s run proves the remaining problem is not primarily a TTS-rate-estimation defect:
- Adaptive Vision succeeds: 25 keyframes / 4 chunks / 8,8,8,1 frames.
- Global reasoning returns a quality-gate-clean narration of 601 chars while the initial soft target is 1529–1610 chars.
- Full-text TTS pass 1 measures 35.27s = 36.1% of the 97.57s video.
- Measured rate is about 17.04 chars/s, close to the configured clone estimate 16.5 chars/s.
- Measured duration target becomes 1579–1663 chars.
- Existing narration-only fit returns only 735 chars and is rejected before final TTS.

## BUG-033 diagnosis decisions
1. Keep the final successful voice gate at 95–100% of source-video duration; target 97.5%.
2. Character count is a predictor/constraint only. The actual prepared audio duration remains the gate authority.
3. AI may expand narration using facts from the full transcript and descriptions/actions/objects grounded in stored Vision evidence, including visual-only spans.
4. AI may add natural transitions that connect grounded evidence, but may not invent claims, product facts, ingredients, numbers, benefits, or generic filler solely to occupy time.
5. If evidence cannot support the target without filler/invention, fail with a specific grounded-content/duration diagnostic rather than padding.
6. The current narration-only duration-fit is not sufficient for large corrections because it has lost the original evidence context.
7. A small near-miss should not trigger another LLM rewrite: allow pitch-preserving whole-audio tempo correction only when the required correction factor is within ±5% and the resulting measured audio passes 95–100%.
8. A large miss must use one evidence-backed whole-narration recomposition from the full transcript + stored Vision evidence + measured voice rate before final TTS.
9. At most two full TTS syntheses are allowed. Evidence recomposition may have one bounded contract/quality retry before the second TTS; there is no unbounded loop.
10. A late duration-control failure must be resumable in the current app session without rerunning ASR, keyframe extraction, Vision chunks, or initial global reasoning when their dependency signature is unchanged.

## MVP solution
### A. Voice-aware script before TTS
- Pass source duration, selected `ttsVoice`, and selected `ttsSpeed` into final reasoning.
- Derive a conservative initial narration character budget from the voice class and selected speed, targeting about 97% of video duration.
- Final reasoning outputs exactly one `narration_script` string, not `script_segments`.
- The narration is one coherent Vietnamese passage: no SRT numbering, no bullets, no per-scene mini-script, no repeated CTA/benefit filler.
- Preserve factual grounding from transcript + visual evidence.

### B. Reduce global-reasoning work
- Reuse scenes already produced by Vision chunks instead of asking the 30B reasoning model to regenerate scene descriptions.
- Final reasoning schema contains compact summary/insights, one narration string, compact edit plan/notes.
- Bound output tokens from the actual narration character budget and use a shorter adaptive timeout. Short-video reasoning must not sit for ~6 minutes.
- Keep the configured reasoning model; do not silently switch the Owner's selected model.

### C. Continuous TTS
- Do not use legacy `/api/tts-retry` for Pipeline 1 continuous narration.
- Use existing `/api/tts/generate` once with the full narration text and selected voice/reference audio per TTS pass.
- Apply the selected P1 TTS speed to the generated track with pitch-preserving ffmpeg `atempo` when speed differs from 1.0.
- Probe the resulting audio file duration with ffprobe; this exact file duration is the gate authority.
- Generate subtitle-display SRT after TTS by splitting text only for display/timing. These subtitle chunks must not cause separate TTS synthesis or speech gaps.

### D. Evidence-aware closed-loop duration controller
1. Generate TTS pass 1 and measure the prepared audio duration.
2. If 95–100%, accept immediately.
3. If the required correction to the 97.5% target is within ±5%, apply one pitch-preserving whole-audio tempo correction and re-measure; accept only if the measured result is 95–100%.
4. Otherwise calculate the measured narration target from the pass-1 chars/second rate.
5. For large correction, recompose the whole narration from:
   - current narration;
   - full persisted transcript;
   - persisted multimodal summary/insights/scene evidence;
   - measured pass-1 voice duration;
   - source-video duration;
   - exact measured target character range.
6. Evidence-backed recomposition must pass deterministic CJK/repetition/near-duplicate/long-phrase quality validation and hard measured length range before final TTS.
7. A recomposition contract/quality failure may retry that evidence-backed AI operation once with explicit failure feedback; this retry does not consume an extra TTS pass.
8. Synthesize the corrected whole narration once more.
9. If pass 2 is outside 95–100%, one small ±5% tempo correction is allowed. Re-measure and accept only if the final file is within 95–100%.
10. If still outside the gate, fail closed with a diagnostic. No third TTS and no narration loop.

### E. Late-stage checkpoint/resume
- Persist an in-memory Job checkpoint and a `p1_checkpoint.json` audit file after TTS pass 1.
- Checkpoint fields must include at least: stage, resume stage, source fingerprint, analysis signature, voice signature, narration, pass-1 audio path/duration, source-video duration, and timestamp.
- On a late duration-control/TTS failure, retain `resume_stage=DURATION_CONTROL`.
- On retry in the same app session:
  - if source fingerprint + reasoning model + prompt signature still match, reuse `p1Artifacts`, `p1Analysis`, transcript/Vision evidence, and narration; do not call `runPipeline1MultimodalAnalysis()` again;
  - if voice/reference/speed also match and the pass-1 checkpoint is valid, reuse its measured duration instead of synthesizing pass 1 again;
  - if only voice/reference/speed changed, reuse analysis but regenerate TTS pass 1;
  - if source/reasoning/prompt dependency changed, invalidate the checkpoint and perform the normal full analysis.
- Automatic resume after a full application restart is outside this narrow BUG-033 source patch because the current renderer API has no checkpoint read contract. The JSON checkpoint is still persisted for forensic/recovery evidence; cross-restart restore requires a separate explicit storage/read contract.

### F. Queue/selection behavior
- Preserve the PR #46 manual Job browsing correction.
- Preserve automatic sequential queue continuation/failure isolation from the prior multi-job revision.
- Do not add concurrent Ollama/OmniVoice GPU jobs; concurrency would reintroduce VRAM contention and is outside this task.

## Source scope allowed
- `src/renderer/js/pipelines/pipeline1-ai.js`.
- canonical `.ai/` files affected by this revision.

Existing earlier task source remains in scope for review but BUG-033 implementation must not touch it unless new evidence proves necessary:
- `src/main/p1-vision-ipc.js`
- `src/main/preload.js`
- `src/renderer/js/pipeline1-analysis.js`

## Source scope forbidden
- No P2/P3/STTN/Settings changes.
- No broad `app.js` refactor.
- No `api/server.py`/TTS-engine rewrite; reuse existing `/api/tts/generate` and `/api/ai-rewrite` contracts.
- No video tempo manipulation.
- No voice truncation/cutting.
- No synthetic per-sentence TTS clips for P1 narration.
- No unlimited reasoning/TTS retries.
- No true parallel heavy GPU P1 processing.
- No claim that character count itself proves final duration.

## Acceptance criteria
1. A 15–30s video produces one continuous narration script artifact before TTS.
2. Global reasoning log exposes source duration, selected voice/speed, target narration char range and bounded timeout; no private payload dump.
3. TTS generation performs one `/api/tts/generate` request per pass, not N per script segment.
4. Audio speech is continuous; any subtitle chunking happens after synthesis only.
5. Final successful audio ratio is 95–100% inclusive and is based on measured prepared audio.
6. A large miss such as 601 chars / 35.27s for a 97.57s source must not use narration-only expansion; the correction receives full transcript + stored visual evidence and measured target.
7. Evidence-backed candidate is inside its measured target range and passes deterministic narration quality before final TTS.
8. A close miss requiring ≤5% tempo adjustment can pass without another narration rewrite if re-measured audio reaches 95–100%.
9. At most two full-text TTS syntheses are allowed.
10. If pass 2 plus allowed small tempo correction still misses, Job fails closed and P2 remains locked.
11. Retrying a late duration-control failure in the same app session reuses valid ASR/Vision/reasoning artifacts and does not rerun `runPipeline1MultimodalAnalysis()`.
12. If the checkpoint voice signature matches, retry also reuses pass-1 measured duration; if voice changes, only TTS+ is invalidated.
13. Automatic queue continuation remains functional: a failed Job does not prevent the next queued Job from running.
14. Manual Job-detail browsing remains functional during processing.

## Verification required
- Exact `node --check src/renderer/js/pipelines/pipeline1-ai.js` on the source commit and final docs/head.
- Deterministic helper tests for 95/100 boundaries, ±5% tempo-correction threshold, measured budget math, evidence-backed result length validation, quality rejection, resume-signature invalidation, and two-TTS maximum.
- Source review proves no P1 `/api/tts-retry` path reappears.
- Source review proves evidence-backed large correction receives persisted transcript + Vision evidence.
- Source review proves late retry bypasses full multimodal analysis only when checkpoint dependencies match.
- Exact changed-file diff hygiene.
- Fresh Owner runtime on the 97.57s case plus a queued second Job.

## Gates
BUG-033 implementation is permitted only from the exact approved remote design ref. Automated/static review, PM code review, fresh Owner runtime, docs synchronization and explicit PM merge approval remain mandatory. Merge and Step 3 stay BLOCKED until all gates pass.
