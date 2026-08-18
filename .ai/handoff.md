# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-JOYVASA-035`

## Status
SOURCE PUBLISHED / FINAL GITHUB REVIEW NEXT / OWNER STATIC+RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-JOYVASA-035`.
- Draft PR: #75.
- Base: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034@0ee0ed2760622aab603a2088d6064ee747cad9ed`.
- PR #74 remains a separate unfinished gate chain; do not infer task 034 PASS from this branch.

## Implemented feature
- New standalone `AI Avatar` page.
- Portrait + voice input and local preview.
- Real Electron IPC boundary to local JoyVASA.
- JoyVASA root discovery/configuration and weight-directory readiness check.
- Separate child process using explicit argv; no shell command construction.
- Human talking-portrait inference only.
- Natural/Expressive/Calm presets and bounded expression/head mapping to upstream cfg/motion controls.
- Upstream WIP eye/lip retargeting is not enabled.
- Isolated output directory under Electron userData.
- Live process messages, cancellation, final video preview/open/Save Copy.
- No intended P1/P2/P3/Voice Render/Xóa Sub changes.

## Owner checkout and static gate
```text
git fetch origin
git switch review/TALKING-PORTRAIT-JOYVASA-035
git pull --ff-only
node --check src/main/talking-portrait-engine.js
node --check src/main/main-entry.js
node --check src/main/preload.js
node --check src/renderer/js/talking-portrait.js
git diff --check 0ee0ed2760622aab603a2088d6064ee747cad9ed..HEAD
```

## JoyVASA runtime prerequisite
Use an upstream-compatible JoyVASA installation with model weights and FFmpeg. The app can use a configured Python/venv or fallback `conda run -n joyvasa python`. Select the JoyVASA repository root in the UI if it is not auto-detected.

## Runtime gate
Use one short frontal portrait + short Vietnamese audio first. Generate Natural/Quality, confirm real MP4/audio/motion and Save Copy. Then test Expressive and Cancel. Finally smoke-check navigation to existing features.

## Gates
- Execution: PASS.
- Automated/static: WAITING Owner commands.
- Code review: IN PROGRESS until final PR #75 exact-HEAD diff/full-file inspection.
- Owner verification: NOT STARTED.
- Documentation synchronization: PASS after this commit if exact HEAD contains all three canonical files consistently.
- Merge permission: BLOCKED.

## Forbidden
- Do not merge PR #75 before Owner runtime PASS.
- Do not vendor JoyVASA weights into this repository.
- Do not install JoyVASA dependencies into the existing P1/P2 Python environment as part of this task.
- Do not claim eye/lip independent strength support unless upstream implementation is changed and separately verified.