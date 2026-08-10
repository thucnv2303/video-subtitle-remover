# Current State

## Status
WAITING_OWNER_RETEST — BUG-005 MULTIMODAL REVISION

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Canonical base for this task
`dd520054b385ae18b8154b7c897eb9baad7eac02`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
- BUG-008 premature P1→P2 handoff: RESOLVED / Owner PASS.

## Active task
- Task: `BUG-005 — Pipeline 1 Full Processing Chain`.
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.

## Owner runtime FAIL that invalidated the previous candidate
- ASR returned one incorrect SRT segment for the tested video.
- Text-only AI rewrite and TTS returned transport success, but this did not satisfy the canonical original-video analysis contract.
- Backend generated an MP3 but approved Job Detail still showed no audio because legacy `activeJobId` and P1 `pipeline1SelectedJobId` could diverge.
- P1 incorrectly unlocked P2 despite incomplete/incorrect analysis.

## Revised multimodal candidate
The current revision replaces text-only acceptance with a fail-closed artifact pipeline:
1. Start snapshots the approved provider/model/prompt/voice and forces ASR language `auto`.
2. Existing dedicated P1 ASR produces timestamped source SRT.
3. Renderer samples keyframes across the ORIGINAL video using existing video-info/frame APIs.
4. Main-process Ollama IPC inspects local model capabilities. If the selected reasoning model supports vision it receives transcript + keyframes directly; otherwise the app searches installed local Ollama models for a vision-capable model and uses its visual analysis as context for the selected reasoning model.
5. If no local vision-capable model exists, P1 fails explicitly; text-only fallback is not allowed to unlock P2.
6. AI must return structured summary/insights/scenes/script_segments/edit_plan JSON. The system output protocol overrides any prompt-preset formatting instruction such as “return only SRT”; prompt presets still guide content/style.
7. Renderer builds and writes `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`, and `remix_script.srt` under `jobs/<job_id>/p1/`, including source SHA256 fingerprint, duration/FPS/frame count, artifact version, reasoning model and vision model metadata.
8. TTS runs from the remix SRT. Generated temp audio is copied into the P1 artifact directory as `voice.*`; `tts_timed.srt` is also written there.
9. The running P1 Job becomes the authoritative `pipeline1SelectedJobId`/`activeJobId`, so detail text/audio/status bind to the same Job.
10. `p1ArtifactsReady` becomes required for the multimodal candidate. A separate artifact guard relocks P2 and marks P1 error if the legacy runner reports finished without required artifacts.

## Preserved boundaries
- Approved P1 UI source is unchanged.
- P2/P3 product source is unchanged.
- P1 does not remove subtitles, inpaint, cut, mix final video or render.
- Existing P1→P2 state gate remains in place.

## Verification and review
- Exact published equivalents for `main.js`, `preload.js`, `p1-vision-ipc.js`, `pipeline1-run-config.js`, `pipeline1-artifact-gate.js`, `pipeline1-analysis.js`, `pipeline1-ai.js`: `node --check` PASS and local Git blob hash match.
- P1 run-config ASR-auto/multimodal simulation: PASS.
- Selected-model vision simulation: PASS.
- Separate local vision-model fallback simulation: PASS.
- No-vision-model fail-closed simulation: PASS.
- TTS temp-audio → P1 artifact copy simulation: PASS.
- Legacy false-complete → P2 relock simulation: PASS.
- GitHub code review on revised source: PASS for fresh Owner retest.
- GitHub CI: not configured.

## Known limitation of this revision
- Multimodal P1 runtime is currently authorized only for local Ollama. Gemini/DeepSeek remain available in Settings but P1 Start blocks them rather than silently degrading to text-only analysis.
- Scene understanding is based on sampled keyframes + vision reasoning in this revision; a deterministic CV scene-boundary detector remains a later refinement and is not claimed as complete.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for fresh Owner retest.
- Owner manual app verification: previous candidate FAIL; fresh multimodal retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED pending fresh Owner PASS and explicit merge approval.
