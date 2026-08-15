# PIPELINE3-FINAL-COMPOSITION-017 — Subtitle UX Revision 1

Status: OWNER RUNTIME FEEDBACK ACCEPTED / SOURCE PUBLISHED / EXACT STATIC + OWNER VERIFY WAITING

## Authority
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Runtime-feedback basis HEAD: `8f00455b4cec869556be09d87e7e8366dfa5537c`
- Owner screenshot / observation: 2026-08-14
- Owner requests:
  1. subtitle text frame width must be directly adjustable by dragging;
  2. add substantially more subtitle effects.

## PM decision
Keep scope inside subtitle authoring. Do not add generic video-editor features.

### Direct text-frame resize
- Two horizontal resize handles appear at left/right edges of the active subtitle frame.
- Dragging either handle changes the existing per-Job `maxWidth` value symmetrically around subtitle X.
- Width stays bounded inside the logical video canvas.
- Existing `Độ rộng chữ tối đa` slider remains synchronized with drag resize.
- Preview frame uses the selected width.
- Derived non-karaoke ASS performs deterministic width-aware word wrapping from logical video width + font size so final burn follows the chosen width more closely.

### Subtitle effects
Keep current `none`, `fade`, `pop` and add:
- slide up;
- slide down;
- slide left;
- slide right;
- zoom in;
- zoom out;
- pulse;
- blur in;
- fade + slide up.

Preview uses matching CSS animations. Final ASS uses only libass/ASS-supported tags (`move`, `fad`, `fscx/fscy`, `t`, `blur`).

## Source delta
From `8f00455b4cec869556be09d87e7e8366dfa5537c`:
- `src/renderer/js/pipeline1-run-config.js`: one import for the P3 subtitle UX enhancer;
- new `src/renderer/js/pipeline3/subtitle-resize-effects.js`;
- `src/renderer/js/pipeline3/subtitle-ass.js`.

No P1 execution logic, P2, backend, TTS, dependency or finalizer change.

## Acceptance
1. During an active cue, left/right resize handles are visible.
2. Dragging a handle changes subtitle width smoothly without moving subtitle center.
3. Slider `Độ rộng chữ tối đa` tracks the dragged width.
4. Job switch restores that Job's width.
5. Window resize keeps handles attached to the same logical subtitle frame.
6. All listed effects appear in the effect selector.
7. Effect preview replays when a new cue becomes active or an effect changes.
8. Rendered ASS visibly matches the chosen effect for each supported effect.
9. Non-karaoke rendered subtitle line wrapping responds to changed text-frame width.
10. Existing subtitle drag, cover band, cue edit and P3 render behavior do not regress.

## Required verification
```text
node --check src/renderer/js/pipeline3/subtitle-resize-effects.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 8f00455b4cec869556be09d87e7e8366dfa5537c..HEAD
```

Owner runtime should test at least widths around 35%, 60%, and 90%, then render one short sample with `slide_up`, `zoom_in`, `blur_in`, and `fade_up`.

## Gates
- Execution: PASS source published.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope after PM inspection.
- Owner runtime: WAITING.
- Documentation synchronization: IN PROGRESS until dynamic docs/PR body point to current exact HEAD.
- Merge: BLOCKED.
