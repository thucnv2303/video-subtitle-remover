# Active PM Execution Spec

Status: PIPELINE1_PROMPT_MANAGER_V2_010_RUNTIME_REVISION_1_OWNER_RETEST_WAITING

Task: `PIPELINE1-PROMPT-MANAGER-V2-010`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-PROMPT-MANAGER-V2-010` / #53
Runtime-revision-1 spec/source: `6ae8fb027d8ba5fee946f8d5caa076c47ac5e53f` / `f996edb5b8614843325768c0e98b68fedf16ffc0`
Bug: `BUG-040`

## Current authority
Runtime revision 1 source is published. No further application-source change is authorized without new exact-head static/runtime evidence.

## Owner failure being retested
Prior app run starts normally but Prompt Management / Quản lý does not open. Source inspection identified a one-shot initialization dependency plus direct listeners on dynamically replaced Step 1 buttons.

## Published correction
Only `src/renderer/js/components/prompt-manager.js` changed for runtime revision 1:
- module self-init at DOM/module readiness;
- idempotent init with modal-presence guard;
- one delegated Manage/Edit/Add launcher surviving Step 1 DOM replacement;
- duplicate direct Manage/Edit/Add launch listeners removed.

GitHub compare from revision-1 spec to source: one file, +30/-4. PM code review PASS.

## Required verification
On latest PR #53 HEAD:
```text
node --check src/renderer/js/components/prompt-manager.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```
Then cold-start app and verify:
- Quản lý opens Prompt Manager V2;
- `+ Prompt mới` opens clean draft;
- if those pass, execute full CRUD/reorder/delete-all/restart/active/default/empty-store acceptance.

## Paused task
`PIPELINE1-LOG-OBSERVABILITY-009` / PR #52 remains PAUSED.

## Gates
- Execution: PASS.
- Automated/static: WAITING revision-1 retest.
- Code review: PASS.
- Owner runtime: RETEST WAITING after prior FAIL.
- Documentation synchronization: PARTIAL.
- Merge permission: BLOCKED.
