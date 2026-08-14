# PIPELINE3-WORKSPACE-015 — Revision 1: Re-render clean-source safety

Status: APPROVED FOR PM DIRECT EXECUTION

## Verified risk
The inherited `pipeline3-finalize.js` assigns `job.outputPath = job.finalOutputPath` when a final render completes. The new P3 workspace exposes a `Render lại` action after completion. Without an additional guard, a second click can use the already-rendered final video as the next finalizer input instead of the immutable clean video produced by Pipeline 2, risking repeated audio/subtitle composition.

## Required correction
Keep the existing finalizer untouched in this revision. Add a tiny P3 workspace safety module that runs before the workspace render click handler and:
- preserves the first P3 clean-video path in `job.p3CleanVideoPath`;
- before every P3 workspace render click, restores `job.outputPath = job.p3CleanVideoPath` when that preserved path exists;
- does not touch P1/P2 artifact files;
- does not intercept unrelated buttons;
- logs nothing during normal operation;
- installs exactly one capture listener.

## Additional authorized source
- new `src/renderer/js/pipeline3-rerender-safety.js`
- one additional loader import in `src/renderer/js/pipeline1-run-config.js`

No backend/finalizer/P1/P2/dependency changes.

## Acceptance
- first render preserves the clean P2 path;
- subsequent `Render lại` starts from the same clean P2 path, not previous `finalOutputPath`;
- normal first render is unchanged;
- duplicate listener installation is impossible.
