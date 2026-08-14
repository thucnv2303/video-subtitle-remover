# Current State

## Status
PIPELINE3-FINAL-COMPOSITION-017 — SUBTITLE TYPOGRAPHY REV2 SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Subtitle UX Rev1 docs head before Rev2: `e906c5dcef863b6dc0183a1ce9c4a70845b3f46e`.
- Subtitle Typography Rev2 reviewed application-source head: `112fd48b29fe6c16a2e4b85488fd154fd3724e1a`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Rev1 amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-UX-REV1.md`.
- Rev2 amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-TYPOGRAPHY-REV2.md`.

## Owner direction — 2026-08-14
Continue deepening subtitle authoring, especially font/typography controls, while keeping P3 focused on final composition rather than becoming a general NLE.

## Subtitle UX already present
- direct horizontal subtitle-frame resize with left/right handles;
- width-aware non-karaoke ASS wrapping;
- subtitle position drag;
- cover band for residual old-subtitle blemishes;
- cue edit;
- expanded effects: slide, zoom, pulse, blur-in, fade+slide plus fade/pop;
- voice/video fit and final render remain unchanged.

## Reviewed Typography Rev2 source
Rev2 application delta is intentionally limited to:
- `src/renderer/js/pipeline3/subtitle-resize-effects.js`.

The accompanying spec is `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-TYPOGRAPHY-REV2.md`.

No backend, P1/P2, TTS, dependency or P3 finalizer source is changed by Rev2.

## Verified Typography Rev2 behavior from source
- font selector is expanded into practical groups: Vietnamese/system-safe, display, serif, mono and common optional installed fonts;
- no font files are bundled or downloaded;
- custom installed font-family name can be entered and applied to the same per-Job `fontFamily` property used by final ASS;
- quick typography styles are available: Clean UI, Heavy Caption, Impact, Serif Guide, Mono Tech, Soft Tutorial;
- quick styles only modify existing renderable properties such as family, size, bold/italic, outline, shadow, text/background color;
- compact sample `Aa ĂÂĐ ÊÔƠƯ 0123` shows current family in the inspector;
- typography sample/current-family state re-syncs after Job selection, normal P3 presets and typography control changes;
- existing resize/effect/position logic remains in the same enhancer and no new polling loop is introduced.

## Known limitation
The font selector can reference fonts installed on the Owner machine, but preview availability does not prove FFmpeg/libass will resolve the same family. Final font acceptance therefore requires one short real render. No numeric font-weight control is exposed because no verified render contract exists for it yet.

## Verification status
- Execution: PASS.
- PM source/code review: PASS logic/scope.
- Exact checkout Node syntax + `git diff --check`: WAITING.
- GitHub CI/status: WAITING; absence of checks is not PASS.
- Owner runtime verification for Typography Rev2: WAITING.
- Documentation synchronization: PASS pre-runtime after dynamic docs/PR sync.
- Merge permission: BLOCKED.

## Next permitted action
Reverify live PR #58 exact final head/status/checks/comments. Then Owner may reuse the existing clean test directory and test font groups, custom installed font, quick typography styles, width resize and one final short render. No merge.
