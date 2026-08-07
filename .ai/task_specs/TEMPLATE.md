# Execution Spec — <TASK-ID>

Document status: DRAFT | ACTIVE | SUPERSEDED | COMPLETED
Author: Project Manager / Technical Reviewer
Executor: Anti

## 1. Identity

Task ID: `<TASK-ID>`
Repository: `E:\Project AI\Video-sub-remove`
Review branch: `<branch>`
Expected starting HEAD: `<full SHA>`
PR: `<number/url if applicable>`
Reviewed source SHA: `<full SHA if applicable>`

## 2. Objective

State one bounded objective. Do not combine unrelated fixes.

## 3. Evidence basis

List the exact GitHub files, commits, PR diff, tests, owner observations, or incident evidence used by PM to define this task.

## 4. Findings to correct

### Finding 1

File: `<path>`
Symbol/section: `<function/section>`

Current behavior/text:

```text
<exact current behavior/text when known>
```

Required behavior/text:

```text
<exact replacement or outcome>
```

Reason:
`<why this is required>`

Repeat for each verified finding.

## 5. Required implementation

Give implementation-level direction. Prefer exact code/data contracts where appropriate.

Example:

```text
preferredModel =
  valid(job.aiModel)
  ?? valid(savedProviderModel)
  ?? models[0]
```

For a simple text/state correction, provide exact before/after text instead of prose.

## 6. Allowed scope

Allowed source files:
- `<path>`

Allowed knowledge/evidence files:
- `<path>`

Allowed symbols/sections when scope needs to be narrower:
- `<symbol>`

## 7. Forbidden scope/actions

- No unrelated refactor.
- No Pipeline 2 changes unless explicitly listed.
- No `git add .`.
- No `git add -A`.
- No reset/checkout/restore/clean.
- No amend/rebase/force push.
- No merge.
- No wildcard deletion.
- No rewriting this execution spec by Anti.

Add task-specific forbidden actions here.

## 8. Automated verification

Run exactly:

```text
<command 1>
<command 2>
git diff --check
```

Expected:
- command 1: EXIT 0, `<exact counts/result>`
- command 2: EXIT 0, `<exact counts/result>`

## 9. Machine-checkable acceptance criteria

- [ ] Exact changed-file list matches allowed scope.
- [ ] `<git grep/assertion>` returns expected result.
- [ ] `<production-path behavior>` verified by approved automated test.
- [ ] No required assertion is NOT TESTED unless this spec explicitly permits it.
- [ ] `git diff --check` exits 0.

## 10. Canonical knowledge update

Update affected canonical files. At minimum when task state changes:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

Also update decisions/bugs/architecture/QA/API contracts when affected.

Required final gate values:

```text
Execution: <...>
Automated verification: <...>
Code review: WAITING_PM_REVIEW
Owner manual app verification: WAITING/NOT STARTED
Documentation synchronization: <...>
Merge permission: BLOCKED
```

## 11. Git delivery

- Stage only approved files/hunks.
- Inspect `git diff --cached` before every commit.
- Separate source/tests from documentation/evidence commits unless this is explicitly a docs-only task.
- Push only by normal fast-forward to the approved review branch.
- Update/open the Draft PR with exact SHAs and test results.

## 12. Stop conditions

STOP without improvising when any of these occur:

- `SPEC BASE MOVED` — actual branch/HEAD changed in a way that invalidates PM review basis.
- `SPEC SCOPE INSUFFICIENT` — required fix needs a file/symbol not allowed here.
- `CANNOT ISOLATE REVIEW DIFF SAFELY` — task hunks cannot be separated from unrelated dirty work.
- Required verification fails.
- An incident/unsafe operation is discovered.

## 13. Final report required from Anti

Return:

- starting HEAD;
- source commit SHA (if any);
- docs/evidence commit SHA;
- final remote HEAD;
- exact changed files per commit;
- exact verification commands/results/exit codes;
- machine-checkable acceptance results;
- known warnings/limitations;
- canonical gate statuses;
- PR status/body confirmation;
- Owner status;
- Merge BLOCKED.
