# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
PERIOD-ONLY OUTER CHUNK IMPROVED / OMNIVOICE LONG-FORM DIAGNOSIS / MERGE BLOCKED

## Authority
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.
- Pinned OmniVoice submodule: `k2-fsa/OmniVoice@468e927ba3716cd8dd86421148dfb3046e9f9d7b`.

## Verified Owner result
- period-only outer splitting substantially improved the generated narration;
- residual spoken stutter remains in some locations, therefore Owner runtime is FAIL;
- supplied retest WAV is 303.42s, 24 kHz mono PCM16, peak about 0.92;
- exact PCM repeat analysis did not find non-silent copied duplicate segments at the tested repeat-window resolution.

## Verified VSR source evidence
Current application source correction: `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- outer splitter uses terminating `.` only;
- 300/450/600 are soft targets and never permit a mid-sentence outer cut;
- successful chunks are appended once;
- FFmpeg concat builds one manifest from the supplied chunk list and does not intentionally repeat a chunk.

## Verified pinned OmniVoice evidence
At `468e927ba3716cd8dd86421148dfb3046e9f9d7b`:
- long-form activates above default estimated `audio_chunk_threshold=30.0` seconds;
- default internal `audio_chunk_duration=15.0` seconds;
- `_generate_chunked()` uses `chunk_text_punctuation()`;
- that internal splitter permits `. , ; : ! ?` and CJK equivalents;
- decoded internal chunks are combined with `cross_fade_chunks()`, defaulting to a 0.3-second silence gap.

## Controlled script analysis
Using the Owner-supplied narration with VSR period-only packing:
- 450 target -> 13 outer chunks, most roughly 33-43 seconds by a 145-wpm comparison estimate;
- 300 target -> 21 outer chunks, roughly 14-28 seconds by the same estimate.
This supports target 300 as the next controlled diagnostic because it is more likely to stay below OmniVoice's internal >30s long-form threshold. It is not runtime proof because OmniVoice uses its own duration estimator and reference conditioning.

## Next permitted action
1. Keep the same application source and Adam clone.
2. Use the exact same Vietnamese narration.
3. Render target 300 instead of 450.
4. Compare residual stutter count/severity against the 450 render.
5. Confirm VSR outer transitions still occur only after `.`.
6. Confirm final merge/playback succeeds.

If 300 materially improves the result, consider a minimal source correction making 300 the clone-safe default. If not, continue investigation inside OmniVoice generation before changing outer concat.

## Static verification
After final source state is selected:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-quality-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS for current period-only source.
- Automated/static verification: WAITING.
- Code review: WAITING for final source state.
- Owner runtime: FAIL — residual stutter remains on 450 result.
- Documentation synchronization: PASS once PR metadata points at this final docs head.
- Merge permission: BLOCKED.
