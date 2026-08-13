# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER RUNTIME CORE PASS / DURATION ESTIMATOR CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

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
- `Render toàn bộ` now works end-to-end.
- Long text was split into 3 sequential chunks.
- All 3 chunks completed.
- Final WAV merge completed and output is playable.
- Log and global status correction are visible in the running app.

Remaining defect observed by Owner:
- Duration estimate displayed `~ 8.1 phút` for 1,178 words while the actual merged WAV duration was about `5:03`.

## Verified duration-estimator root cause
`src/renderer/js/voice-render.js` used one fixed heuristic for every voice:
- `minutes = words / 145`.

The completed Adam output gives an observed rate of roughly 233 words/minute for this text/run, so the fixed 145 WPM heuristic materially overestimates this voice. The estimator did not use selected-voice identity, preview duration, or prior real render duration.

## Corrective estimator published
`src/renderer/js/voice-render-owner-fixes.js` now adds per-voice/per-language adaptive rate profiles:
- profile key uses selected voice id + language;
- preview WAV metadata can seed/calibrate a voice rate;
- successful full merged output updates the rate with the actual text + real audio duration;
- learned profile is persisted locally in `voice_render_rate_profiles_v1`;
- future estimates use learned WPM/character rate for the exact voice/language instead of the old global 145 WPM assumption;
- when no learned profile exists, language-specific fallback is explicitly used and marked as fallback in the estimate tooltip;
- the estimator remains telemetry, not a guarantee.

No TTS generation algorithm, voice audio, chunking, P1/P2/P3 implementation, shared video Job/gate or dependency is changed by this correction.

## Gates
- Execution: PASS — adaptive estimator correction published.
- Automated/static verification: WAITING on final exact HEAD.
- Code review: WAITING on estimator correction exact head.
- Owner runtime: PARTIAL PASS — core Voice Render/render/merge PASS; duration-estimate retest WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches the final exact PR #50 HEAD, fully restarts VSR, selects Adam and either previews Adam or performs one render. Then verify that the displayed estimate is recalibrated from actual Adam rate and is materially closer to the real output duration. Do not merge.
