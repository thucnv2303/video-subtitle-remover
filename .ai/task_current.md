# Current Task

## Task ID
STANDALONE-SUBTITLE-REMOVER-010

## Status
REV2_SOURCE_PUBLISHED_OWNER_RUNTIME_READY_MERGE_BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Rev2 application-source HEAD: `c64a209cb7fd556a95f3716b496472c92862a66c`.

## User outcome
`Xóa Sub` is a standalone P2 tool below Voice Render: direct one/many-video input, independent queue, existing P2 engine, no P1/P3 requirement.

## Rev2 implementation
- Independent `+ Thêm Video` using existing Electron multi-selection dialog.
- Multiple-file drag/drop.
- Standalone job marker `standaloneSubtitleRemoval` with direct P2 ready state.
- Existing P2 output contract and `_no_sub.mp4` path preserved.
- `Chạy tất cả` queues all standalone-ready/error jobs through existing `processNextJob`.
- Normal Home P1→P2 gate remains separate.
- Standalone jobs remain P3 locked and are filtered out of P1/P3 UI.
- Existing manual region geometry and per-region Box/Tight/Soft remain reused.

## Verification
- PM exact GitHub source/diff review: PASS for Rev2 logic/scope.
- PR #59: Draft/open/unmerged.
- New Rev2 executable static evidence: WAITING because PM runtime cannot resolve GitHub raw host and branch has no Actions run.
- Owner runtime is permitted to provide the missing real-app evidence; no merge permission is implied.

## Owner QA
1. Fetch exact review branch and start app.
2. Open `Xóa Sub`; verify no P1 completion is required.
3. `+ Thêm Video`: select 2+ videos in one dialog; all appear as standalone jobs.
4. Drag/drop 2+ videos; valid videos are added and duplicates are not duplicated.
5. Select one job and run; verify existing P2 processing/output `_no_sub.mp4`.
6. Add multiple jobs and use `Chạy tất cả`; verify sequential queue processing.
7. Manual mode: draw multiple regions continuously, geometry aligned, assign different Box/Tight/Soft masks.
8. Return Home; standalone jobs must not appear as P1/P3-ready pipeline jobs.
9. Smoke Voice Render and normal pipeline navigation.

## Gates
- Execution: PASS.
- Automated/static: WAITING Rev2 evidence.
- PM code review: PASS.
- Owner manual verification: READY / NOT STARTED.
- Documentation synchronization: PASS after docs sequence.
- Merge permission: BLOCKED.

## Next action
Owner runs exact Rev2 checkout and reports observed PASS/FAIL. Do not merge.