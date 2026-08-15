# Active PM Execution Spec

Status: PIPELINE3_FINAL_COMPOSITION_017_RUNTIME_FIX_REV4_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_REVERIFY_WAITING

Task: `PIPELINE3-FINAL-COMPOSITION-017`
Repository: `thucnv2303/video-subtitle-remover`
Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
Rev4 starting HEAD: `92deaf8fa72094fbad3f84c75c716967acbc509d`
Reviewed Rev4 application-source HEAD: `d5aae15c5471f0e23f35ac3ae7cc205fc47b0fe3`
Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-RUNTIME-FIX-REV4.md`

## Purpose
Re-verify the three Owner runtime blockers after Rev4:
- right inspector clipping;
- Remove Vocal semantic failure;
- missing destination/real export-quality controls.

## Owner result for previous build
`NEEDS_REVISION` / runtime FAIL.

## Rev4 source contract
### Inspector
- no hidden horizontal inspector overflow;
- nested controls are width-contained;
- style categories wrap;
- responsive grids collapse before clipping.

### Remove Vocal
- background > 0 + Remove Vocal ON requires `method_used=demucs`;
- all weaker fallback methods block render;
- no silent original-vocal fallback is permitted.

### Export
Per Job:
- choose output directory;
- edit MP4 filename;
- exact path preview;
- quality choices: CRF20/medium, CRF18/slow, CRF16/slow, CRF14/slower;
- source resolution/FPS preserved; no resize;
- source/P2 clean video overwrite is blocked.

### Render engine
P3 uses `src/main/p3-export-bridge.js` through preload for actual FFmpeg H.264 retime/final ASS burn. Python backend routes remain unchanged.

Final ASS is rebuilt from final timed SRT immediately before burn, preserving timing after voice tempo changes. Subtitle burn failure fails the render.

## Rev4 application source
- `src/main/p3-export-bridge.js`
- `src/main/preload.js`
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/runtime-fix-rev4.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`

No backend/P1 execution/P2/TTS/dependency source change.

## Required exact-checkout verification
```text
node --check src/main/p3-export-bridge.js
node --check src/main/preload.js
node --check src/renderer/js/pipeline3/runtime-fix-rev4.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

## Owner runtime acceptance
1. Reuse existing local test directory only; exact HEAD must match PR #58.
2. Open P3 at the same window size as the failing screenshot; no right-panel setting/card may be clipped.
3. Choose a custom output folder and filename; final file must be written there.
4. Test `Cao` or `Rất cao`; render log must show the matching CRF/preset.
5. With Remove Vocal ON + background > 0: accepted run must log `method=demucs` and materially remove original vocal. Non-Demucs fallback must block.
6. Final subtitle timing/style must remain correct.
7. Re-render must still start from P2 clean video.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: FAIL previous build / WAITING Rev4.
- Documentation synchronization: PASS pre-runtime after PR body update.
- Merge: BLOCKED.

## Next permitted action
Verify live PR #58 exact final head/checks/comments, then Owner performs exact-checkout static + focused Rev4 runtime test. No merge.
