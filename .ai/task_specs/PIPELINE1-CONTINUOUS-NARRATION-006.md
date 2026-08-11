# PIPELINE1-CONTINUOUS-NARRATION-006

## Goal
Restore the good multi-job Pipeline 1 flow while replacing post-hoc segmented duration fitting with voice-aware continuous narration generation. The narration must read naturally from beginning to end, target the selected voice/speed and source-video duration before TTS, and remain within the final Owner gate without creating artificial per-segment pauses.

## Exact basis
- Parent review branch: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- Starting SHA: `68c750524f9604b7799d97a2b5604d87368f889c`.
- Parent Draft PR: #46.
- New review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.

## Owner runtime evidence — 2026-08-11
1. PR #46 Job 1 fails the new duration gate after pass 2: source video 24.30s, exported voice 48.10s, ratio 197.9%.
2. The generated narration is split into 16 TTS segments. Owner requires one coherent script read continuously from start to finish; segmentation may be used later only for subtitle display timing, not to synthesize separate speech clips.
3. The current selected voice configuration is available before global reasoning, but the global reasoning request does not receive voice/speed information.
4. Job 2 progresses through adaptive Vision, then `qwen3-coder:30b` global reasoning reaches 349s and is still generating. Current code allows 360s per global reasoning attempt, which is unacceptable runtime for this short 17.6s input.
5. Previous revision behavior of automatically continuing the queued Jobs is preferred. True simultaneous heavy GPU inference is not required; safe sequential auto-advance must remain intact.

## Verified root causes
- `FINAL_SCHEMA` requires `script_segments`; `outputContractPrompt()` asks every script segment to be short. The product therefore generates segmented narration by design.
- `pipeline1-analysis.js` normalizes reasoning output back into timed script segments before TTS.
- `pipeline1-analysis.js -> analyzeP1Vision` currently does not pass `ttsVoice` or `ttsSpeed`, so global reasoning cannot budget narration for the selected voice.
- `/api/tts-retry` pre-processes text longer than 30 words into multiple synthesized clips and later places gaps between them. This directly conflicts with the Owner's continuous-narration requirement.
- PR #46 duration repair preserves exact SRT segment count/timestamps, so it optimizes the wrong artifact shape and can remain grossly over duration.
- Global reasoning asks a 30B model to regenerate summary + insights + scenes + segmented script + edit plan under a large structured schema; Vision scenes are already available from chunk analysis, so this duplicates output and increases latency.

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
- Use existing `/api/tts/generate` once with the full narration text and selected voice/reference audio.
- Apply the selected P1 TTS speed to the generated track with pitch-preserving ffmpeg `atempo` when speed differs from 1.0.
- Probe the resulting audio file duration with ffprobe; this exact file duration is the gate authority.
- Generate subtitle-display SRT after TTS by splitting text only for display/timing. These subtitle chunks must not cause separate TTS synthesis or speech gaps.

### D. One bounded correction only
- Gate successful final audio at `0.95 <= audio_duration / video_duration <= 1.00`.
- If pass 1 is outside range, calculate a new target character budget from the measured selected-voice rate and rewrite the whole narration exactly once.
- The repair receives the current continuous narration and target character range; it must preserve meaning and cannot invent unsupported claims.
- Generate the whole narration one final time.
- If pass 2 still misses 95–100%, fail closed with a readable duration diagnostic and keep P2 locked.

### E. Queue/selection behavior
- Preserve the PR #46 manual Job browsing correction.
- Preserve automatic sequential queue continuation/failure isolation from the prior multi-job revision.
- Do not add concurrent Ollama/OmniVoice GPU jobs; concurrency would reintroduce VRAM contention and is outside this task.

## Source scope allowed
- `src/main/p1-vision-ipc.js`
- `src/main/preload.js`
- `src/renderer/js/pipeline1-analysis.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- canonical `.ai/` files affected by this revision.

## Source scope forbidden
- No P2/P3/STTN/Settings changes.
- No broad `app.js` refactor.
- No `api/server.py`/TTS-engine rewrite; reuse existing `/api/tts/generate`.
- No video tempo manipulation.
- No voice truncation/cutting.
- No synthetic per-sentence TTS clips for P1 narration.
- No unlimited reasoning/TTS retries.
- No true parallel heavy GPU P1 processing.

## Acceptance criteria
1. A 15–30s video produces one continuous narration script artifact before TTS.
2. Global reasoning log exposes source duration, selected voice/speed, target narration char range and bounded timeout; no private payload dump.
3. For the Owner's 17.6s/24.3s class inputs, global reasoning no longer runs near the old 360s timeout solely to regenerate duplicate scenes/segment arrays.
4. TTS generation performs one `/api/tts/generate` request per pass, not N per script segment.
5. Audio speech is continuous; any subtitle chunking happens after synthesis only.
6. Final successful audio ratio is 95–100% inclusive.
7. At most one whole-script fit + one re-TTS is allowed.
8. If pass 2 remains outside range, Job is error and P2 remains locked.
9. Automatic queue continuation remains functional: a failed Job does not prevent the next queued Job from running.
10. Manual Job-detail browsing from PR #46 remains functional during processing.

## Verification required
- Exact `node --check` on all changed JS source files.
- Deterministic tests for voice budget, measured-rate repair budget, 95/100 boundaries, subtitle-only segmentation and one-repair limit.
- Source review proves Pipeline 1 no longer calls `/api/tts-retry` for continuous narration.
- Source review proves exactly one full-text `/api/tts/generate` call per TTS pass.
- Source review proves no global reasoning scene duplication.
- Exact changed-file diff hygiene.
- Fresh Owner runtime on at least two queued Jobs, including the previous overlong-narration case.

## Gates
PR #46 Owner runtime: FAIL. New revision gates start WAITING. Merge and Step 3 remain BLOCKED until this task passes automated/static review, PM code review, fresh Owner runtime, docs synchronization and explicit PM merge approval.
