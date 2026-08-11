# PIPELINE1-FINAL-RUNTIME-GUARDS-005

## Goal
Close the final Owner-reported Pipeline 1 runtime blockers before merge: preserve manual Job-detail selection while another Job is processing, and guarantee generated narration does not exceed source-video duration and is not more than 5% shorter than the source duration.

## Exact basis
- Parent review branch: `review/PIPELINE1-ADAPTIVE-VISION-004`.
- Starting SHA: `0f668866dba2a38053080627872229e9ed85addd`.
- Review branch: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- Parent Draft PR: #45.

## Owner runtime evidence
- Owner reports all Jobs completed successfully on adaptive Vision build.
- Owner can no longer click/browse another Job while one Job is processing because processing synchronization keeps forcing the running Job back into the detail selection.
- Owner reports generated remix narration can be longer than the source video after TTS synthesis.
- Required final narration window: narration must never exceed source-video duration and may be shorter by at most 5%; accepted ratio is `0.95 <= narration_duration / video_duration <= 1.00`.

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js` — narrow selection synchronization correction only.
- `src/renderer/js/pipelines/pipeline1-ai.js` — narration-duration measurement, one bounded script-fit repair, artifact synchronization, and hard final duration gate.
- `api/server.py` — narrow correction so `/api/tts-retry` reports the actual exported audio-track duration used by the gate; no TTS model/voice-generation architecture change.
- canonical `.ai/` state/task/handoff/QA/bugs/architecture docs affected by this correction.

## Scope forbidden
- No P2/P3/STTN/Settings changes.
- No broad `app.js` refactor.
- No TTS engine/model architecture change.
- No video tempo stretching to hide an overlong script.
- No truncating/cutting generated speech.
- No unlimited AI/TTS retry loop.
- No dependency churn.

## Required behavior — Job browsing
1. Processing state may identify/highlight the running Job, but must not continuously overwrite `pipeline1SelectedJobId` when the user has selected another valid Job.
2. If no valid Job is selected, the current processing Job may be selected automatically.
3. User can click any other Job during active processing and inspect its detail without stopping or changing the processing Job.
4. Queue execution/failure isolation/retry behavior remains unchanged.

## Required behavior — narration duration
1. Use real source-video duration from the current Job metadata/artifacts; do not infer duration from SRT text alone.
2. `/api/tts-retry` must report the actual exported TTS audio-track duration, not merely the last subtitle display timestamp. If useful for diagnostics it may also return the speech/subtitle end separately.
3. Accepted final exported narration-track duration is `[95%, 100%]` of source-video duration.
4. If first TTS output is outside the accepted window, perform exactly one bounded script-fit repair using the configured reasoning provider/model and the existing SRT rewrite route.
5. Repair direction is explicit:
   - overlong narration => shorten wording proportionally while preserving meaning;
   - too-short narration => expand minimally without inventing unsupported claims.
6. Preserve SRT segment count/timestamps and update the canonical P1 remix artifacts when repaired text replaces the original script.
7. Regenerate TTS exactly once from the repaired script.
8. If the second TTS output is still outside `[95%,100%]`, Pipeline 1 must FAIL CLOSED with a readable duration diagnostic; it must not mark `p1ArtifactsReady=true` and must not unlock P2.
9. Never solve this by slowing/speeding the video, cutting voice audio, or silently accepting an out-of-window narration.
10. Log source duration, first TTS duration, repair target ratio, second TTS duration, and final PASS/FAIL without dumping private payloads.

## Verification required
- `node --check src/renderer/js/pipeline1-run-ux.js`
- `node --check src/renderer/js/pipelines/pipeline1-ai.js`
- `python -m py_compile api/server.py`
- deterministic helper tests for duration ratios: 94%, 95%, 100%, 101%, and repair-ratio calculation.
- source review proves at most one repair/re-TTS cycle.
- source review proves repaired `remix_script.srt` and `remix_script.json` stay synchronized before P1 success.
- source review proves manual Job selection is no longer overwritten when the selected Job still exists.
- source review proves duration gate consumes actual exported audio duration from `/api/tts-retry`.
- `git diff --check` or exact changed-file equivalent.

## Owner runtime acceptance
1. Start two Jobs; while Job A is processing, click Job B. Detail panel must stay on B until Owner selects another Job; Job A continues processing normally.
2. Run a case that previously produced overlong narration.
3. Log must show source duration and measured exported TTS duration.
4. If first pass is outside range, exactly one automatic script-fit repair occurs, then exactly one TTS regeneration.
5. Final successful Job must report exported narration ratio between 95% and 100% inclusive.
6. If the repair cannot reach range, Job must be `Lỗi`, popup must show exact duration mismatch, and P2 remains locked.
7. Existing adaptive Vision, multi-job continuation, retry popup, file-path compatibility, spinner behavior, OmniVoice release and artifact gates must remain working.

## Merge
BLOCKED until static verification, PM source review, fresh Owner runtime PASS, canonical documentation synchronization and explicit PM merge approval.
