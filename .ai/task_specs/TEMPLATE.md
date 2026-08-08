# Execution Spec — <TASK-ID>

Document status: DRAFT | ACTIVE | SUPERSEDED | COMPLETED
Author: Project Manager / Technical Reviewer
Executor: Anti

## 0. Hard execution contract

Authority:
- Fetch origin first.
- Read `ACTIVE.md` directly from `origin/<review-branch>:.ai/task_specs/ACTIVE.md` using `git show`.
- Read this exact spec from the same remote ref using `git show`.
- Local ACTIVE/spec copies are not authority.

Allowed commands/actions:
- `<exact whitelist or narrowly defined command classes>`

Allowed files:
- `<exact paths>`

On any unexpected error, failed edit, failed assertion, moved base, dirty state, or command not explicitly authorized:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

Do not invent alternative scripts or recovery commands.

Pre-push hard gate:
- exact changed-file set matches scope;
- no forbidden path changed/staged;
- `git diff --check` PASS;
- remote HEAD still equals expected HEAD;
- required tests PASS;
- diff size/numstat remains within approved scope;
- normal fast-forward push only.

## 1. Identity

Task ID: `<TASK-ID>`
Repository: `E:\Project AI\Video-sub-remove`
Review branch: `<branch>`
Expected starting remote HEAD: `<full SHA>`
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

For deterministic text/state edits, prefer an exact PM-authored patch or exact before/after delta. If the exact patch does not apply, STOP and report; do not redesign it locally.

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

## 7. Allowed command whitelist

List all commands or command classes Anti may use for this task.

Example:

```text
git fetch origin
git show origin/<branch>:<path>
git rev-parse origin/<branch>
git status --short
git diff -- <approved paths>
git diff --check
git add <explicit approved paths>
git diff --cached --name-only
git commit -m "<exact message>"
git push origin HEAD:<review-branch>
```

Any required command outside this whitelist causes:

`STOP — COMMAND NOT AUTHORIZED`

## 8. Forbidden scope/actions

Unless this spec explicitly and narrowly authorizes an exception:

- No unrelated refactor.
- No Pipeline 2 changes unless explicitly listed.
- No `git add .`.
- No `git add -A`.
- No reset/checkout/restore/clean.
- No revert unless explicitly authorized by an incident spec.
- No amend/rebase/history rewrite.
- No force push.
- No wildcard deletion.
- No wildcard rewrite scripts.
- No CRLF/LF conversion.
- No whole-file formatter/rewriter for narrow documentation edits.
- No rewriting this execution spec by Anti.
- No self-repair after an unexpected error.
- No merge.

Add task-specific forbidden actions here.

## 9. Automated verification

Run exactly:

```text
<command 1>
<command 2>
git diff --check
```

Expected:
- command 1: EXIT 0, `<exact counts/result>`
- command 2: EXIT 0, `<exact counts/result>`

## 10. Machine-checkable acceptance criteria

- [ ] Exact changed-file list matches allowed scope.
- [ ] `<git grep/assertion>` returns expected result.
- [ ] `<production-path behavior>` verified by approved automated test.
- [ ] No required assertion is NOT TESTED unless this spec explicitly permits it.
- [ ] `git diff --check` exits 0.
- [ ] Remote HEAD still equals the expected starting HEAD immediately before commit/push.
- [ ] Narrow documentation diff stays under explicit numstat/size thresholds where specified.
- [ ] No forbidden command/action was used.

## 11. Canonical knowledge update

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

For deterministic governance/spec/knowledge-only corrections, PM may publish directly through the GitHub API when explicitly chosen as the safer path; application source remains outside that exception.

## 12. Pre-push hard gate

Before any push, prove all of the following:

```text
EXPECTED_CHANGED_FILES == ACTUAL_CHANGED_FILES
FORBIDDEN_CHANGED_FILES == NONE
DIFF_CHECK == PASS
REMOTE_HEAD == EXPECTED_REMOTE_HEAD
REQUIRED_TESTS == PASS
DIFF_SIZE_WITHIN_APPROVED_SCOPE == PASS
```

If any condition fails:

`STOP — PUSH NOT AUTHORIZED`

For narrow docs tasks, define explicit maximum numstat or comparable scope limits when useful. Hundreds of additions/deletions caused by line-ending churn must STOP the task.

## 13. Git delivery

- Stage only approved files/hunks.
- Inspect `git diff --cached` before every commit.
- Separate source/tests from documentation/evidence commits unless this is explicitly a docs-only task.
- Push only by normal fast-forward to the approved review branch.
- Update/open the Draft PR with exact SHAs and test results.
- Never treat an executor-reported SHA as final proof; PM verifies the published GitHub SHA directly.

## 14. Stop conditions

STOP without improvising when any of these occur:

- `SPEC BASE MOVED` — actual branch/HEAD changed in a way that invalidates PM review basis.
- `SPEC SCOPE INSUFFICIENT` — required fix needs a file/symbol not allowed here.
- `COMMAND NOT AUTHORIZED` — required command/action is outside the whitelist.
- `CANNOT ISOLATE REVIEW DIFF SAFELY` — task hunks cannot be separated from unrelated dirty work.
- `PUSH NOT AUTHORIZED` — any pre-push hard gate fails.
- `PM PATCH DOES NOT APPLY` — exact PM-authored patch/delta cannot be applied to the reviewed basis.
- Required verification fails.
- An incident/unsafe operation is discovered.
- Any unexpected error would require self-repair or an unapproved alternate method.

## 15. Final report required from Anti

Return:

- remote ACTIVE/spec read: YES/NO;
- starting remote HEAD;
- source commit SHA (if any);
- docs/evidence commit SHA;
- final remote HEAD;
- exact changed files per commit;
- exact verification commands/results/exit codes;
- exact pre-push gate results;
- machine-checkable acceptance results;
- commands outside whitelist used: NONE or exact list;
- known warnings/limitations;
- canonical gate statuses;
- PR status/body confirmation;
- Owner status;
- Merge BLOCKED.
