# Current Task

## Task ID
PIPELINE3-FINAL-COMPOSITION-017

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_WAITING

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Revision starting SHA: `63cabee71f0faaf451138201da789ba0c935fc68`.
- Reviewed application-source head: `91678a85bc3d15838c96b96b9f4fc768059f3fec`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Backend amendment is superseded; no backend source change was needed.

## User outcome
Pipeline 3 is the focused final composition step:
- P2 clean video + P1 voice;
- new subtitle styled/positioned to cover residual old-subtitle blemishes;
- conservative voice/video duration fit;
- sufficient background/original audio composition;
- high-quality final output with source geometry/FPS preserved.

It is not a general-purpose OpenCut-like editor.

## Revision-017 implementation
### Subtitle / cover
- `Che vùng lem` preset.
- Separate per-cue ASS cover band behind subtitle text.
- Band color / opacity / width / logical pixel height.
- Exact logical X/Y shared by band and subtitle.
- Preview follows fitted logical canvas.
- Existing typography, box, position, safe zone, snap and text effects remain.

### Cue edit
- Timeline cue selection.
- Edit text/start/end.
- Reject invalid/overlapping timing.
- Store stable P3-derived SRT without mutating P1 SRT.

### Fit planner
Modes:
- auto
- natural
- fit_voice
- fit_video
- balanced

Bounds:
- voice `0.92–1.08x`
- video `0.90–1.10x`

The plan is visible before render and fail-closed when unsafe.

### Audio-aware fit rules
- Video retime with no background is supported.
- Video retime with separated background is supported when Remove Vocal is ON: background is derived from base clean video and retimed using the existing `applyVoiceTempo` bridge before mix.
- Video retime with original/background audio >0 and Remove Vocal OFF is blocked because current engine has no safe generic original-audio retime contract.
- Auto falls back to safe voice-only fit when possible.

### Render / quality
- Derived P3 media only; P1/P2 source artifacts stay immutable.
- Stable subtitle source prevents double timing scale on re-render.
- Burn ASS rebuilt from exact final SRT when voice timing changes.
- Preserve source resolution/FPS; no resize.
- Audio-only mix copies video stream.
- Existing video retime uses H.264 CRF18.
- Burn subtitle once at final stage.
- No fake user-selectable CRF/codec controls.

## Source scope reviewed
Revision 017 changes only:
- `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`
- `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-BACKEND-AMENDMENT.md`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/editor.js`
- new `src/renderer/js/pipeline3/fit-planner.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- `src/renderer/styles/pipeline3-editor.css`

No backend/P1/P2/TTS/dependency source change in this Revision-017 delta.

## Required exact-checkout static verification
```text
node --check src/renderer/js/pipeline3/editor.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/fit-planner.js
node --check src/renderer/js/pipeline3/preview-geometry.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline3/render-controller.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 63cabee71f0faaf451138201da789ba0c935fc68..HEAD
```

## Owner runtime acceptance
1. Reuse existing local test directory only; verify exact HEAD first.
2. Use `Che vùng lem`; adjust band width/height/color/opacity and drag subtitle/band to bottom, center and top. Resize window; logical placement must remain stable.
3. Render a short sample and verify the band is behind new subtitle text and actually hides the P2 residual area without hiding the text.
4. Select a cue from timeline, edit text and start/end, save, render; P1 SRT must remain unchanged and final output must use edited P3 timing/text.
5. Near-match duration: test Auto and inspect planned/logged voice/video speeds.
6. Test explicit video-retime with background >0 + Remove Vocal OFF: UI/render must block clearly.
7. Enable Remove Vocal with background >0 and a valid video-retime plan: background must remain synchronized after same-speed retime.
8. Unsafe long voice must block instead of extreme tempo.
9. Render twice after changing cue/style; no double timing scale or double-burn source reuse.
10. Output keeps expected resolution/aspect/FPS and is visually acceptable for final publication.

## Known honest limitation
Explicit final subtitle-burn H.264 CRF/preset selection is not available in the backend contract, so Revision 017 does not expose fake quality controls. A dedicated backend quality task may follow only if runtime quality requires it.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact-checkout evidence.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after final PR sync.
- Merge: BLOCKED.

## Next action
Finish dynamic-doc/PR synchronization and verify current PR exact HEAD/status/checks/comments. Then Owner may update the existing clean test directory and run the required static + runtime acceptance. No merge.
