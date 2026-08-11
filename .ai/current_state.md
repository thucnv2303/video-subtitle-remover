# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — SOURCE REVIEW PASS / OWNER RETEST READY / STATIC FINAL WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent failed revision: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c` / Draft PR #46 — OWNER RUNTIME FAIL.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Current reviewed source head: `e07c02776a5918be7a4d2c1a72b26ed3138027cc`.
- PM source review: `4905691792`.
- Task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner failure evidence driving this revision
- PR #46: 24.30s source -> 48.10s exported voice after pass 2 (197.9%).
- The old P1 TTS path synthesized 16 independent speech segments; Owner requires one coherent narration spoken continuously from beginning to end.
- A 17.6s input completed Vision but qwen global reasoning was still generating at 349s under the old 360s timeout.
- Sequential queue continuation did work and is preserved.

## Published correction — source reviewed
1. Final reasoning contract now returns one `narration_script`; it no longer returns `script_segments` or regenerates Vision scenes.
2. Source duration + selected P1 voice + selected P1 TTS speed are passed into global reasoning before the script is written.
3. An initial voice-aware character budget targets about 97.5% of source duration. Short-input global reasoning timeout is reduced to 150s; token budget is derived from narration size rather than old transcript-segment thresholds.
4. Vision chunk scenes remain the scene evidence authority and are reused in P1 artifacts.
5. Pipeline 1 continuous narration no longer calls `/api/tts-retry`. Each TTS pass makes one full-text `/api/tts/generate` request.
6. Electron main applies the selected speed with pitch-preserving ffmpeg `atempo`, writes `voice.wav`, and probes exact file duration with ffprobe.
7. Final accepted voice ratio remains inclusive 95–100% of source duration.
8. If pass 1 misses the gate, measured characters/second from that exact generated voice is used to derive a whole-narration target; qwen may fit the entire narration exactly once, followed by exactly one re-TTS.
9. Pass 2 outside 95–100% fails closed; P1 artifacts are not marked ready and P2 stays locked.
10. `tts_timed.srt` is derived after full narration synthesis for subtitle display only; display segmentation does not create independent speech synthesis clips or gaps.
11. Existing manual Job browsing correction is inherited; queue execution code was not changed, so safe sequential auto-advance/failure isolation remains the intended behavior.

## Artifact contract in this revision
- `artifact_version: 3`.
- `analysis_mode: multimodal-adaptive-continuous-narration-v3`.
- `remix_script.json` carries one authoritative `narration_script` plus compatibility timing metadata.
- `voice.wav` is the normalized accepted narration audio.
- `tts_timed.srt` is display timing derived after the continuous audio exists.

## Verification evidence
- Local reconstructed Node syntax checks PASS for all four changed JavaScript source candidates before publication.
- Deterministic narration-budget/repair-budget/speed-clamp/reasoning-timeout helper tests PASS.
- Source inspection confirms no `/api/tts-retry` reference remains in P1 continuous narration path and one `/api/tts/generate` call site is used per pass.
- GitHub source/diff review PASS `4905691792` at `e07c027...`.
- GitHub CI/status checks: none configured.
- GitHub unresolved review threads: none at reviewed source head.
- Exact Node checks on the final published/docs head and exact `git diff --check` remain WAITING and must PASS before merge.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: PARTIAL — deterministic/local candidate PASS; exact final published-head commands WAITING.
- Code review: PASS for source logic/scope at `e07c027...`.
- Owner manual app verification: NOT STARTED — READY FOR RETEST after this docs publication.
- Documentation synchronization: PASS after the docs commit containing this file and related task/QA/bugs/architecture updates.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner retests exact PR #47 final docs head with the previous two-Job sequence, especially the 24.30s overlong case. Verify one continuous narration, one full-text TTS request per pass, bounded global reasoning, final 95–100% voice ratio (or fail closed), automatic next-Job progression, and manual Job browsing. Run exact Node/diff static commands on that head. Do not merge or start Step 3 until Owner PASS is recorded and all gates are reverified.
