# AgentOS Project Protocol

## Mandatory startup

Before planning, editing, running patch scripts, or changing source code:

1. Read `.ai/rules.md`.
2. Read `.ai/project.md`.
3. Read `.ai/architecture.md`.
4. Read `.ai/migration_status.md`.
5. Read `.ai/current_state.md`.
6. Read `.ai/decisions.md`.
7. Read `.ai/bugs.md`.
8. Read `.ai/task_current.md`.
9. Read `.ai/qa_checklist.md`.
10. Read `.ai/handoff.md`.

Before editing, return:

CONTEXT LOADED
- Current branch:
- Current task:
- Current architecture:
- Known bugs:
- Allowed files:
- Forbidden changes:
- Expected changed files:
- Verification plan:

Do not edit source until this context summary has been produced.

## Execution rules

- Work on one narrowly scoped task only.
- Do not broaden scope.
- Do not refactor unrelated code.
- Do not run `patch_*.py`, `fix_*.py`, or files under `scratch/` without explicit approval.
- Do not install or upgrade dependencies without approval.
- Do not push or merge `main` or `dev`.
- Do not replace a working module without runtime evidence.
- Do not claim completion from code inspection alone.

## Owner Manual Verification Gate (OWNER CONFIRMED)

The project owner is the mandatory final manual app tester. For every source-code task:
- Anti completes implementation and automated verification;
- Project manager reviews scope and diff;
- Owner runs the real application;
- Owner reports PASS or FAIL;
- Merge remains blocked until owner reports PASS.

Reports must include:
Automated verification:
Code review:
Owner manual app verification: [Default: WAITING]
Merge permission: [Default: BLOCKED]

## Mandatory completion

Before the final response, update:

- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/bugs.md` when a bug is found or resolved
- `.ai/decisions.md` when an architectural decision changes
- `.ai/architecture.md` when module ownership or data flow changes
- `.ai/migration_status.md` when migration progress changes

Final report must contain:

STATUS: PASS / NEEDS_REVISION / WAITING

- Changed files:
- Diff summary:
- Tests executed:
- Manual verification:
- Known regressions:
- Memory files updated:
- Branch:
- Commit SHA:
- Next recommended task:

A task is not complete when required memory files were not updated.
