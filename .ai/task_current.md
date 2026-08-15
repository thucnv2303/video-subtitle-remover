# Current Task

## Task ID
PIPELINE3-FINAL-COMPOSITION-017

## Status
SUBTITLE_STYLE_ENGINE_REV3_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_WAITING

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Rev3 starting HEAD: `e2b8af05a4ea0baefa164534598cc25668110feb`.
- Rev3 reviewed application-source head: `1d3544372e0323473b3de1771464aca9cc9d9b04`.
- Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-STYLE-ENGINE-REV3.md`.

## User outcome
Make P3 subtitle authoring feel like a mature caption tool:
- large style catalog instead of a few hand-written presets;
- deep but render-backed typography controls;
- fast one-click application plus manual fine tuning;
- preview/final ASS parity;
- preserve focused final-composition scope.

## Rev3 implementation
### Catalog
32 presets / 8 categories:
- Basic
- Social
- Tutorial
- Karaoke
- Highlight
- Glow
- Box
- Cover

Preset definitions are data objects. New styles should normally be added as data instead of new renderer branches.

### New controls
- underline;
- letter spacing;
- text opacity;
- glow on/off;
- glow color;
- glow blur;
- glow outline.

Existing font library/custom font, frame-width resize, position drag, effects, cover band, cue edit and voice/video fit remain available.

### Render contract
- Underline + Spacing use ASS style fields.
- Text opacity uses ASS alpha.
- Glow is rendered as a separate lower ASS text layer.
- Main text stays above glow; cover band remains below both.
- Karaoke presets preserve original karaoke timing only when glow is disabled and timing remains valid.

## Rev3 source scope
- `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-STYLE-ENGINE-REV3.md`
- new `src/renderer/js/pipeline3/subtitle-style-engine.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline1-run-config.js` — one import-only line.

No backend/P2/TTS/finalizer/dependency changes.

## Required exact-checkout verification
```text
node --check src/renderer/js/pipeline3/subtitle-style-engine.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check e2b8af05a4ea0baefa164534598cc25668110feb..HEAD
```

## Owner runtime acceptance
1. Reuse existing clean test directory and verify exact current PR head.
2. Browse all 8 categories; apply at least one style from each.
3. Verify two Jobs can retain different styles.
4. Test underline, spacing, opacity, Neon Blue and Neon Pink glow.
5. Resize subtitle width and drag position after style changes.
6. Render one short non-karaoke glow style and compare preview vs final output.
7. If karaoke artifact exists, test one karaoke preset and confirm karaoke timing remains intact.
8. Recheck cover-band and cue-edit behavior.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after final ACTIVE/PR sync.
- Merge: BLOCKED.

## Next action
Finish handoff/ACTIVE/PR synchronization and verify live PR exact head/checks/comments. Then Owner tests the exact head. No merge.
