# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-JOYVASA-035`

## Status
SOURCE + PINNED BOOTSTRAP PUBLISHED / OWNER STATIC+GPU RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-JOYVASA-035`.
- Draft PR: #75.
- Base: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034@0ee0ed2760622aab603a2088d6064ee747cad9ed`.
- JoyVASA upstream pin: `916a90f8de490e8648fee460c1200bd5d9a795af`.

## Delivered
- Standalone AI Avatar UI and navigation.
- Portrait/audio local input preview.
- Electron IPC + isolated JoyVASA child-process adapter.
- Truthful engine/weight readiness.
- Bounded supported parameter mapping; no fake WIP eye/lip controls.
- Live progress, single-job guard, Cancel, MP4 preview/Open/Save Copy.
- Windows bootstrap `scripts/setup-joyvasa.ps1` into `tools/JoyVASA` and separate Conda env `joyvasa`.
- Deterministic non-GPU adapter assertions in `scripts/verify-talking-portrait.js`.

## Owner gate commands
```text
git fetch origin
git switch review/TALKING-PORTRAIT-JOYVASA-035
git pull --ff-only
node --check src/main/talking-portrait-engine.js
node --check src/main/main-entry.js
node --check src/main/preload.js
node --check src/renderer/js/talking-portrait.js
node scripts/verify-talking-portrait.js
powershell -ExecutionPolicy Bypass -File scripts/setup-joyvasa.ps1
git diff --check 0ee0ed2760622aab603a2088d6064ee747cad9ed..HEAD
```

Then launch the app and test one frontal portrait + short Vietnamese voice. Required runtime evidence: Ready status, successful MP4 with supplied audio and visible talking motion, Preview/Open/Save Copy, Cancel on a second run, existing-page navigation smoke check.

## Gates
- Execution: PASS.
- Automated/static: WAITING Owner.
- Code review: PASS for source architecture; exact final HEAD metadata/review-thread check still required.
- Owner verification: NOT STARTED.
- Documentation synchronization: PASS after this commit if canonical files re-read consistently.
- Merge permission: BLOCKED.

## Forbidden
Do not merge before Owner runtime PASS is recorded in canonical `.ai/`. Do not vendor weights. Do not install JoyVASA packages into the existing pipeline Python environment.