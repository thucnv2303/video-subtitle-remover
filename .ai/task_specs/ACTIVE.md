# Active PM Execution Spec

Status: PIPELINE1_PROMPT_MANAGER_V2_010_SOURCE_PUBLISHED_OWNER_VERIFICATION_PENDING

Task: `PIPELINE1-PROMPT-MANAGER-V2-010`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-PROMPT-MANAGER-V2-010` / #53
Task spec: `.ai/task_specs/PIPELINE1-PROMPT-MANAGER-V2-010.md`
Application-source head before docs sync: `2d4fc7e05f71a38daa406647226e883bd7ed69f8`
Bug: `BUG-040`

## Current authority
Task 010 source is published. No additional application-source modification is authorized unless static review or Owner runtime produces a concrete failure.

Authorized final application files:
- `src/renderer/js/components/prompt-manager.js`
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/styles/prompt-manager-v2.css`

## Required verification
On exact latest PR #53 HEAD:
```text
node --check src/renderer/js/components/prompt-manager.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

Then Owner runtime acceptance:
- approved dark navy / blue V2 UI;
- CRUD + reorder persist through close/reopen/restart;
- any prompt including seed/default can be deleted;
- delete-all remains `[]` after full restart and old data never resurrects;
- active/default state is consistent across modal, Step 1 and dropdown;
- empty list leaves no phantom prompt and P1 fails closed until a valid prompt is created/selected.

## Paused task
`PIPELINE1-LOG-OBSERVABILITY-009` / PR #52 is PAUSED by Owner sequencing decision. Do not modify, merge, or use it as the base for task 010.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS logic/scope.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL until result intake closes bug/QA state.
- Merge permission: BLOCKED.
