# Current State

## Status
PIPELINE1-FINAL-RUNTIME-GUARDS-005 — CODE REVIEW PASS / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent adaptive branch/head: `review/PIPELINE1-ADAPTIVE-VISION-004@0f668866dba2a38053080627872229e9ed85addd`.
- Active review branch: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- Draft PR: #46.
- Current reviewed source commit: `d9dcd665295a6ca2583644e2ffb39e6421f79f32`.
- PM source review: `4904862077`.

## Latest Owner runtime evidence — 2026-08-11
- Owner reports all Jobs in the latest adaptive run completed successfully; fixed-8 Vision truncation no longer blocked this run.
- New UI defect: while one Job processes, Owner cannot keep another Job selected for inspection because periodic/phase synchronization forces selection back to the running Job.
- New severe product defect: generated narration can be longer than the source video after TTS.
- Owner requirement: successful exported narration track must be between 95% and 100% of source-video duration.
- Long-video (>60s) adaptive runtime coverage is still not evidenced by the supplied run and remains a separate verification item.

## Verified causes and corrections
1. `pipeline1-run-ux.js` synchronized the processing Job into `pipeline1SelectedJobId` every 250ms. It now preserves any valid manual selection and auto-selects the processing Job only when no valid selection exists.
2. `pipeline1-ai.js` phase transitions also forced selection to the running Job. They now preserve an existing valid manual selection while keeping `activeJobId` as execution authority.
3. P1 previously accepted TTS output without comparing narration duration to source duration. It now enforces `0.95 <= exported_voice_duration / source_video_duration <= 1.00`.
4. Current `/api/tts-retry` legacy duration metadata excludes a fixed 1000ms exported silence tail; the gate normalizes that tail and prefers an explicit exact exported-duration field if one becomes available later.
5. If pass 1 is outside range, one bounded script-fit call is allowed. It must preserve exact SRT segment count/timestamps, synchronize `remix_script.srt` and `remix_script.json`, then regenerate TTS exactly once.
6. If pass 2 remains outside range, P1 fails closed; `p1ArtifactsReady` is not set true and P2 must remain locked.

## Verification
- Deterministic duration helper simulation PASS: 94% reject; 95% accept; 100% accept; 101% reject; 120% input maps to 81.25% text-scale target toward 97.5%; legacy 9000ms + 1000ms tail normalizes to 10000ms.
- PM full source/diff review PASS `4904862077`.
- Exact final `node --check` for both changed JS files: WAITING.
- Exact final `git diff --check`: WAITING.
- GitHub CI/status checks: none configured.
- Owner runtime on PR #46: NOT STARTED.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL / WAITING exact final commands.
- Code review: PASS for source logic/scope at `d9dcd665...`.
- Owner manual app verification: NOT STARTED on PR #46.
- Documentation synchronization: PASS after publication of the docs commit containing this file.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Run exact static checks on PR #46 head, then Owner retests manual Job browsing during processing and a narration case that previously exceeded video duration. A successful narration must log a final exported voice ratio within 95–100%. Also retain the pending >60s adaptive sampling runtime check before final merge approval.
