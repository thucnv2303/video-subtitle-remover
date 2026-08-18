# Current Task

## Task ID
TALKING-PORTRAIT-JOYVASA-035

## Status
SOURCE_BOOTSTRAP_PUBLISHED_OWNER_STATIC_AND_GPU_RUNTIME_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-JOYVASA-035`.
- Draft PR: #75.
- Base: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034@0ee0ed2760622aab603a2088d6064ee747cad9ed`.
- JoyVASA bootstrap pin: `916a90f8de490e8648fee460c1200bd5d9a795af`.

## User outcome
Standalone AI Avatar creates a talking portrait MP4 from one image + one voice file with local JoyVASA, without changing P1/P2/P3/Voice Render/Xoa Sub authority.

## Acceptance
- Truthful engine readiness and no fake generation.
- Separate `joyvasa` environment; app's existing Python environment remains untouched.
- Safe argv child process, one job at a time, cancellable.
- Bounded presets map only to supported JoyVASA parameters.
- Output is isolated, previewable, openable and Save Copy exportable.
- Vietnamese audio is accepted as driving audio; quality itself is determined by real runtime evidence.

## Required Owner commands
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

## Runtime acceptance
1. AI Avatar reports Ready after bootstrap.
2. Frontal portrait + short Vietnamese voice generates an MP4 with audio and visible lip/head motion.
3. Preview/Open/Save Copy work.
4. A second job can be cancelled without false success.
5. Existing P1/P2/P3/Voice Render/Xoa Sub navigation still smoke-passes.

## Gates
- Execution: PASS.
- Automated/static: WAITING Owner exact checkout.
- Code review: PASS before final exact-HEAD docs re-read.
- Owner runtime: NOT STARTED.
- Documentation sync: IN PROGRESS until handoff update.
- Merge: BLOCKED.
