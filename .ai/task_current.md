# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
OWNER_RUNTIME_FAIL / NEEDS_REVISION

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
Implement the real Pipeline 1 contract on the original video:
`original-video analysis → validated transcript/insights → AI rewrite/remix → TTS/SRT artifacts → P1 COMPLETE → P2 READY`.

## Owner runtime FAIL — 2026-08-10
- P1 Start did run the configured Ollama model and clone voice.
- ASR returned only one SRT line, `Cảm ơn các bạn đã theo dõi.`, which Owner reports does not match the video.
- AI rewrite and TTS then succeeded technically from that incorrect input.
- Backend produced an MP3 artifact, but the approved audio detail tab still showed no audio.
- Detail header showed no selected Job while text was present in the textarea.
- P1 nevertheless marked complete and unlocked P2.

## Verified revision blockers
1. Fix the approved Job Detail selection/artifact binding so text/audio/status refer to one authoritative P1-selected Job.
2. Stop treating ASR-only transcript processing as sufficient implementation of the canonical P1 analysis requirement.
3. Implement/restore original-video analysis inputs required by architecture: scene/keyframe/vision context and analysis artifacts as applicable to the existing backend contract.
4. Completion must require valid required P1 artifacts, not only HTTP `status=ok`.
5. Preserve accepted P1→P2 gate: failure/cancel/invalid analysis keeps P2 locked.
6. Do not move subtitle removal or final render into P1.

## Previous candidate verification
- Syntax/hash/targeted simulation PASS remains valid only for the wiring changes already reviewed.
- Owner runtime evidence invalidates product acceptance and prior code-review PASS.

## Gates
- Execution: NEEDS_REVISION.
- Automated/static verification: WAITING for revised candidate.
- Code review: NEEDS_REVISION.
- Owner manual app verification: FAIL; fresh retest NOT AUTHORIZED until revised code review PASS.
- Documentation synchronization: PASS for failure recording.
- Merge permission: BLOCKED.
