# Current State

## Status
WAITING_OWNER_UI_RETEST — PIPELINE1-APPROVED-UI-001

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

Requested corrections:
1. Remove duplicate `Pipeline 1` item from the left sidebar.
2. Remove add-file/drop UI from Job Queue (#3); file addition belongs in Actions (#5), while Job selection must be explicit.
3. Expand Console / Log (#6) vertically.
4. Remove per-job delete/action controls and make fullscreen layout consume available width.
5. Keep the `Bắt đầu chạy` processing-flow defect separate and deferred until UI acceptance.

## Revised implementation
- UI correction commit: `d4c21c7a2553f788e656afa6abb42687920071a6`.
- Responsive CSS correction commit: `e99f7042387e82552cd4616536d2d6fea12ebf6f`.
- Pipeline 1 JS blob: `d7199ee277a3b791d29c385b5b90736d92c68554`.
- Pipeline 1 CSS blob: `7686bb48cc47336e6602a07c635958c333dec118`.
- No extra Pipeline 1 sidebar item is injected.
- Job Queue is now a selectable list and no longer contains add-file/drop UI.
- Per-job legacy controls are not rendered in the revised Job row.
- Selected Job has a visible selection indicator while preserving existing `pipeline1SelectedJobId` state behavior.
- Actions (#5) is the single add/delete/run action zone.
- Console / Log flexes into remaining right-column height.
- Fixed 1500px content caps were removed; workspace expands with the viewport.
- Start-flow processing logic was intentionally not modified.

## Verification
- Exact reconstructed JS hash equals GitHub blob `d7199ee277a3b791d29c385b5b90736d92c68554`.
- `node --check` on that exact JS blob: PASS.
- Static assertions: no Pipeline 1 sidebar injection, no Job Queue drop area, no per-job delete control, one Actions add button, and explicit Job selection indicator: PASS.
- GitHub compare from canonical base shows product source remains exactly `src/renderer/js/pipeline.js` plus `src/renderer/styles/pipeline1-approved.css`; other changes are canonical `.ai` task/bug documentation.
- PM code review of revised UI source: PASS for Owner UI retest.
- GitHub CI: not configured.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for revised UI source.
- Code review: PASS for revised UI source.
- Owner manual app verification: FIRST CANDIDATE FAIL; REVISED UI RETEST AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
