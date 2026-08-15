# Current State

## Status
STANDALONE-SUBTITLE-REMOVER-010 REV2B — RUNTIME BOOTSTRAP FIX PUBLISHED / OWNER RETEST READY / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Rev2B application-source HEAD: `df103a059cd4385e8fa031e656b41fd7dec483a3`.

## Owner runtime evidence
Owner retest of previous Rev2 showed the same P1-gated approved P2 screen: no standalone upload/queue UI was mounted. Root cause verified on GitHub: the approved P2 shell is rendered by `src/renderer/js/pipeline.js`, while `pipeline-state.js` and `standalone-subtitle-remover.js` were not bootstrapped by the active `index.html`/preload path.

## Rev2B fix
- `src/main/preload.js` now explicitly loads `pipeline-state.js` and `standalone-subtitle-remover.js` on the active runtime path.
- Standalone helper adapts the actual approved P2 shell: hides `.p2-source-badge` and `.p2-p1-summary`, changes header/queue copy to standalone semantics, and mounts `+ Thêm Video` + `Chạy tất cả` into the actual P2 action grid.
- Standalone continues to reuse shared `window._appState`, existing P2 runner/backend, preview, manual regions and output contract.
- Main pipeline remains P1-gated outside standalone mode.

## Gates
- Execution: PASS for Rev2B publication.
- Automated/static: WAITING Rev2B workflow evidence.
- PM source review: PASS for bootstrap/root-cause correction.
- Owner manual verification: READY FOR RETEST.
- Documentation synchronization: PASS after dynamic docs sequence.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches exact latest review branch and retests `Xóa Sub`. Expected first visual proof: standalone title/copy, no P1 unlock/summary card, and visible `+ Thêm Video` / `Chạy tất cả`. Do not merge.