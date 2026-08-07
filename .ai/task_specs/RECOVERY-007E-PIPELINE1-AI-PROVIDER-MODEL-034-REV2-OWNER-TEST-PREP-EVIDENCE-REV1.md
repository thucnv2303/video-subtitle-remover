# PM Execution Spec

## Task
RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-OWNER-TEST-PREP-EVIDENCE-REV1

## Status
AUTHORIZED_FOR_EXECUTION

## Objective
Close the evidence gap in the already-performed Owner-test environment preparation. Do not rebuild the worktree, do not modify source/tests/canonical project state, and do not rerun product verification. Capture raw read-only evidence that ties the isolated Owner-test environment to the reviewed source SHA before Owner testing is permitted.

## Reviewed basis
Repository: `thucnv2303/video-subtitle-remover`

PR: `#14`

Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

PR HEAD before this evidence spec: `0143ea3ed56f726e836c70a3612caa96a98e626a`

Reviewed source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`

Claimed isolated path: `E:\Project AI\_owner_test\034-rev2`

Product task remains: `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`

Owner status remains: `WAITING`

Merge remains: `BLOCKED`

## Why this REV exists
The previous prep report supplied summarized values but did not include the raw command outputs needed for PM to independently verify the local-only worktree identity and cleanliness. Executor summary alone is not sufficient evidence.

This REV is evidence capture only. The previously prepared environment must not be altered merely to make the evidence look clean.

## Allowed actions
Read-only inspection only.

From the repository/worktree, capture the raw outputs of the following commands exactly.

### A. Registered worktree identity
Run from any valid repository worktree:

```powershell
git worktree list --porcelain
```

The raw output must contain an entry for:

`E:\Project AI\_owner_test\034-rev2`

and that entry must be tied to commit:

`ea9521f6fe957e24e49cc5d090e275511d91141d`

### B. Isolated worktree path and exact HEAD
Run:

```powershell
Set-Location "E:\Project AI\_owner_test\034-rev2"
$PWD.Path
git rev-parse HEAD
```

Expected:

- path = `E:\Project AI\_owner_test\034-rev2`
- HEAD = `ea9521f6fe957e24e49cc5d090e275511d91141d`

### C. Isolated tracked-tree cleanliness
Run from the isolated worktree:

```powershell
git status --short
git diff --name-only
git diff --cached --name-only
```

Expected:

- all three outputs empty for tracked changes;
- ignored dependency junction does not count as a tracked modification.

### D. Dependency reuse proof
Run:

```powershell
Get-Item .\node_modules | Format-List FullName,LinkType,Target
```

Expected if the previously reported junction is in use:

- `FullName` is inside the isolated worktree;
- `LinkType` identifies a junction/link;
- `Target` points to the existing dependency directory under `E:\Project AI\Video-sub-remove\node_modules`.

Do not create, recreate, remove, or modify the junction during this evidence task.

### E. No repository mutation
Run:

```powershell
git status --short
```

again at the end and return the raw output.

## App launch evidence handling
Do not relaunch the application only for evidence if it is already running from the prepared environment. The prior execution trace already records that `npm start` was invoked after the isolated worktree setup. This REV exists only to prove exact worktree identity/cleanliness and dependency reuse.

If the app is no longer running, report `APP NO LONGER RUNNING`; do not modify source or install dependencies. PM will decide whether relaunch is needed.

## Forbidden
Do not:

- modify application source;
- modify tests;
- edit canonical `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`, QA, bugs, architecture, or API contracts;
- edit PM execution specs;
- edit `.ai/task_specs/ACTIVE.md`;
- create/remove/recreate the worktree unless explicitly authorized later;
- create/remove/recreate the dependency junction;
- checkout/switch/reset/restore/clean the main tree;
- run `git add .` or `git add -A`;
- commit;
- push;
- install/update dependencies;
- merge;
- run Owner product verification yourself.

## Acceptance criteria
PASS only if raw outputs prove all of the following:

1. The registered worktree path is exactly `E:\Project AI\_owner_test\034-rev2`.
2. The registered worktree commit is exactly `ea9521f6fe957e24e49cc5d090e275511d91141d`.
3. `$PWD.Path` confirms commands were run inside that isolated worktree.
4. `git rev-parse HEAD` exactly equals the reviewed source SHA.
5. `git status --short`, `git diff --name-only`, and `git diff --cached --name-only` show no tracked changes.
6. Dependency reuse is local-only and points to the existing dependency directory; no install/update occurred.
7. No source/docs commit or push is created.
8. Merge remains BLOCKED.

## Stop conditions
`STOP — WORKTREE IDENTITY MISMATCH` if registered path/HEAD differs.

`STOP — ISOLATED TREE DIRTY` if tracked changes are present.

`STOP — DEPENDENCY REUSE MISMATCH` if the junction/link points somewhere other than the previously reported existing dependency directory.

`STOP — SPEC CONFLICT` if GitHub product task/source identity has changed.

## Required final report
Return the raw command outputs, not only a summary, in this order:

1. `git worktree list --porcelain`
2. `$PWD.Path`
3. `git rev-parse HEAD`
4. `git status --short`
5. `git diff --name-only`
6. `git diff --cached --name-only`
7. `Get-Item .\node_modules | Format-List FullName,LinkType,Target`
8. final `git status --short`
9. App currently running: YES/NO
10. Files changed: NONE
11. Commits created: NONE
12. Push performed: NO
13. Merge: BLOCKED

Do not replace empty command output with a claimed word such as `clean`; explicitly mark it as `[empty output]` immediately after the command.

## Merge permission
BLOCKED.
