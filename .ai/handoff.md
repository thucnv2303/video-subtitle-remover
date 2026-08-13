# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
OWNER CORE RUNTIME PASS / DISTINCT VOICE PROFILE CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING / MERGE BLOCKED

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

Latest product correction requested before merge:
- every voice must carry explicit prosody/intonation + speed profile;
- changing voice/profile must affect real output duration, not only the estimate;
- voice creation must use one shared complete schema before returning to the main pipeline task.

## Published correction
- Built-in voices have distinct `prosody + speedFactor` profiles.
- Legacy clone records missing profile data are migrated to distinct profile pairs.
- Clone Voice adds `Ngữ điệu` and `Tốc độ riêng` controls.
- duplicate clone name or duplicate `prosody + speedFactor` pair is rejected.
- Settings `Thêm giọng clone` redirects to Voice Render so new clone records are complete and stored once in `localStorage.tts_voices`.
- `main.js` owns constrained FFmpeg `atempo` audio processing through `voice-render:applyTempo`.
- preload exposes the narrow `applyVoiceTempo()` IPC method.
- Voice Render applies the selected voice speed to preview/chunk audio before merge, so real output duration changes with speed profile.
- duration estimation remains per voice/language and learns from actual preview/final audio duration.

## Boundary
The shared voice record now carries the metadata the main workflow will need. This task does not yet modify P1/P2/P3 TTS execution to consume `speedFactor`; that belongs to the next main-flow integration step after task 009 is verified/closed.

Acoustic uniqueness cannot be guaranteed mathematically if two clones use the same/similar source speaker. The app enforces distinct voice names/profile metadata and distinct selected speed behavior; timbre identity remains produced by the underlying TTS model/reference audio.

## Retest sequence
1. Fetch exact final PR #50 HEAD and fully restart app.
2. Verify Adam and another voice display different prosody/speed profiles.
3. Render the same short/medium text using one slower and one faster profile; real audio durations must differ in the expected direction.
4. Create one clone and confirm prosody + speed are required/stored/displayed in the shared library.
5. In Settings, `Thêm giọng clone` must route to Voice Render instead of creating an incomplete clone locally.
6. Reconfirm merge/playback and no P1/P2/P3 state mutation.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; distinct profile/duration RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
