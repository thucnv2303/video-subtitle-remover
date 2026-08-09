# Current State

## Status
WAITING_CODE_REVIEW_AFTER_OWNER_UI_FAIL — PIPELINE1-APPROVED-UI-001

## Canonical baseline
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`.
- Settings V1 PR #38: MERGED / Owner PASS.
- Post-Settings canonical source HEAD: `e578e48c22a79c69005f2d3373599addfc412ecf`.

## Active task
- Task: `PIPELINE1-APPROVED-UI-001`.
- Branch: `review/PIPELINE1-APPROVED-UI-001`.
- Draft PR: #39.
- Visual authority: Owner-approved Pipeline 1 demo dated 2026-08-09, including explicit `Nghe thử giọng` control.

## Owner runtime result — first P1 candidate
Owner runtime verification on 2026-08-09: NEEDS_REVISION for UI acceptance.

Verified runtime observations:
1. Remove the duplicate `Pipeline 1` item from the left sidebar; top pipeline steps already provide pipeline navigation.
2. Remove the add-file/drop zone from Job Queue (#3); `+ Thêm Video` belongs in Actions (#5). Job selection must be explicit in the queue for actions targeting the selected Job.
3. Console / Log (#6) must expand vertically to use the remaining right-column height.
4. Remove the per-job delete/action control from the far right of Job rows and eliminate large unused margins in fullscreen by making the workspace responsive.
5. Separate functional blocker: `Bắt đầu chạy` does not execute the intended Pipeline 1 flow. This remains BUG-005 and is explicitly deferred until the UI correction pass is accepted.

## Revised implementation published
- UI correction source commit: `d4c21c7a2553f788e656afa6abb42687920071a6`.
- Responsive CSS correction commit: `e99f7042387e82552cd4616536d2d6fea12ebf6f`.
- Current Pipeline 1 JS blob after UI correction: `d7199ee277a3b791d29c385b5b90736d92c68554`.
- Current Pipeline 1 CSS blob after UI correction: `7686bb48cc47336e6602a07c635958c333dec118`.
- Extra Pipeline 1 sidebar item is no longer injected.
- Job Queue now focuses on selectable jobs and directs file addition to Actions (#5).
- Per-job action/delete controls are no longer rendered by the P1 adapter.
- Selected Job receives an explicit selection indicator and existing `pipeline1SelectedJobId` behavior is preserved.
- Console / Log and the three-column workspace now use available viewport space instead of a fixed 1500px content cap.
- No processing-flow repair was included in this UI correction pass.
- Settings, Pipeline 2 and Pipeline 3 source remain unchanged.

## Gates
- Execution: PASS for UI correction publication.
- Automated/static verification: WAITING for revised exact-head verification.
- Code review: WAITING for revised source review.
- Owner manual app verification: FAIL on first candidate; RETEST NOT YET AUTHORIZED for revised candidate.
- Documentation synchronization: PASS for owner-failure/revision recording.
- Merge permission: BLOCKED.
