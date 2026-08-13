# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
OWNER CORE RUNTIME PASS / LEADING-WORD TTS CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.
- No Anti/external executor.

## Verified real-app evidence
Owner verified:
- Voice Render mounts and navigation works.
- voice preview works.
- `Render toàn bộ` works.
- 3 sequential long-text chunks complete.
- final WAV merge succeeds and the result plays.

Latest runtime defect:
- generated audio can intermittently omit approximately the first 2–5 supplied words.

## Investigation and correction
Renderer text splitting begins at character 0; no intentional prefix removal is present there. The exact internal OmniVoice stage causing the loss is not proven yet.

Owner authorized one small correction before closing this task. `api/tts_engine.py` now uses an onset-preservation configuration:
- `postprocess_output=False`;
- `pad_duration=0.25`;
- `fade_duration=0.02`;
- `audio_chunk_duration=12.0`;
- `audio_chunk_threshold=18.0`.

The intent is to preserve the beginning of generated speech and use shorter internal long-form spans without rewriting or deleting input text.

## Distinct voice profile behavior retained
- every built-in/shared clone voice carries prosody + speed profile data;
- selected speed changes real audio before merge;
- clone creation is centralized in Voice Render;
- legacy clones are migrated to complete profiles;
- per-voice duration calibration remains isolated by voice/language.

## Boundary
This small correction touches the shared OmniVoice wrapper, so both Voice Render and later main-flow OmniVoice generation inherit the onset guard. No P1 reasoning, P2 inpaint or P3 composition logic is changed here.

## Retest sequence
1. Fetch exact final PR #50 HEAD and fully restart app.
2. Render a short sentence with unmistakable first 5–8 words at least 3 times using OmniVoice/default.
3. Repeat at least 2 times using one clone voice.
4. Every generated output must preserve the full beginning.
5. Recheck a slower and faster voice profile still produce real duration differences in the expected direction.
6. Reconfirm merge/playback and no P1/P2/P3 state mutation.

## Static verification
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS — onset guard published.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; onset retention/profile behavior RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
