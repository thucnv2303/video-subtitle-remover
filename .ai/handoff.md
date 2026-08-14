# AgentOS Handoff Status

## Active task
`PIPELINE3-FINAL-COMPOSITION-017`

## Status
SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Revision-017 starting SHA: `63cabee71f0faaf451138201da789ba0c935fc68`
- Reviewed application-source head: `91678a85bc3d15838c96b96b9f4fc768059f3fec`
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`
- Backend-amendment record is superseded; `api/server.py` remains unchanged.

## Product outcome now implemented
Pipeline 3 is focused on final composition, not broad NLE editing:
- P2 clean video + P1 voice;
- subtitle styling/placement and a dedicated cover band to hide residual old-subtitle blemishes;
- cue text/timing correction;
- conservative voice/video fit planning;
- required background/original-audio composition within real engine constraints;
- source-resolution/FPS final output with minimized unnecessary encode stages.

## Reviewed source behavior
- `Che vùng lem` creates a separate ASS vector band on layer 0 while subtitle text remains layer 1.
- Band uses subtitle logical X/Y, independent color/opacity/width/height and preview scaling.
- Timeline cue edit writes stable P3 SRT only and leaves P1 SRT unchanged.
- Fit planner supports auto/natural/fit_voice/fit_video/balanced with voice 0.92–1.08x and video 0.90–1.10x bounds.
- UI shows predicted speeds/final durations before render and blocks unsafe plans.
- Background-audio/video-retime conflict is fail-closed; Auto may use safe voice-only fallback.
- With Remove Vocal ON, a separated background bed can be retimed by the same video speed using the existing Electron `applyVoiceTempo` bridge.
- Re-render resets to P2 clean video and stable P3 subtitle source, preventing double burn/double SRT scaling.
- Final ASS is rebuilt from the exact final SRT when voice timing changes.
- No P1/P2/backend/TTS/dependency source change in Revision 017.

## Verification status
- PM code review: PASS.
- PM isolated syntax/functional spot checks: PASS.
- Exact local checkout Node checks and `git diff --check`: WAITING.
- Owner real-app acceptance: WAITING.

## Local safety
Do not create another clone/worktree/test directory. Reuse only the existing test directory. Before switching ref, `git status --short` must be empty. Dirty => STOP; no reset/restore/clean.

## Owner acceptance focus
- cover band preview/render parity and ability to hide residual subtitle-removal blemishes;
- cue editing without P1 artifact mutation;
- fit-plan UI vs actual logged/rendered speeds;
- blocked unsafe/original-audio video-retime case;
- Remove Vocal + background retime synchronization case;
- second render does not double-scale timing or reuse previous final output;
- output geometry/FPS/visual quality remains suitable.

## Known limitation
No explicit final burn codec/CRF/preset controls yet because the current backend burn contract does not expose them. Revision 017 deliberately does not present fake export options.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after final PR sync.
- Merge: BLOCKED.

## Next permitted action
Finish ACTIVE/PR synchronization and reverify PR #58 exact head/files/checks/comments. Then Owner may switch the existing clean test directory to that exact head and run static/runtime verification. No merge.
