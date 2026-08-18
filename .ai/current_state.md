# Current State

## Status
TALKING-PORTRAIT-JOYVASA-035 — SOURCE PUBLISHED / STATIC OWNER CHECK WAITING / RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active feature branch: `review/TALKING-PORTRAIT-JOYVASA-035`.
- Draft PR: #75.
- Base: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034@0ee0ed2760622aab603a2088d6064ee747cad9ed`.
- Task 034 / PR #74 remains independently blocked on its Owner runtime gate; task 035 must not change that behavior.

## Task 035 implemented scope
1. Adds isolated `AI Avatar` navigation/page; no P1/P2/P3/Voice Render/Xoa Sub workflow ownership is changed.
2. Inputs: one portrait image plus one audio file.
3. Engine boundary: Electron main process spawns upstream JoyVASA `inference.py` in `human` mode; renderer never executes shell commands.
4. Engine discovery supports configured JoyVASA folder, `JOYVASA_HOME`, app-local candidates, explicit Python/venv, or fallback `conda run -n joyvasa python`.
5. Engine readiness requires upstream `inference.py` and core JoyVASA/LivePortrait weight directories.
6. Output is isolated under Electron userData `talking-portrait/outputs/<runId>` and does not become P1/P2/P3 authority.
7. Natural/Expressive/Calm plus expression/head controls map conservatively to upstream `cfg_scale` and `driving_multiplier`.
8. Eye/lip independent sliders are disabled because upstream marks retargeting controls WIP; lip motion remains audio-driven.
9. Successful output is previewable, openable, and exportable through existing Save Copy.
10. Cancel requests terminate the active child process; only one Avatar job may run at a time.

## Upstream contract verified from JoyVASA source
- Windows is documented by upstream.
- Human CLI uses `inference.py -r <image> -a <audio> --animation_mode human` with configurable output directory, cfg scale, driving multiplier and animation region.
- Human pipeline writes `<reference_basename>_<audio_basename>.mp4` and adds the driving audio to the final video.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: WAITING exact Owner checkout (`node --check` + `git diff --check`); no claim of local execution from PM environment.
- Code review: IN PROGRESS until final PR diff/full-file review after docs sync.
- Owner runtime: NOT STARTED. Requires real JoyVASA install + weights + GPU run.
- Documentation synchronization: IN PROGRESS until task_current/handoff are committed.
- Merge permission: BLOCKED.

## Next permitted action
Finish canonical docs sync, review exact PR #75 diff/full files, then Owner checks out exact HEAD and runs static checks plus one real image/audio generation. Do not merge before Owner PASS.