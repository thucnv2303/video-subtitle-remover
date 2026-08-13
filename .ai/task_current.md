# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
PERIOD_ONLY_OUTER_CHUNK_IMPROVED_OMNIVOICE_LONG_FORM_DIAGNOSIS

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- PM direct-edit only.
- Pinned OmniVoice submodule: `k2-fsa/OmniVoice@468e927ba3716cd8dd86421148dfb3046e9f9d7b`.

## Verified Owner result
- period-only outer chunking substantially improved the result;
- residual spoken stutter still occurs in some sections, so Owner runtime is FAIL;
- supplied retest WAV: 303.42s, 24 kHz mono PCM16, peak about 0.92;
- exact PCM repeat scan did not find non-silent copy-pasted duplicate segments at the tested window resolution.

## Current VSR source state
Latest application-source correction remains `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- outer chunk boundaries occur only after terminating `.`;
- 300/450/600 are soft targets and do not cut inside a sentence;
- each completed renderer chunk is appended once;
- FFmpeg concat consumes the chunk list once;
- current evidence does not indicate duplicate outer concat as the stutter source.

## Verified pinned OmniVoice behavior
At submodule commit `468e927ba3716cd8dd86421148dfb3046e9f9d7b`:
- default `audio_chunk_threshold` is 30.0 seconds;
- default `audio_chunk_duration` is 15.0 seconds;
- requests estimated above threshold route to `_generate_chunked()`;
- `_generate_chunked()` uses `chunk_text_punctuation()`;
- the internal punctuation splitter can split at `. , ; : ! ?` and CJK equivalents;
- internal chunks are recombined with `cross_fade_chunks()`, whose default silence gap is 0.3 seconds.

## Controlled comparison
Using the exact Owner narration and VSR period-only packing:
- target 450 -> 13 outer chunks; 12/13 are approximately 33-43 seconds at a 145-wpm comparison estimate;
- target 300 -> 21 outer chunks; approximately 14-28 seconds at the same comparison estimate;
- therefore target 300 is expected to reduce the likelihood that OmniVoice activates its own >30s long-form splitter, but Owner runtime is required before any source change.

## Next diagnostic
Do not change source yet:
1. Keep the same application source and Adam clone.
2. Use the exact same narration script.
3. Render at chunk target 300 instead of 450.
4. Compare spoken stutter count/severity against the 450 render.
5. Confirm every VSR outer transition still occurs only after `.`.
6. Confirm final merge/playback succeeds.

If 300 materially reduces/removes stutter, PM may publish a dedicated minimal correction making 300 the clone-safe default. If stutter remains comparable, inspect OmniVoice generation/internal chunk behavior further before changing VSR merge logic.

## Required static verification
On final PR #50 HEAD after the final source state is selected:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-quality-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS for current published period-only source.
- Automated/static: WAITING.
- Code review: WAITING for final source state.
- Owner runtime: FAIL — residual stutter on 450 result.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match this diagnosis.
- Merge permission: BLOCKED.
