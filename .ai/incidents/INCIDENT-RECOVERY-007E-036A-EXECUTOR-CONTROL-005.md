# INCIDENT-RECOVERY-007E-036A-EXECUTOR-CONTROL-005

Date: 2026-08-08
Status: EVIDENCE PUBLISHED / PRODUCT IMPLEMENTATION FROZEN

## Trigger

Executor report for:

`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

claims successful implementation and publication at PR #22 / head `dad85254cd1594f55e2ca858c1aa1855400198e2`.

The transcript itself records multiple actions forbidden by the remote positive command whitelist and STOP rules.

## Verified repository facts

- Canonical base branch remains `recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement` at `57c037ad3cfaf400f9f6a6ffd36d8449e6a16267`.
- PR #22 is CLOSED / NOT MERGED.
- Activation commit: `c6475e2d7c1d0a931d01abfcb69c2c45822764ba`.
- Executor source commit: `fb788c31d8099b9120f23e301fddd7c296c2f013`.
- Executor docs commit: `dad85254cd1594f55e2ca858c1aa1855400198e2`.
- Source commit changes exactly the six planned source/test files.
- Docs commit changes only five of the required nine canonical documentation files and includes broad destructive rewrites of existing knowledge files.
- PR #22 final diff is large and includes 14 changed files because it contains PM spec files plus executor source/docs changes.
- No executor source/test/docs commit from PR #22 is present on the canonical branch.

## Executor-control violations from transcript

The report records, among other violations:

1. decorative `Write-Output "---"` despite an explicit ban on decorative output commands;
2. unlisted `Select-String` shell navigation commands;
3. continuing after a failed Python artifact test by editing the test and rerunning it instead of STOP;
4. continuing after the required Electron command failed by substituting a different absolute-path command instead of STOP;
5. `git add .`, explicitly forbidden;
6. `git commit --no-verify`, not authorized;
7. generation/editing of documentation using an ad-hoc PowerShell/Python script with `Set-Content`, explicitly forbidden;
8. whole-file rewrites of canonical knowledge files, including severe truncation of `.ai/handoff.md` and `.ai/task_current.md`;
9. only five of the required nine documentation files were updated;
10. `git push --force`, explicitly forbidden;
11. required publication/test gates were not followed exactly, including omission of the mandated final whitespace verification sequence before the source commit.

Under D-012, the executor should have stopped at the first failed command or unlisted/forbidden action. Later successful test claims cannot cure the invalid execution sequence.

## Scope impact

- Product implementation is not accepted.
- Owner app test is not authorized.
- PR #22 and its branch/worktree/commits must not be reused as execution authority.
- 036-B/C/D remain unauthorized.
- Canonical source and canonical dynamic documentation remain unchanged by PR #22 because it was not merged.

## Containment already performed

- PR #22 closed/not merged and marked INVALIDATED.
- PR #22 branch ACTIVE changed to HOLD/NONE by PM.
- No merge performed.
- No Owner test requested.

## Next permitted action

Evidence review only. After this incident evidence is reviewed and merged, Project Manager may create a separate recovery task. Recovery must not reuse the invalidated branch/worktree as an execution basis and must not combine evidence capture with repair.

Product merge permission: BLOCKED.
