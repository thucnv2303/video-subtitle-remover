# PIPELINE1-CONTINUOUS-NARRATION-006

## Goal
Keep Pipeline 1 focused on grounded analysis, one coherent narration and natural TTS. Do not force P1 voice to occupy 95–100% of the ORIGINAL video timeline. Final voice/video duration alignment belongs to Pipeline 3 after the final usable video timeline is known.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- BUG-034 approval basis before source revision: `04883a6c34df5a22bf68e54521aa8e1eb95e9a72`.
- Prior BUG-033 source: `77f5e2186ddb4660c9ba35de245bc8b86d297f33` + `da3644f3e81ac3a3927d64baca9365745541f4ec`.

## Owner runtime evidence — BUG-034
Latest 97.57s run:
- Adaptive Vision succeeds with 25 keyframes / 4 chunks.
- Global reasoning completes in 38.8s and returns a quality-clean 613-character narration.
- Full-text TTS pass 1 is 35.91s = 36.8% of source duration.
- The BUG-033 controller then calculates 1582–1666 target chars and launches a second qwen3-coder:30b evidence-fit.
- That second reasoning request consumes the full 150s timeout and fails before TTS pass 2.
- The valid narration/TTS therefore becomes a failed Job only because P1 tries to make speech occupy nearly the whole ORIGINAL timeline.

## Superseded policy
The following BUG-033 rules are superseded and must no longer control P1 completion:
- hard minimum `voice_duration/source_duration >= 0.95`;
- target 0.975 as a blocking P1 audio target;
- second evidence-backed narration recomposition solely to hit duration;
- second full TTS solely to repair duration;
- P1 audio tempo correction solely to make voice reach the original video duration.

The existing evidence-fit IPC may remain temporarily for compatibility, but the normal P1 flow must not call it for duration matching.

## BUG-034 approved responsibility split
### Pipeline 1 — analysis/script/voice authority
P1 must:
- analyze the ORIGINAL video with ASR + adaptive Vision;
- generate one coherent grounded `narration_script`;
- run deterministic narration quality checks;
- synthesize one continuous full-text TTS artifact;
- measure and persist exact TTS duration telemetry;
- generate subtitle timing against the actual P1 voice;
- preserve source identity and edit-plan artifacts;
- unlock P2 when required P1 artifacts and quality checks pass.

P1 duration policy:
- underlength is NOT a failure by itself;
- narration may intentionally leave visual/music/silent coverage in the source timeline;
- character budget remains generation guidance/telemetry only, not a hard occupancy contract;
- no second LLM call is allowed solely to fill unused timeline;
- no second TTS call is allowed solely to repair occupancy;
- keep only a coarse pathological overlength guard: `voice_duration/source_duration > 1.50` fails P1 with an explicit diagnostic;
- ratios `<= 1.50` are persisted as telemetry; ratios outside 90–110% should be logged as warnings, not failures, unless the pathological overlength guard is exceeded.

The `1.50` P1 ceiling is a coarse safety guard, not a quality target. It exists to reject obviously unusable output while leaving final alignment to P3.

### Pipeline 2 — unchanged
P2 only removes burned-in subtitles and creates timeline-compatible clean video. P2 must not alter narration or final playback speed.

### Pipeline 3 — final timeline and voice-fit authority
P3 must preserve clean-video pacing by default. It must not change video speed merely to make TTS fit.

After P3 knows the video used for final mixing:
1. Probe the actual video duration.
2. Compare P1 voice duration against that video duration.
3. If voice ratio is `< 0.90`, keep P1 voice at natural speed and allow the remaining timeline to carry background/music/silence.
4. If voice ratio is `0.90–1.00`, P3 may apply a modest pitch-preserving slowdown to target the video duration.
5. If voice ratio is `>1.00–1.15`, P3 may apply a modest pitch-preserving speed-up to target the video duration.
6. If voice ratio is `>1.15`, do not silently distort speech. Fail/warn explicitly that narration/edit-plan/timeline needs revision.
7. Any P3-adjusted voice is a NEW derived P3 artifact. Never overwrite P1 `voice.wav`.
8. If voice tempo changes, regenerate/rescale subtitle timing to the adjusted voice before burn-in.

