# Current Task

## Task ID
PIPELINE3-FINAL-COMPOSITION-017

## Status
SUBTITLE_UX_REV1_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_WAITING

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Revision-017 starting SHA: `63cabee71f0faaf451138201da789ba0c935fc68`.
- Owner runtime-feedback basis: `8f00455b4cec869556be09d87e7e8366dfa5537c`.
- Subtitle UX Rev1 reviewed source head: `ac84f58c69a503c4f7341a91eadc33025a3677b5`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-UX-REV1.md`.

## Current user outcome
Keep P3 focused on final composition and deepen subtitle authoring:
- direct horizontal resize of the subtitle text frame;
- richer subtitle effects;
- retain existing cover-band, cue editing, voice/video fit and final render behavior.

## Subtitle UX Rev1 implementation
### Resize
- Two left/right handles on active subtitle.
- Width change uses per-Job `maxWidth`.
- Resize is symmetric around subtitle X and bounded to video canvas.
- Existing width slider stays synchronized.
- Preview uses the selected width.
- Non-karaoke ASS line wrapping now responds to the chosen width.

### Effects
Available effects now include:
- none;
- fade;
- pop;
- slide up/down/left/right;
- zoom in/out;
- pulse;
- blur in;
- fade + slide up.

Preview and final ASS have corresponding implementations.

## Source scope for this feedback revision
From `8f00455b4cec869556be09d87e7e8366dfa5537c` only:
- `src/renderer/js/pipeline1-run-config.js` — one import line;
- new `src/renderer/js/pipeline3/subtitle-resize-effects.js`;
- `src/renderer/js/pipeline3/subtitle-ass.js`.

No backend/P1 execution/P2/TTS/dependency/finalizer change.

## Required exact-checkout verification
```text
node --check src/renderer/js/pipeline3/subtitle-resize-effects.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 8f00455b4cec869556be09d87e7e8366dfa5537c..HEAD
```

## Owner runtime acceptance for this revision
1. Reuse existing test directory only; exact HEAD must match remote.
2. During an active cue, verify two resize handles are visible.
3. Drag width to approximately 35%, 60%, 90%; subtitle center must not jump.
4. Verify `Độ rộng chữ tối đa` updates with handle drag.
5. Resize application window; handles remain attached to subtitle frame.
6. Confirm the effect selector contains all new effects.
7. Preview at least `slide_up`, `zoom_in`, `blur_in`, `fade_up`.
8. Render a short sample and confirm effect output is visible and subtitle wrapping follows selected width.
9. Verify position drag, cover band, cue edit and render still work.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: WAITING for Rev1.
- Documentation synchronization: PASS pre-runtime after PR synchronization.
- Merge: BLOCKED.

## Next action
Reverify PR #58 exact head/files/checks/comments; then Owner tests the exact head. No merge.
