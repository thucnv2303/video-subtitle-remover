# AgentOS Handoff Status

## Active task
`STANDALONE-SUBTITLE-REMOVER-010`

## Status
REV2 SOURCE PUBLISHED / PM REVIEW PASS / OWNER RUNTIME READY / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59
- Runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`
- Rev2 application-source HEAD: `c64a209cb7fd556a95f3716b496472c92862a66c`

## Owner FAIL addressed
Rev1 incorrectly retained the P1-gated P2 input model. Rev2 makes the sidebar `Xóa Sub` tool independently accept one or many videos while continuing to reuse the existing P2 controller/backend.

## Rev2 behavior
- `+ Thêm Video` supports Electron multi-selection.
- Drag/drop accepts multiple supported video files.
- Standalone jobs are P2-ready without P1 artifacts.
- `Chạy tất cả` queues standalone jobs through existing P2 `processNextJob`.
- Existing `outputPath` contract creates `<source>_no_sub.mp4` in selected output dir or source dir.
- Standalone jobs stay P3 locked and are filtered from normal P1/P3 views.
- Normal Home pipeline retains P1→P2 gating.
- Manual per-region mask and coordinate behavior continue to use P2 runtime implementation.

## Evidence
- Rev2 exact GitHub source and PR patches reviewed by PM.
- PR #59 is Draft/open/unmerged.
- Branch Actions runs: none.
- New Rev2 executable static evidence remains WAITING because PM container DNS could not reach GitHub raw host. Do not reinterpret the older Rev1 static run as Rev2 evidence.

## Owner QA now permitted
Run the exact review branch. Verify multi-select upload, multi-file drop, selected-job P2 run, `Chạy tất cả`, `_no_sub.mp4`, manual multi-region masks/geometry, and Home/Voice Render regression smoke.

## Gates
- Execution: PASS.
- Automated/static: WAITING Rev2 evidence.
- PM code review: PASS.
- Owner manual verification: READY / NOT STARTED.
- Documentation synchronization: PASS after docs sequence.
- Merge permission: BLOCKED.

## Next permitted action
Owner runs app from exact review branch and reports observed PASS/FAIL. Do not merge.