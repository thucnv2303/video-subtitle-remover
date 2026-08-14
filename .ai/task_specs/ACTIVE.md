# Active PM Execution Spec

Status: PIPELINE3_FINAL_COMPOSITION_017_CODE_REVIEW_PASS_STATIC_OWNER_VERIFY_WAITING

Task: `PIPELINE3-FINAL-COMPOSITION-017`
Repository: `thucnv2303/video-subtitle-remover`
Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
Revision starting SHA: `63cabee71f0faaf451138201da789ba0c935fc68`
Reviewed application-source head: `91678a85bc3d15838c96b96b9f4fc768059f3fec`
Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`
Backend amendment: superseded; no backend source change.

## Purpose
Deliver a focused P3 final composition tool for:
- P2 clean video + P1 voice;
- new subtitle styling/placement and residual-blemish coverage;
- cue correction;
- conservative voice/video fit;
- sufficient audio mix;
- high-quality final output without fake controls or unnecessary processing.

## Revision-017 source scope
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/editor.js`
- new `src/renderer/js/pipeline3/fit-planner.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- `src/renderer/styles/pipeline3-editor.css`

No backend/P1/P2/TTS/dependency source change in Revision 017.

## Verified invariants
- cover band is a separate ASS lower layer and shares logical subtitle position;
- cue edits are P3-derived only and persist as stable base timing for re-render;
- fit modes are bounded and fail-closed;
- auto/UI/finalizer use consistent audio-aware fit rules;
- original/background audio is never silently dropped or knowingly desynchronized;
- separated background can be retimed with the existing Electron audio-tempo bridge when video is retimed;
- P1 voice/SRT and P2 clean video remain immutable;
- second render starts from clean P2 + stable P3 cue timing;
- exact final SRT drives burn ASS when timing changed;
- source resolution/FPS remain the output geometry authority;
- no fake codec/CRF UI.

## Required exact-checkout verification
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
1. Use existing local test directory only; no new clone/worktree.
2. Test `Che vùng lem` at multiple positions and after window resize.
3. Render and confirm cover band sits behind text and hides the intended residual area.
4. Edit one cue text/start/end; final render uses it while P1 SRT stays unchanged.
5. Test Auto/near-match fit and compare UI plan to log/result.
6. Explicit video-retime + bg>0 + Remove Vocal OFF is visibly blocked.
7. Remove Vocal ON + bg>0 + valid video-retime keeps the separated bed synchronized after same-speed audio tempo.
8. Unsafe long voice is blocked.
9. Re-render after cue/style changes does not double-scale or use the previous final video as source.
10. Verify output resolution/aspect/FPS and visual quality.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact-checkout evidence.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PASS pre-runtime after this ACTIVE update and PR sync.
- Merge: BLOCKED.

## Next permitted action
Reverify live PR #58 exact final head/files/status/checks/comments. If consistent, Owner may update the existing clean test directory to that exact head and run static/runtime verification. No merge.
