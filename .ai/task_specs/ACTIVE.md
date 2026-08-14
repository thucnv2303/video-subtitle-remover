# Active PM Execution Spec

Status: PIPELINE3_FINAL_COMPOSITION_017_SUBTITLE_TYPOGRAPHY_REV2_CODE_REVIEW_PASS_STATIC_OWNER_VERIFY_WAITING

Task: `PIPELINE3-FINAL-COMPOSITION-017`
Repository: `thucnv2303/video-subtitle-remover`
Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
Rev2 starting HEAD: `e906c5dcef863b6dc0183a1ce9c4a70845b3f46e`
Reviewed Typography Rev2 source head: `112fd48b29fe6c16a2e4b85488fd154fd3724e1a`
Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`
Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-TYPOGRAPHY-REV2.md`

## Purpose
Verify the Owner-requested typography expansion without broadening P3:
- richer practical font choices;
- custom installed font family;
- quick typography styles;
- current-font sample;
- preserve existing resize/effects/final composition flow.

## Source scope for Rev2
- `src/renderer/js/pipeline3/subtitle-resize-effects.js` only.

No backend/P1/P2/TTS/dependency/finalizer change.

## Required exact-checkout verification
```text
node --check src/renderer/js/pipeline3/subtitle-resize-effects.js
git diff --check e906c5dcef863b6dc0183a1ce9c4a70845b3f46e..HEAD
```

## Owner runtime acceptance
1. Reuse existing local test directory only.
2. Exact HEAD must match current PR #58 head.
3. Font selector contains grouped system/display/serif/mono/common optional fonts.
4. Test Segoe UI, Georgia, Consolas and Impact.
5. Apply one known installed custom font family.
6. Test quick styles: Clean UI, Heavy Caption, Impact, Serif Guide, Mono Tech, Soft Tutorial.
7. Current-font sample updates immediately.
8. Switch two Jobs with different families and verify isolation.
9. Recheck width resize and one effect.
10. Render one short sample to verify final libass font resolution.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after PR body update.
- Merge: BLOCKED.

## Next permitted action
Reverify live PR #58 exact final head/files/status/checks/comments; then Owner tests exact head. No merge.
