# PIPELINE3-FINAL-COMPOSITION-017 — Subtitle Style Engine Rev3

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Exact starting HEAD: `e2b8af05a4ea0baefa164534598cc25668110feb`
- Parent task: `PIPELINE3-FINAL-COMPOSITION-017`
- Owner approved the CapCut-inspired direction: one strong subtitle engine + a large data-driven style catalog + deeper controls, while keeping P3 focused on final composition rather than becoming a general NLE.

## Product outcome
Replace the feeling of a small set of hand-written subtitle options with a reusable `Subtitle Style Engine V1`:
- large visual style library;
- category filtering;
- one-click style application;
- advanced render-backed typography controls;
- preview/final ASS parity;
- no copyrighted CapCut assets/templates copied into the repository.

The useful CapCut pattern is the interaction model and preset-library architecture, not cloning proprietary presets or motion assets.

## Style library V1
Create a data-driven catalog of at least 32 presets grouped into:
- Basic
- Social
- Tutorial
- Karaoke
- Highlight
- Glow
- Box
- Cover

Each preset is a pure configuration object. Adding another style should normally require adding data, not another event handler or renderer branch.

Representative styles:
- Clean White / Clean Dark / Minimal / Bold Outline
- YouTube Bold / TikTok Pop / Shorts Blue / Creator Yellow
- Tutorial Clean / Tutorial Box / Tech Blue / Step Guide
- Karaoke Gold / Karaoke Cyan / Karaoke Pink / Karaoke Lime
- Highlight Yellow / Highlight Cyan / Highlight Pink / High Contrast
- Neon Blue / Neon Pink / Neon Lime / Electric White
- Box Dark / Box Light / Capsule Blue / Capsule Red
- Cover Dark / Cover Soft / Cover Blue / Cover Red

## UI
Inside existing `Phụ đề` inspector:
- visual style-library section appears before detailed controls;
- category chips filter the catalog;
- 2-column compact cards with a styled `Aa` preview and style name;
- selected style is visibly marked;
- legacy five preset buttons are hidden from primary UX but their existing code remains for compatibility;
- existing Rev2 font tools remain available below the style library.

Do not expand P3 into a full-screen template marketplace.

## New render-backed typography properties
Extend per-Job `p3Config` with:
- `stylePresetId`
- `underline` boolean
- `letterSpacing` ASS/script pixels, bounded `-2..12`
- `textOpacity` percent `20..100`
- `glowEnabled` boolean
- `glowColor`
- `glowBlur` bounded `0..8`
- `glowOutline` bounded `0..8`

These controls live in a compact advanced-style subsection. Do not add numeric font-weight, arbitrary 3D, particles, stickers or other preview-only features.

## Preview contract
- underline -> CSS text decoration;
- letter spacing -> scaled to current fitted logical canvas;
- text opacity -> text fill alpha, not whole subtitle-container opacity;
- glow -> preview text-shadow using configured glow color/blur while retaining the existing drop shadow;
- main font/size/colors/background/position/width continue through current editor controls;
- style-library click applies config through the same per-Job control path and updates preview immediately.

## Final ASS contract
Use libass-supported fields/tags only:
- `Underline` style field;
- `Spacing` style field;
- primary color alpha for text opacity;
- Glow implemented as a separate lower text layer using the same cue timing/position/effect with configurable blur/outline;
- Cover band remains layer 0;
- Glow layer is below main text;
- main P3 text remains top text layer.

Karaoke safety:
- Karaoke catalog presets preserve P1 karaoke timing and must not require the new glow layer.
- Glow presets explicitly disable `preserveKaraoke` so the deterministic P3 timed-SRT renderer is used instead of attempting to mutate unknown karaoke ASS structures.
- Existing karaoke path should still accept underline/spacing/text opacity through its style replacement.

## Source scope
Allowed application source:
- new `src/renderer/js/pipeline3/subtitle-style-engine.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline1-run-config.js` — one import-only bootstrap line

No P1 execution logic, P2, backend, TTS, dependencies, finalizer or render-controller changes.

## Safety / non-goals
- no font file redistribution/download;
- no CapCut proprietary assets/names copied as templates;
- no particle/3D/motion-graphics engine;
- no broad editor rewrite;
- no new local clone/worktree/test directory;
- existing cover band, cue edit, voice/video fit and re-render safety must remain unchanged.

## Acceptance
1. At least 32 style cards are visible through category filters.
2. Style card click changes current Job subtitle and selected-card state immediately.
3. Two Jobs can keep different style presets/configs.
4. Underline, spacing, opacity and glow controls update preview and derived ASS.
5. Glow final ASS is a lower subtitle layer, not a preview-only CSS effect.
6. Karaoke presets preserve karaoke timing; glow presets do not silently corrupt original karaoke ASS.
7. Legacy width resize, position drag, cover band, cue edit, effects and render continue to work.
8. No backend or dependency source changes.

## Required static verification
```text
node --check src/renderer/js/pipeline3/subtitle-style-engine.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check e2b8af05a4ea0baefa164534598cc25668110feb..HEAD
```

## Owner runtime focus
- browse every category and apply at least one style from each;
- verify Job A/B retain different styles;
- test underline, spacing, opacity and Neon Blue/Pink glow;
- resize subtitle width and drag position after applying a style;
- render one short non-karaoke glow style and one karaoke preset if a karaoke artifact is available;
- verify preview/final style is acceptably close and cover-band/cue editing still function.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING after source publication.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL until source review/docs closeout.
- Merge: BLOCKED.
