# Current State

## Status
TALKING-PORTRAIT-JOYVASA-035 — SOURCE + BOOTSTRAP PUBLISHED / OWNER STATIC + GPU RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active feature branch: `review/TALKING-PORTRAIT-JOYVASA-035`.
- Draft PR: #75.
- Base: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034@0ee0ed2760622aab603a2088d6064ee747cad9ed`.
- JoyVASA upstream pinned for bootstrap: `jdh-algo/JoyVASA@916a90f8de490e8648fee460c1200bd5d9a795af`.
- Task 034 / PR #74 remains independently blocked on its Owner runtime gate.

## Implemented
1. Isolated AI Avatar tab: portrait + audio -> JoyVASA human inference -> MP4 preview/export.
2. Electron main owns engine discovery, validation, child process, output isolation and cancellation.
3. Natural/Expressive/Calm and bounded expression/head values map to upstream cfg_scale/driving_multiplier. Eye/lip independent controls remain disabled because upstream retargeting is WIP.
4. `scripts/setup-joyvasa.ps1` provides a pinned Windows bootstrap into `tools/JoyVASA`, using separate Conda env `joyvasa`; it does not mutate the existing P1/P2 Python environment.
5. `scripts/verify-talking-portrait.js` adds deterministic assertions for preset bounds/defaults without requiring Electron runtime/GPU.

## Gates
- Execution: PASS for source/bootstrap publication.
- Automated/static verification: WAITING Owner exact checkout. Required: Node syntax checks, deterministic adapter script, PowerShell parse/run, git diff check.
- Code review: PASS for current source structure and engine boundary; final exact-HEAD re-read still required after docs sync.
- Owner runtime: NOT STARTED. Requires bootstrap success plus one real GPU image/audio generation.
- Documentation synchronization: IN PROGRESS until task_current/handoff reflect latest HEAD.
- Merge permission: BLOCKED.

## Owner verification sequence
From exact PR #75 checkout:
1. `node --check src/main/talking-portrait-engine.js`
2. `node --check src/main/main-entry.js`
3. `node --check src/main/preload.js`
4. `node --check src/renderer/js/talking-portrait.js`
5. `node scripts/verify-talking-portrait.js`
6. `powershell -ExecutionPolicy Bypass -File scripts/setup-joyvasa.ps1`
7. Start app, open AI Avatar, confirm engine Ready, select a clear frontal portrait + short Vietnamese voice, Generate.
8. Confirm MP4 preview contains source audio, Open works, Save Copy works, Cancel works on a second run.
9. `git diff --check 0ee0ed2760622aab603a2088d6064ee747cad9ed..HEAD`

## Merge
BLOCKED until Owner runtime PASS is recorded into canonical `.ai/` and all gates are re-reviewed.