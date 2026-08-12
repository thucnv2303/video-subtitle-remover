# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — BUG-034 DURATION POLICY REDESIGN REQUIRED / CURRENT SOURCE NEEDS_REVISION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Repository head before this failure-intake update: `8e61d0f6b2c9a96fd876e5e5cda6371f5163dc08`.
- BUG-033 source: `77f5e2186ddb4660c9ba35de245bc8b86d297f33` + `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- Prior PM review `4912637906` remains evidence of logic/scope review for that implementation, but the fresh Owner runtime invalidates its release direction.

## Fresh Owner runtime — BUG-034
The latest 97.57s run reaches the BUG-033 evidence-fit path but still fails:
- Adaptive Vision succeeds: 25 keyframes / 4 chunks / 8,8,8,1 frames.
- Global reasoning completes in 38.8s and produces a quality-clean 613-character narration against soft target 1529–1610.
- Full-text TTS pass 1 produces 35.91s = 36.8% of the 97.57s source.
- Measured rate is 17.07 chars/s and the controller asks for 1582–1666 chars.
- Evidence-backed recomposition then blocks for the full 150s timeout and fails before TTS pass 2.
- End-to-end from Vision start to failure is about 5m21s, with the final 150s spent on a second large reasoning request after a valid narration and TTS already existed.
- The supplied log does not include `git rev-parse HEAD`, so the exact tested final SHA is still unverified. The `Narration evidence-fit` log proves the runtime includes the BUG-033 source lineage, but not the exact docs head.

## Verified architecture conflict
1. P1 currently treats `0.95 <= voice_duration/source_duration <= 1.00` as a blocking success gate and may launch a second large LLM recomposition to satisfy it.
2. P3 already owns a duration-fit step in `pipeline3-finalize.js`, but the current implementation changes VIDEO speed to match TTS (`adjustVideoTempo`, max 1.30 / min 0.80).
3. Target architecture says P3 owns final cut/mix/render and may apply the approved edit plan; therefore forcing P1 narration to match ORIGINAL source duration before P3 establishes the final timeline is premature and duplicates duration authority.
4. A 35.91s voice cannot reasonably be stretched to approximately 95s by audio tempo alone without severe speech degradation; its target factor would be roughly 0.38x. Large underlength must therefore be allowed as natural silence/background coverage or solved by better script generation, not by a mandatory exact-duration gate.
5. Moderate overlength is different: P3 can safely own a bounded voice-speed correction after final video duration is known, provided the adjusted audio is written as a P3-derived artifact and subtitle timings are rescaled. P3 must not overwrite P1 `voice.wav`.

## PM design direction under evaluation
Recommended new responsibility split:
- P1 = evidence-grounded script + natural TTS + timing provenance. Quality is blocking; exact match to source-video duration is not.
- Remove the 95% hard MINIMUM as a P1 completion gate. A short but coherent narration may complete P1 with duration telemetry/warning.
- Keep protection against pathological overlength, but do not choose the final automatic speed cap until Owner listening tests establish acceptable voice quality.
- Remove the blocking second evidence-fit/recompose from the normal P1 duration path. Script generation should improve evidence coverage in the first global reasoning pass rather than rely on a second 30B request after TTS.
- P3 = final timeline authority. After P3 knows the actual final video duration, it may create a NEW derived voice artifact with bounded pitch-preserving tempo correction when needed, then rescale/regenerate subtitle timing against that adjusted audio.
- P3 should preserve video pacing by default instead of changing clean-video speed merely to match narration.
- For voice shorter than final video, default behavior should preserve natural voice speed and allow remaining video to carry background/music/silence; only a small optional slowdown should be considered after listening validation.

## Source evidence supporting the redesign
- `src/renderer/js/pipelines/pipeline3-finalize.js` currently performs Step 1 by changing video speed to TTS duration before mixing.
- `src/renderer/js/api.js` exposes `/api/adjust-video-tempo` with max speed 1.30 and min speed 0.80.
- Backend `/api/adjust-video-tempo` explicitly slows video when TTS is longer and speeds video when TTS is shorter.
- Current architecture assigns final cut/mix/render responsibility to P3 and requires P2 clean video to remain timeline-compatible.

## Gates
- Execution: NEEDS_REVISION — do not extend the current exact-duration controller further.
- Automated/static verification: WAITING for a newly approved source revision.
- Code review: prior BUG-033 logic/scope review superseded by Owner runtime failure; new revision WAITING.
- Owner manual app verification: FAIL for current duration policy/runtime.
- Documentation synchronization: PASS after BUG-034 failure intake is complete.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED for release, although P3 source may be inspected for redesign.

## Next permitted action
Finalize a revised P1/P3 duration contract before implementation. Define: (1) non-blocking P1 underlength behavior, (2) pathological P1 overlength ceiling, (3) P3 voice-tempo quality limits, (4) subtitle-timing rescale contract, and (5) P3-derived audio artifact path. Then make a narrow source revision; do not add another P1 reasoning retry or simply increase the 150s timeout.