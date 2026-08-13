# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_CORE_RUNTIME_PASS_LEADING_WORD_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render mounts.
- voice preview works.
- `Render toàn bộ` works.
- 3/3 sequential chunks complete.
- final WAV merge succeeds and plays.

Latest runtime FAIL:
- some generated audio intermittently loses roughly the first 2–5 supplied words.

## Investigation
Renderer `splitLongText()` starts from source character 0, so no intentional prefix removal exists in the Voice Render queue.

OmniVoice generation supports `postprocess_output`, `pad_duration`, `fade_duration`, `audio_chunk_duration` and `audio_chunk_threshold`. The precise stage causing the observed missing words is not yet proven by Owner evidence, therefore the correction is an onset-preservation guard rather than a claimed proven root cause.

## Published onset guard
Narrow Owner-authorized scope expansion: `api/tts_engine.py`.

`generate_speech()` now:
- `postprocess_output=False`;
- `pad_duration=0.25`;
- `fade_duration=0.02`;
- `audio_chunk_duration=12.0`;
- `audio_chunk_threshold=18.0`.

Goal: retain the generated beginning and reduce very long model-internal synthesis spans without modifying the supplied text.

## Distinct voice-profile correction retained
- built-in voices have distinct `prosody + speedFactor` profiles;
- legacy clones are migrated to complete profiles;
- clone UI requires `Ngữ điệu` + `Tốc độ riêng`;
- duplicate name/profile is rejected;
- selected speed changes real generated audio before merge;
- Settings routes clone creation to Voice Render.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Fully close VSR/Electron and launch exact final PR #50 HEAD.
2. Use a short Vietnamese sentence whose first 5–8 words are unmistakable.
3. Render it at least 3 times using OmniVoice/default; every output must contain the complete beginning.
4. Repeat at least 2 times using one clone voice; every output must contain the complete beginning.
5. Render one medium text with a slow profile and one faster profile; real duration must still differ in the expected direction.
6. Reconfirm final merge/playback and no P1/P2/P3 state mutation.

## Gates
- Execution: PASS — onset guard published.
- Automated/static: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; onset retention/profile behavior RETEST WAITING.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match.
- Merge permission: BLOCKED until retest + static + review PASS.
