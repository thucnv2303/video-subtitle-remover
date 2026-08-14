# Current Task

## Task ID
PIPELINE3-FINAL-COMPOSITION-017

## Status
SUBTITLE_TYPOGRAPHY_REV2_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_WAITING

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Rev2 starting HEAD: `e906c5dcef863b6dc0183a1ce9c4a70845b3f46e`.
- Rev2 reviewed source head: `112fd48b29fe6c16a2e4b85488fd154fd3724e1a`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-TYPOGRAPHY-REV2.md`.

## User outcome
Deepen P3 subtitle styling without broadening into a general video editor:
- richer font selection;
- custom installed font-family entry;
- quick typography styles;
- visible current-font sample;
- retain resize handles, effects, position drag, cover band, cue edit, fit planner and final render behavior.

## Rev2 implementation
### Font library
Grouped practical families:
- Segoe UI, Arial, Tahoma, Verdana, Trebuchet MS, Calibri, Aptos, Nirmala UI;
- Arial Black, Impact;
- Georgia, Times New Roman, Cambria, Constantia;
- Consolas, Courier New;
- Roboto, Inter, Be Vietnam Pro, Montserrat, Poppins, Oswald when installed.

No font file is bundled or downloaded.

### Custom installed font
- text input accepts a family name already installed on the machine;
- Apply adds/selects it in the session selector;
- blank values are ignored;
- it writes through the existing per-Job `fontFamily` input path, so final ASS uses the same family property.

### Quick typography styles
- Clean UI;
- Heavy Caption;
- Impact;
- Serif Guide;
- Mono Tech;
- Soft Tutorial.

They only alter existing renderable P3 properties: font family/size, bold/italic, outline, shadow, text/background colors.

### Preview feedback
- sample string `Aa ĂÂĐ ÊÔƠƯ 0123` uses current selected family;
- current family name is shown;
- Job/preset/input changes resync the sample.

## Source scope
Rev2 source change only:
- `src/renderer/js/pipeline3/subtitle-resize-effects.js`.

No backend/P1/P2/TTS/dependency/finalizer change.

## Required exact-checkout verification
```text
node --check src/renderer/js/pipeline3/subtitle-resize-effects.js
git diff --check e906c5dcef863b6dc0183a1ce9c4a70845b3f46e..HEAD
```

## Owner runtime acceptance
1. Reuse existing test directory only; exact HEAD must match PR #58.
2. Choose Segoe UI, Georgia, Consolas, Impact; active subtitle and sample should visibly change where the font exists.
3. Apply one known installed custom font; verify preview and short final burn.
4. Test all six quick typography styles.
5. Switch between two Jobs with different fonts and verify per-Job isolation.
6. Recheck left/right width resize and one subtitle effect.
7. Final render must preserve chosen font where libass can resolve that installed family.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: WAITING for Rev2.
- Documentation synchronization: PASS pre-runtime after PR synchronization.
- Merge: BLOCKED.

## Next action
Reverify PR #58 current exact head/files/checks/comments, then Owner tests exact head. No merge.
