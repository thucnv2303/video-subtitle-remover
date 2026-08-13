# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
PERIOD_ONLY_CHUNK_IMPROVED_RESIDUAL_STUTTER_DIAGNOSIS

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- PM direct-edit only.

## Verified Owner result
- Owner tested exact HEAD `5241007de1f541132784d6a81c093858e3f138b6`.
- period-only chunk behavior produced a substantially improved / generally stable render.
- residual spoken stutter still occurs in some sections; Owner verification is FAIL, not PASS.
- supplied retest WAV: 303.42s, 24 kHz mono PCM16, peak about 0.92.
- exact PCM repeat scan did not find non-silent duplicated audio segments at the tested repeat-window resolution.

## Current source state
Latest application-source correction remains `f5a7659a4469cde2d70be10f7a1a8d12f8a4c9b6`.
- outer chunk boundaries occur only after terminating `.`.
- 300/450/600 are soft targets and do not cut inside a sentence.
- each completed renderer chunk is appended once.
- FFmpeg concat consumes the chunk list once; current evidence does not indicate duplicate concat as the source of stutter.
- prior native OmniVoice speed/headroom correction remains in place.
- transcript/ref_text conditioning remains removed.

## Next diagnostic
Controlled A/B comparison only; do not change source yet:
1. Keep the same exact application source and same Adam clone.
2. Use the exact same narration script.
3. Render at chunk target 300 instead of 450.
4. Compare the number/severity of spoken stutters against the 450 render.
5. Confirm period-only boundaries remain correct and final merge/playback still succeeds.

If 300 materially reduces/removes stutter, PM may publish a dedicated minimal correction making 300 the clone-safe default. If stutter remains comparable, investigate OmniVoice generation parameters/internal long-form behavior before changing outer merge logic.

## Required static verification
On final PR #50 HEAD after the task's final source state is selected:
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
- Owner runtime: FAIL — residual stutter.
- Documentation synchronization: IN PROGRESS until handoff/PR match final docs head.
- Merge permission: BLOCKED.
