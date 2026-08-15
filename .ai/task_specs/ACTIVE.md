# Active PM Execution Spec

Status: PIPELINE3_FINAL_COMPOSITION_017_SUBTITLE_STYLE_ENGINE_REV3_CODE_REVIEW_PASS_STATIC_OWNER_VERIFY_WAITING

Task: `PIPELINE3-FINAL-COMPOSITION-017`
Repository: `thucnv2303/video-subtitle-remover`
Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
Rev3 starting HEAD: `e2b8af05a4ea0baefa164534598cc25668110feb`
Reviewed Rev3 application-source head: `1d3544372e0323473b3de1771464aca9cc9d9b04`
Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-STYLE-ENGINE-REV3.md`

## Purpose
Verify the CapCut-inspired P3 Subtitle Style Engine V1:
- 32 data-driven style presets across 8 categories;
- one-click style application plus existing detailed controls;
- underline / spacing / text opacity / glow;
- real ASS rendering for new properties;
- no broad NLE expansion.

## Source scope from Rev3 start
- new `src/renderer/js/pipeline3/subtitle-style-engine.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline1-run-config.js` — one import-only bootstrap line.

No backend/P2/TTS/finalizer/dependency change.

## Required exact-checkout verification
```text
node --check src/renderer/js/pipeline3/subtitle-style-engine.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check e2b8af05a4ea0baefa164534598cc25668110feb..HEAD
```

## Owner runtime acceptance
1. Reuse existing local test directory only.
2. Exact HEAD must match current PR #58 head.
3. Browse Basic/Social/Tutorial/Karaoke/Highlight/Glow/Box/Cover and apply at least one style from each.
4. Two Jobs retain different style presets/configs.
5. Test underline, letter spacing, text opacity and glow controls.
6. Test Neon Blue and Neon Pink preview, then render one short non-karaoke glow sample.
7. If karaoke ASS is available, apply one Karaoke preset and verify timing/highlight remains intact.
8. Recheck subtitle width handles, position drag, cover band and cue editing after style changes.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after PR body update.
- Merge: BLOCKED.

## Next permitted action
Reverify live PR #58 exact final head/checks/comments, then Owner tests exact head. No merge.