Initial automatic P3 voice-tempo range is therefore `0.90–1.15x`. This is an intentionally conservative product QA range and must receive Owner listening validation before merge; it is not claimed as a universal audio-quality standard.

## Derived artifact contract
When P3 changes voice tempo:
- derived audio directory: `jobs/<job_id>/p3/`;
- derived audio: `jobs/<job_id>/p3/voice.wav`;
- derived subtitle timing: `jobs/<job_id>/p3/tts_timed.srt`;
- runtime fields may include `p3VoiceAudioPath`, `p3VoiceDurMs`, `p3VoiceTempo`, `p3TimedSrt`;
- P1 `voice.wav` and P1 `tts_timed.srt` remain immutable inputs.

When no P3 voice adjustment is needed, P3 may use P1 voice/SRT directly without duplicating them.

## P1 retry/resume contract
The BUG-033 checkpoint concept remains useful but changes purpose:
- retry after a late TTS/persistence failure should reuse valid ASR/Vision/global reasoning when source/model/prompt signatures match;
- if a valid pass-1 TTS artifact and matching voice signature already exist, the same-session retry may reuse it;
- checkpoint stage should represent TTS finalization/retry, not a mandatory duration-control loop;
- automatic cross-app-restart rehydration remains out of scope until an explicit checkpoint read contract exists.

## Source scope allowed for BUG-034
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- canonical `.ai/` files affected by the responsibility change

Existing `src/main/p1-vision-ipc.js` evidence-fit code may remain unused; changing/removing it is not required for the narrow BUG-034 runtime correction.

## Source scope forbidden
- No P2/STTN changes.
- No broad `app.js` refactor.
- No backend TTS-engine rewrite.
- No new dependency such as Rubber Band in this patch.
- No video-speed manipulation for voice matching.
- No voice truncation/cutting.
- No additional Ollama duration-repair retry.
- No increase of the 150s evidence-fit timeout.
- No simultaneous heavy GPU inference.

## Acceptance criteria
1. The 97.57s scenario may complete P1 with a coherent 35.91s voice if quality/artifact gates pass; it must not launch `Narration evidence-fit` merely because occupancy is 36.8%.
2. P1 uses exactly one full-text TTS request in the normal successful path.
3. P1 logs source duration, voice duration, ratio and a warning when materially mismatched.
4. P1 fails on pathological overlength only when measured voice ratio exceeds 1.50.
5. P1 underlength alone never blocks P2 handoff.
6. Retry after a late TTS/finalization failure can reuse valid multimodal analysis in the same session when signatures match.
7. P3 no longer calls `adjustVideoTempo()` for voice matching.
8. P3 probes the actual video used for mixing and decides voice fit from that duration.
9. P3 leaves voice unchanged when ratio <0.90.
10. P3 may derive a new voice for ratio 0.90–1.15 using pitch-preserving tempo correction, then re-measures it.
11. P3 refuses automatic voice stretch when ratio >1.15.
12. P3 adjusted audio is written under `jobs/<job_id>/p3/voice.wav`, never over P1 `voice.wav`.
13. P3 subtitle timing is rescaled/regenerated and persisted under `jobs/<job_id>/p3/tts_timed.srt` whenever voice tempo changes.
14. P2 clean video pacing is preserved by default.
15. Existing queue isolation and manual Job browsing behavior remain unchanged.

## Verification required
- `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- `node --check src/renderer/js/pipelines/pipeline3-finalize.js`.
- `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- Source review proves normal P1 flow no longer calls `fitP1Narration`/evidence-fit for occupancy.
- Source review proves P3 no longer calls `adjustVideoTempo` for voice matching.
- Owner reruns the 97.57s case: P1 completes after the first valid continuous TTS without the 150s duration-recompose timeout.
- Owner P3 listening tests cover representative ratios around 0.90, 1.00, 1.10 and 1.15 before the automatic tempo range is considered release PASS.
- Owner verifies an extreme short voice remains natural and does not get stretched to fill the full timeline.
- Owner verifies >1.15 overlength is explicitly blocked/warned in P3 rather than silently distorted.

## Gates
BUG-034 source implementation is permitted from the exact approved remote spec ref. Automated/static verification, PM code review, fresh Owner P1 runtime, P3 listening verification, documentation synchronization and explicit PM merge approval remain mandatory. Merge stays BLOCKED until all required gates pass.