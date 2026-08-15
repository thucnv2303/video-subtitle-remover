# Current Task

## Task ID
PIPELINE3-FINAL-COMPOSITION-017

## Status
RUNTIME_FIX_REV4_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_REVERIFY_WAITING

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Rev4 starting HEAD: `92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Reviewed Rev4 application-source HEAD: `d5aae15c5471f0e23f35ac3ae7cc205fc47b0fe3`.
- Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-RUNTIME-FIX-REV4.md`.

## Owner runtime feedback driving Rev4
The pre-Rev4 build is not accepted:
- inspector settings are horizontally clipped;
- checked Remove Vocal did not reliably remove original vocal;
- export cannot choose destination or actual video quality.

Owner decision: `NEEDS_REVISION`.

## Rev4 outcome
### Inspector containment
- nested P3 controls use border-box/min-width containment;
- right inspector gets more usable width;
- category chips wrap;
- nested grids collapse at narrower desktop widths;
- no inspector-level horizontal clipping is intended.

### Strict vocal removal
When `removeVocal=true` and background level > 0:
- only `method_used=demucs` is accepted;
- weak fallback methods are rejected visibly;
- final render cannot silently succeed with original vocal mixed back in.

### Export controls
Per Job:
- `outputDirectory`;
- `outputFileName`;
- `exportQuality`.

Quality presets are real libx264 settings:
- balanced = CRF20 / medium;
- high = CRF18 / slow;
- very_high = CRF16 / slow;
- max = CRF14 / slower.

The final path cannot overwrite source/P2 clean video.

### P3 export engine
A narrow Electron FFmpeg bridge handles:
- video retime using the selected quality;
- final ASS burn using the selected quality;
- source resolution/FPS preserved; no resize.

No backend Python/API route change was needed.

### Subtitle timing safety
Before final HQ burn, ASS is rebuilt from the exact final timed SRT. If voice retime changed cue timing, original karaoke preservation is disabled for that render so subtitles do not drift.

## Rev4 source scope
- new `src/main/p3-export-bridge.js`;
- `src/main/preload.js`;
- `src/renderer/js/pipeline1-run-config.js` — one import-only line;
- `src/renderer/js/pipeline3/editor-store.js`;
- new `src/renderer/js/pipeline3/runtime-fix-rev4.js`;
- `src/renderer/js/pipelines/pipeline3-finalize.js`.

No P1 execution/P2/TTS/backend/dependency change.

## Required exact-checkout verification
```text
node --check src/main/p3-export-bridge.js
node --check src/main/preload.js
node --check src/renderer/js/pipeline3/runtime-fix-rev4.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

## Owner runtime acceptance
1. Reuse the existing clean test directory only.
2. Re-test the inspector at the same window size as the screenshot; settings/cards must not be clipped.
3. Choose a different output folder and filename.
4. Select `Cao` or `Rất cao`; final log/path must reflect the chosen CRF/preset.
5. With Remove Vocal ON + background > 0: either Demucs succeeds and original vocal is materially removed, or P3 visibly blocks with a Demucs-required error.
6. Confirm one final subtitle render still matches timing/style.
7. Re-render and confirm clean P2 is still the input authority.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: FAIL for pre-Rev4 build / WAITING for Rev4.
- Documentation synchronization: PASS pre-runtime after PR synchronization.
- Merge: BLOCKED.

## Next action
Verify PR #58 exact current head/checks/comments, then Owner runs exact-checkout static + focused runtime Rev4 test. No merge.
