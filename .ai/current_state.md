# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER CORE RUNTIME PASS / DISTINCT VOICE PROFILE CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE; never use for Owner testing.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Latest Owner runtime evidence
PASS:
- Voice Render tab/page mounts.
- Shared voice list and voice preview work.
- `Render toàn bộ` works end-to-end.
- Long text split into 3 sequential chunks; all completed.
- Final WAV merge completed and output is playable.
- Log/global status corrections are visible.

Remaining Owner defect before this correction:
- changing voice did not produce a meaningful duration difference because the old estimator used a shared rate and Voice Render did not enforce a persistent per-voice speed profile on generated audio.

## Distinct voice-profile correction
Every Voice Render voice now has a profile containing at least:
- `prosody` / intonation label;
- `speedFactor`.

Built-in profiles are distinct. Existing legacy clone voices missing profile fields are migrated to distinct profile combinations. New clone creation requires a non-duplicate name and non-duplicate `prosody + speedFactor` profile.

`src/main/main.js` now provides constrained `voice-render:applyTempo` processing using FFmpeg `atempo` in the main process. `src/main/preload.js` exposes only the narrow `applyVoiceTempo()` IPC bridge. Voice Render applies the selected voice `speedFactor` to preview/chunk audio before final merge, so profile speed changes real output duration rather than only the displayed estimate.

The duration estimator uses per-voice/per-language measured output when available and profile-based fallback before calibration. Full successful output remains the strongest local rate sample.

## Shared-library rule
- `localStorage.tts_voices` remains the single clone-voice store.
- Settings/Pipeline selectors continue reading that store.
- Creating a new clone from Settings is redirected to Voice Render so every newly created clone receives the complete profile contract.
- Voice profile metadata is stored with the shared clone record for later main-flow consumption.

## Important limitation
The app can enforce unique profile metadata and selected speed behavior. It cannot mathematically guarantee two independently cloned voices are acoustically unique if the same/similar source voice is supplied; acoustic identity remains determined by the underlying voice model/reference audio.

## Isolation
No P1 semantic reasoning, P2 inpaint, P3 composition, shared video Job/gate, TTS model implementation or dependency/package change is included in this correction.

## Gates
- Execution: PASS — profile correction published.
- Automated/static verification: WAITING on final exact HEAD.
- Code review: WAITING on final exact HEAD.
- Owner runtime: PARTIAL PASS — core render/merge PASS; distinct profile/duration behavior RETEST WAITING.
- Documentation synchronization: PASS after dynamic state sync.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches exact final PR #50 HEAD, restarts VSR, verifies different voices show different prosody/speed profiles and render the same short text with two profiles having clearly different speed factors. Their real output durations must differ in the expected direction. Also create/inspect one clone and verify prosody + speed are stored/displayed. If PASS and static checks PASS, PM may close task 009 and return to the main pipeline task. Do not merge before that evidence.
