# Current State

## Status
OWNER_RUNTIME_FAIL — BUG-005 PIPELINE 1 FULL CHAIN

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Canonical base for this task
`dd520054b385ae18b8154b7c897eb9baad7eac02`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
- BUG-008 P1→P2 premature handoff defect: RESOLVED / Owner PASS.

## Active task
- Task: `BUG-005 — Pipeline 1 Full Processing Chain`.
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.

## Owner runtime evidence — 2026-08-10
Owner executed the reviewed candidate and reported FAIL.

Observed runtime facts:
- Start captured `AI=ollama/qwen3-coder:30b` and `TTS=clone:0`.
- `/api/p1/extract-text` returned success but only one ASR SRT segment, `Cảm ơn các bạn đã theo dõi.`, which Owner reports does not match the actual video content.
- AI rewrite completed from that ASR input.
- TTS backend successfully generated a real MP3 artifact and `/api/tts-retry` returned success.
- P1 then logged completion and the P1→P2 handoff unlocked the job.
- Approved Job Detail audio tab still displayed `Chưa có audio lồng tiếng`.
- The Job Detail header displayed no selected Job (`ID: —` / prompt to select a Job), while content had still been written into the detail textarea.

## Verified defects after Owner FAIL
1. **Detail selection/artifact binding mismatch**
   - approved detail rendering/audio uses `pipeline1SelectedJobId`;
   - legacy flow separately tracks `activeJobId` and writes content during processing;
   - runtime evidence proves these can diverge, producing text in the panel while audio remains hidden and the detail header shows no selected Job.
2. **P1 analysis contract is incomplete**
   - `/api/p1/extract-text` is explicitly ASR-only and delegates to the existing ASR extraction path;
   - AI rewrite consumes transcript/SRT only;
   - this does not implement the canonical target P1 requirement for original-video analysis with scene/keyframe/vision context, multimodal timeline, insights and remix-script artifacts.
3. **Completion acceptance is too weak**
   - current candidate treats transport-level ASR/AI/TTS success as P1 success even when the ASR content is materially wrong for the source video.

## Gate status
- Execution: NEEDS_REVISION.
- Automated/static verification: previous syntax/hash/simulation PASS remains valid only for wiring, not product acceptance.
- Code review: INVALIDATED / NEEDS_REVISION by Owner runtime evidence.
- Owner manual app verification: FAIL.
- Documentation synchronization: PASS for failure recording.
- Merge permission: BLOCKED.

## Permitted next action
Revise BUG-005 on the existing review branch or a fresh focused revision branch. First fix the selected-Job/detail artifact binding and then correct the P1 analysis contract so completion is based on valid analysis artifacts, not merely successful HTTP calls. Do not modify P2/P3 responsibilities.
