# GOVERNANCE-AGENTOS-PRECOMMIT-001

## Objective
Correct the tracked `.githooks/pre-commit` so repository enforcement matches the active GitHub review workflow: source and documentation commits remain separate, while the three dynamic project-state files remain synchronized when documentation is committed.

## Verified conflict
Current hook behavior:
- if any `api/`, `src/`, `package.json`, or `package-lock.json` path is staged, it requires `.ai/current_state.md`, `.ai/task_current.md`, and `.ai/handoff.md` in the same commit.

Active project workflow requires:
1. source commit containing only approved source changes;
2. separate documentation commit containing project-state updates;
3. owner-test result later recorded in a documentation-only commit.

Therefore the current hook conflicts with canonical delivery rules and blocked `RECOVERY-007E-SETTINGS-V1-001-REV2` correctly when that task attempted a source-only commit.

## Allowed files
- `.githooks/pre-commit`
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/GOVERNANCE-AGENTOS-PRECOMMIT-001.md`
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

No application source files are allowed.

## Required hook behavior
Implement only the following policy.

### Case A — source-only commit
If staged files include source (`api/`, `src/`, `package.json`, `package-lock.json`) and include NONE of the three dynamic `.ai` files:
- ALLOW the commit.

This enables the required isolated source commit.

### Case B — mixed source + dynamic project-state docs
If staged files include source and ANY of:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
then:
- BLOCK the commit;
- print a clear message that source and documentation commits must be separate.

This prevents the old mixed-commit behavior.

### Case C — documentation-only dynamic state commit
If staged files include ANY of the three dynamic `.ai` files and NO source:
- require ALL THREE dynamic files to be staged together;
- if one or two are missing, BLOCK and list the missing paths;
- if all three are staged, ALLOW.

This preserves project-state synchronization.

### Case D — unrelated docs/governance-only commit
If no source and none of the three dynamic state files are staged:
- ALLOW.

## Implementation constraints
- Keep POSIX `/bin/sh` compatibility.
- Keep `set -eu`.
- Do not introduce dependencies.
- Do not inspect working-tree unstaged files; only staged paths are gate authority.
- Do not auto-stage files.
- Do not modify staged content.
- Do not invoke commits from inside the hook.
- Do not weaken dirty-tree or secret protections elsewhere.

## Required hook tests
Use a disposable temporary Git repository or equivalent isolated test fixture; do not mutate the product worktree to manufacture scenarios.

Mechanically verify these cases:
1. source-only staged => exit 0.
2. source + all three dynamic docs staged => nonzero.
3. source + one dynamic doc staged => nonzero.
4. docs-only with all three dynamic docs staged => exit 0.
5. docs-only with only one dynamic doc staged => nonzero and missing paths reported.
6. unrelated `.ai` governance/spec file only => exit 0.
7. no staged files => exit 0.

Also run:
- shell syntax check supported by environment (for example `sh -n .githooks/pre-commit`);
- `git diff --check`;
- inspect exact staged filename list and staged diff before commit.

If a required test/command fails unexpectedly: STOP. No bypass/self-repair outside exact spec.

## Commit and publication
This is a governance-only task.

Expected implementation commit:
- `.githooks/pre-commit` only.

Then update the three dynamic `.ai` files minimally to record:
- governance conflict verified;
- hook correction implemented/tested;
- Settings REV2 remains BLOCKED pending PM review/merge/adoption of this hook correction;
- Owner product test remains NOT STARTED;
- merge remains BLOCKED.

Because the corrected hook itself cannot govern the commit that introduces it until after that commit exists, use normal commit with the currently installed hook. The implementation commit changes only `.githooks/pre-commit`, which current hook treats as non-source and therefore permits without dynamic docs. Do not bypass hooks.

Create a second documentation-only commit containing exactly the three dynamic `.ai` files. Under the newly corrected hook, this docs commit must contain all three files together.

Push:
`review/GOVERNANCE-AGENTOS-PRECOMMIT-001`

Open Draft PR against:
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Do not merge.

## Product-task rule
Do not resume Settings REV2 in the same execution. After this governance PR is reviewed and adopted, PM will issue a fresh remote Settings continuation spec/ref.

## Final executor report
Return:
- STATUS
- repository
- branch
- execution-spec remote HEAD
- source basis SHA
- hook commit SHA
- docs commit SHA
- final head SHA
- Draft PR URL/number
- exact changed files
- hook test commands/results for all seven cases
- shell syntax result
- git diff --check result
- Settings REV2 status: BLOCKED / NOT RESUMED
- Owner product test: NOT STARTED
- merge: BLOCKED
- NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR