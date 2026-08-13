# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — PERIOD-ONLY OUTER CHUNK IMPROVED / OMNIVOICE INTERNAL LONG-FORM DIAGNOSIS

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.
- Pinned OmniVoice submodule: `k2-fsa/OmniVoice@468e927ba3716cd8dd86421148dfb3046e9f9d7b`.

## Verified Owner runtime evidence
- Owner tested application source containing period-only outer splitting and reports the result is substantially improved / generally stable.
- residual spoken stutter remains in some locations, therefore Owner runtime remains FAIL.
- supplied retest WAV is 303.42s, 24 kHz mono PCM16, peak about 0.92.
- exact PCM repeat scan did not find non-silent copy-pasted duplicate audio at the tested window resolution.

## Verified VSR source findings
Latest application-source correction remains `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- VSR outer chunk boundaries occur only after terminating `.`.
- 300/450/600 are soft packing targets and never authorize a mid-sentence outer cut.
- each successful renderer chunk is appended once.
- FFmpeg concat consumes the chunk list once; current evidence does not support duplicate outer concat as the residual-stutter cause.

## Verified pinned OmniVoice long-form behavior
At pinned submodule commit `468e927ba3716cd8dd86421148dfb3046e9f9d7b`:
- `OmniVoiceGenerationConfig.audio_chunk_threshold` defaults to 30.0 seconds.
- `audio_chunk_duration` defaults to 15.0 seconds.
- requests estimated above the threshold are automatically routed through `_generate_chunked()`.
- `_generate_chunked()` uses `chunk_text_punctuation()` for its internal text chunks.
- that internal splitter recognizes `. , ; : ! ?` (and CJK equivalents) as split punctuation, so VSR's outer period-only invariant can be undermined inside OmniVoice when long-form activates.
- OmniVoice then decodes those internal chunks and combines them through `cross_fade_chunks()`, whose default silence gap is 0.3 seconds.

## Controlled-size analysis of Owner script
Using VSR period-only packing and the exact supplied narration:
- target 450 produces 13 outer chunks; 12/13 contain roughly 79-104 words and are approximately 33-43 seconds at a 145-wpm narration estimate, making internal >30s long-form activation plausible for most chunks.
- target 300 produces 21 outer chunks; estimated durations are roughly 14-28 seconds at the same comparison rate, keeping every outer chunk below the upstream 30s threshold by this approximation.
- this is diagnostic evidence, not a substitute for Owner runtime because OmniVoice uses its own duration estimator and Adam reference conditioning.

## Working diagnosis
Residual stutter is most plausibly associated with OmniVoice internal long-form segmentation being activated inside some 450-target VSR chunks. The next controlled runtime comparison remains target 300 on the same source, voice and script.

## Next permitted action
Owner rerenders the same supplied script with Adam at target 300 while keeping the same application source. Compare stutter count/severity against 450, confirm all VSR outer transitions still occur only after `.`, and confirm final merge/playback succeeds. Do not publish another application-source correction until this A/B evidence is available.

## Gates
- Execution: PASS for current period-only application source.
- Automated/static verification: WAITING.
- Code review: WAITING for final source state.
- Owner runtime: FAIL — residual stutter remains on 450 result.
- Documentation synchronization: IN PROGRESS until task/handoff/PR metadata match this diagnosis.
- Merge permission: BLOCKED.
