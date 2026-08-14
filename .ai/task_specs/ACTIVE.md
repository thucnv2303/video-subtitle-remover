# Active PM Execution Spec

Status: PIPELINE3_FINAL_COMPOSITION_017_SUBTITLE_UX_REV1_CODE_REVIEW_PASS_STATIC_OWNER_VERIFY_WAITING

Task: `PIPELINE3-FINAL-COMPOSITION-017`
Repository: `thucnv2303/video-subtitle-remover`
Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
Owner feedback basis: `8f00455b4cec869556be09d87e7e8366dfa5537c`
Reviewed Subtitle UX Rev1 source head: `ac84f58c69a503c4f7341a91eadc33025a3677b5`
Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`
Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-UX-REV1.md`

## Purpose
Verify the Owner-requested subtitle UX additions without broadening P3:
- direct drag-resize of subtitle frame width;
- expanded effect library with preview/final parity.

## Source scope from Owner feedback basis
- `src/renderer/js/pipeline1-run-config.js` — one P3 enhancer import;
- new `src/renderer/js/pipeline3/subtitle-resize-effects.js`;
- `src/renderer/js/pipeline3/subtitle-ass.js`.

## Required exact-checkout verification
```text
node --check src/renderer/js/pipeline3/subtitle-resize-effects.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 8f00455b4cec869556be09d87e7e8366dfa5537c..HEAD
```

## Owner runtime acceptance
1. Reuse existing local test directory only.
2. Exact HEAD must match current PR #58 head.
3. Active subtitle displays two horizontal resize handles.
4. Drag to ~35%, ~60%, ~90%; center X does not jump and slider stays synchronized.
5. Resize the app window; handles remain logically attached.
6. Effect selector includes slide up/down/left/right, zoom in/out, pulse, blur in, fade+slide up.
7. Preview `slide_up`, `zoom_in`, `blur_in`, `fade_up`.
8. Render one short sample; final effect and text wrapping visibly follow configuration.
9. Recheck subtitle position drag, cover band, cue edit and render.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after PR body update.
- Merge: BLOCKED.

## Next permitted action
Reverify live PR #58 exact final head/files/status/checks/comments; then Owner tests exact head. No merge.
