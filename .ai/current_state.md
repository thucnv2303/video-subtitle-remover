# Current State

## Status
STANDALONE-SUBTITLE-REMOVER-010 REV2 — SOURCE PUBLISHED / PM SOURCE REVIEW PASS / OWNER RUNTIME READY / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Corrected runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Rev1 owner runtime result: FAIL because Xóa Sub still required P1 provenance/input flow.
- Rev2 application-source HEAD before this docs commit: `c64a209cb7fd556a95f3716b496472c92862a66c`.

## Rev2 source behavior
- `src/renderer/js/pipeline-state.js` is mode-aware: normal Home keeps P1→P2→P3 gating; standalone jobs may enter P2 directly and never unlock P3.
- `src/renderer/js/standalone-subtitle-remover.js` provides independent `+ Thêm Video`, Electron multi-selection, multi-file drag/drop, standalone job creation, queue summary and `Chạy tất cả`.
- Standalone jobs preserve the existing P2 job contract including `filePath`, `fileName`, `outputPath`, algorithm/mask/subtitle mode and output `_no_sub.mp4` naming.
- Existing P2 runner/backend is reused; no inpaint/backend duplication.
- Region-specific Box/Tight/Soft and existing P2 coordinate mapping remain reused.

## Verification evidence
- GitHub exact source and PR patches reviewed after Rev2 publication.
- PR #59 remains Draft/open/unmerged.
- GitHub Actions currently reports no workflow run for this review branch.
- PM container could not fetch GitHub raw files because outbound DNS was unavailable, so a new executable Rev2 `node --check` result is not claimed.
- Previous static PASS belongs to Rev1 and is not reused as Rev2 proof.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING new Rev2 executable evidence.
- PM source/diff review: PASS for intended Rev2 logic/scope.
- Owner manual app verification: READY; Owner may run exact Rev2 checkout to supply runtime evidence.
- Documentation synchronization: PASS after dynamic docs sequence.
- Merge permission: BLOCKED until Owner runtime PASS is recorded and required final gates are satisfied.

## Next permitted action
Owner may fetch exact review branch and run the app for Rev2 manual QA. Do not merge.