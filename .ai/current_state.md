# Current State

## Status
PIPELINE3-FINAL-COMPOSITION-017 — SUBTITLE STYLE ENGINE REV3 SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Rev3 starting HEAD: `e2b8af05a4ea0baefa164534598cc25668110feb`.
- Rev3 reviewed application-source head: `1d3544372e0323473b3de1771464aca9cc9d9b04`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-STYLE-ENGINE-REV3.md`.

## Owner direction
Adopt the useful CapCut subtitle pattern: a strong style engine plus a large data-driven preset library and deeper render-backed typography controls, without cloning proprietary assets or broadening P3 into a general NLE.

## Reviewed Subtitle Style Engine Rev3
### Style library
- 32 data-driven presets in 8 categories: Basic, Social, Tutorial, Karaoke, Highlight, Glow, Box, Cover.
- Visual 2-column cards with category chips and active-style state.
- Legacy five preset buttons are hidden from primary UX but remain in source compatibility path.
- Applying a style updates the existing per-Job controls rather than creating a parallel hidden style authority.
- Manual style edits switch `stylePresetId` back to `custom` so the selected card never lies after user customization.

### Advanced render-backed typography
Per-Job config now includes:
- underline;
- ASS letter spacing;
- text opacity;
- glow enable/color/blur/outline.

Preview applies the same logical properties. Letter spacing is scaled by current canvas fit instead of using raw logical pixels in the viewport.

### Final ASS
- `Underline` and `Spacing` style fields are populated.
- text opacity is encoded in ASS primary-color alpha.
- Glow is a real lower text layer with configured color/outline/blur; main text remains above it.
- Cover band remains the lowest layer.
- Karaoke presets preserve original karaoke timing and disable glow; glow presets disable karaoke preservation and use deterministic P3 timed-SRT rendering.

## Source scope from Rev3 start
- new `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-STYLE-ENGINE-REV3.md`
- new `src/renderer/js/pipeline3/subtitle-style-engine.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline1-run-config.js` — one import-only bootstrap line.

No backend, P2, TTS, dependency, finalizer or render-controller change in Rev3.

## PM review corrections before Owner test
- default style state is `custom` instead of falsely claiming the old YouTube preset matches a Rev3 catalog item;
- manual edits clear preset selection;
- letter-spacing preview respects fitted logical-canvas scale;
- glow is not injected into unknown original karaoke ASS timing structures.

## Gates
- Execution: PASS.
- Automated verification: WAITING exact-checkout `node --check` + `git diff --check`.
- Code review: PASS logic/scope.
- Owner runtime: WAITING Rev3.
- Documentation synchronization: PASS pre-runtime after PR/ACTIVE sync.
- Merge: BLOCKED.

## Local safety
Reuse only the existing clean test directory. Dirty => STOP; no reset/restore/clean and no new clone/worktree.

## Next permitted action
Finish Rev3 dynamic-doc/PR synchronization, verify current PR exact head/checks/comments, then Owner may test the exact head. No merge.
