# Current Task

## Task ID
STANDALONE-SUBTITLE-REMOVER-010

## Status
REV2B_BOOTSTRAP_FIX_PUBLISHED_OWNER_RETEST_READY_MERGE_BLOCKED

## Authority
- Branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Runtime base: `92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Rev2B application-source HEAD: `df103a059cd4385e8fa031e656b41fd7dec483a3`.

## Root cause corrected
Previous Rev2 source existed but was not on the active renderer bootstrap path. Active approved P2 UI is mounted by `pipeline.js`; preload did not load the standalone helper/state gate. Rev2B adds the missing active bootstrap and adapts the actual approved P2 shell while standalone mode is active.

## Owner retest acceptance
1. Sidebar `Xóa Sub` opens standalone P2 workspace.
2. Header says standalone `Xóa Sub`, not P1-gated Pipeline 2.
3. P1 unlock badge and `Kết quả từ Pipeline 1` card are hidden.
4. `+ Thêm Video` and `Chạy tất cả` are visible.
5. Multi-select 2+ videos creates independent standalone jobs.
6. Drag/drop multiple videos works without duplicate job creation.
7. Selected job and run-all reuse existing P2 runner and output `_no_sub.mp4`.
8. Manual continuous drawing and per-region Box/Tight/Soft work.
9. Home and Voice Render remain unaffected.

## Gates
- Execution: PASS.
- Automated/static: WAITING Rev2B workflow evidence.
- PM source review: PASS.
- Owner manual verification: READY FOR RETEST.
- Documentation synchronization: PASS after docs sequence.
- Merge: BLOCKED.

## Next action
Owner fetches latest review branch and runs app. Do not merge.