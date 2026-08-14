# Current Task

## Task ID
PIPELINE1-PROMPT-MANAGER-V2-010

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Basis
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Review branch / Draft PR: `review/PIPELINE1-PROMPT-MANAGER-V2-010` / #53.
- Approved task spec: `.ai/task_specs/PIPELINE1-PROMPT-MANAGER-V2-010.md`.
- Application-source head before docs sync: `2d4fc7e05f71a38daa406647226e883bd7ed69f8`.
- Bug: `BUG-040`.

## Owner outcome
Complete Prompt Manager as a standalone task using the approved dark navy / blue design before returning to the log task.

## Application scope
- `src/renderer/js/components/prompt-manager.js`
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/styles/prompt-manager-v2.css`

## Implemented behavior
- One persisted `ai_prompts` store; saved `[]` remains empty after reopen/restart.
- First V2 migration replaces only the untouched obsolete single legacy seed; customized lists remain user data.
- Active and default IDs are reconciled only against real stored prompts.
- `ai_prompt` is compatibility mirror only.
- Any prompt can be deleted; delete-active selects a valid replacement or clears state when empty.
- Delete-all persists `[]` and clears active/default/mirror.
- Create/edit/reorder/set-default/use-active supported.
- Step 1 prompt list is dynamic from the same store, replacing hard-coded rows.
- Compatibility dropdown is driven from the same store.
- Modal is rebuilt dynamically using the approved two-column V2 UI; `index.html` remains untouched.
- P1 run config no longer resurrects stale `ai_prompt`; empty/invalid store reaches the existing prompt-required start error.

## Verification
- Source scope/isolation: PASS by GitHub compare.
- PM logic/scope review: PASS.
- Exact Node syntax checks: WAITING.
- Exact `git diff --check`: WAITING.
- Owner real-app runtime: NOT STARTED.

## Paused work
`PIPELINE1-LOG-OBSERVABILITY-009` / Draft PR #52 remains open and PAUSED by Owner direction. Do not modify/merge it while task 010 is under verification.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
