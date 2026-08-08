# PM Execution Specs

Document status: ACTIVE GOVERNANCE
Owner: Project Manager / Technical Reviewer
Executor: Anti

## Purpose

Task implementation instructions are no longer carried primarily in long chat prompts.
For every executor task, the Project Manager writes a version-controlled execution spec under `.ai/task_specs/` first. The Anti prompt is only a routing instruction telling Anti which spec to read.

This reduces prompt drift, repeated interpretation, missed one-line fixes, and review loops.

## Authority

For executor work, use this order:

1. Project-level safety/governance rules.
2. Exact active execution spec referenced by `.ai/task_specs/ACTIVE.md`.
3. Canonical project state files (`current_state.md`, `task_current.md`, `handoff.md`, etc.).
4. PR/source evidence.
5. Chat prompt.

If the chat prompt conflicts with the active execution spec, STOP and report the conflict. Do not guess which instruction was intended.

### Remote-only authority for execution specs

Before any executor action:

1. `git fetch origin`.
2. Read `ACTIVE.md` directly from the approved remote review ref, for example:

```text
git show "origin/<review-branch>:.ai/task_specs/ACTIVE.md"
```

3. Read the exact spec referenced by that remote `ACTIVE.md` from the same remote ref:

```text
git show "origin/<review-branch>:<exact-spec-path>"
```

4. Record the exact remote HEAD with `git rev-parse origin/<review-branch>`.

Local `ACTIVE.md` and local task-spec copies are not authority. If the remote pointer or referenced spec cannot be read, STOP. If local and remote copies differ, ignore the local copy.

## Ownership

- Project Manager authors and reviews files under `.ai/task_specs/`.
- Anti treats execution specs as READ-ONLY instructions.
- Anti must not edit a task spec to make its implementation appear compliant.
- Owner does not maintain task specs or canonical `.ai` state.
- Anti still updates affected canonical project-state files as required by the task spec.
- For deterministic governance/spec/knowledge-only changes, Project Manager may update GitHub directly through the GitHub API when that is safer than local editing. This does not authorize PM application-source edits or bypass review/gate recording.

## Required files

- `ACTIVE.md` — authoritative pointer to the currently authorized executor spec, or explicitly NONE.
- `TEMPLATE.md` — required structure for new specs.
- `<TASK-ID>.md` — immutable implementation/recovery/documentation contract for a concrete executor task.

## Strict execution contract

The executor must be constrained by positive authorization, not only by a long blacklist.

Each active spec should define near the top:

- exact allowed files;
- exact allowed commands or command classes;
- exact forbidden commands/actions;
- what to do on the first unexpected error;
- exact pre-push gates;
- exact STOP codes.

Default behavior is:

```text
ON ANY UNEXPECTED ERROR OR OUT-OF-SPEC CONDITION:
STOP IMMEDIATELY.
DO NOT SELF-REPAIR.
DO NOT INVENT AN ALTERNATIVE COMMAND OR SCRIPT.
```

When practical, use an explicit command whitelist. A command outside the whitelist is not implicitly allowed merely because it seems harmless.

## No self-repair rule

Unless the active spec explicitly authorizes the exact operation, Anti must not recover from its own failed edit or dirty state using:

- `git reset`;
- `git restore`;
- `git checkout`;
- `git clean`;
- rebase/amend/history rewrite;
- force push;
- wildcard rewrite scripts;
- CRLF/LF conversion;
- whole-file formatting/rewriting.

A failed edit or failed gate is evidence for Project Manager review, not permission to improvise a repair.

## Exact-patch preference

For deterministic text/state changes, Project Manager should prefer one of:

- exact before/after text;
- PM-authored patch/diff;
- exact file/section/value contract.

If an exact PM patch does not apply to the reviewed basis, Anti stops with a dedicated STOP result. Anti does not redesign the patch or broaden scope locally.

## Dispatch protocol

Before Anti edits anything:

1. Fetch origin.
2. Read remote `ACTIVE.md` fully using the approved remote review ref.
3. Read the referenced task spec fully from the same remote ref.
4. Record repository, branch, exact remote HEAD/base SHA, and dirty-tree constraints.
5. Verify the spec is still applicable to the actual GitHub/local state.
6. If HEAD moved in a way that affects reviewed source or acceptance criteria, STOP — SPEC BASE MOVED.
7. If required work falls outside allowed files/symbols, STOP — SPEC SCOPE INSUFFICIENT.
8. If a command is required but not authorized, STOP — COMMAND NOT AUTHORIZED.
9. Only then implement.

## Spec quality requirements

A task spec should be concrete enough that Anti does not need to redesign the solution.
Where practical, include:

- exact file and symbol;
- current incorrect behavior/text;
- exact required behavior/text;
- replacement snippet, pseudocode, algorithm, exact patch, or data contract;
- allowed files and forbidden files;
- allowed command whitelist for deterministic/incident tasks;
- required tests and exact commands;
- machine-checkable acceptance criteria;
- required `.ai` updates;
- commit separation and publication requirements;
- stop conditions;
- final report schema.

For a small defect, prefer an exact delta such as:

```text
File: .ai/current_state.md
Section: ## Active Task / PR
Current: - Code review: WAITING_PM_REVIEW
Required: - Code review: PASS
```

Do not use vague instructions such as "make docs consistent" when the exact inconsistency is already known.

## Machine-checkable acceptance

Every spec should use objective checks whenever possible, for example:

- `git diff --check`;
- `git grep -n <pattern> <files>`;
- exact changed-file list;
- exact function/symbol checks;
- exact test command and expected exit code;
- exact PASS/FAIL/NOT TESTED counts;
- exact expected field/value in generated artifacts;
- exact remote HEAD before push;
- maximum allowed diff size/numstat for narrow documentation tasks.

For narrow documentation work, unexpectedly large numstat is a STOP condition, not something the executor may explain away. Whole-file line-ending churn is not acceptable unless explicitly required by the spec.

## Pre-push hard gate

Before any push, all required conditions must pass mechanically:

```text
EXPECTED_CHANGED_FILES == ACTUAL_CHANGED_FILES
FORBIDDEN_CHANGED_FILES == NONE
DIFF_CHECK == PASS
REMOTE_HEAD == EXPECTED_REMOTE_HEAD
REQUIRED_TESTS == PASS
DIFF_SIZE_WITHIN_APPROVED_SCOPE == PASS
```

If any condition fails: `STOP — PUSH NOT AUTHORIZED`.

Normal push is fast-forward only. Force push is forbidden unless a separately approved incident spec explicitly authorizes it.

## Evidence and SHA truth

Executor-reported branch names, SHAs, test summaries, and changed-file claims are not proof.
Project Manager verifies repository reality directly from GitHub after publication.
The GitHub branch/PR/commit SHA is the authoritative publication identity.

## Immutability and revisions

Once Anti begins executing a spec, do not silently rewrite its requirements.
If review changes the required implementation:

- create a new `-REV<n>` spec, or
- publish a clearly versioned superseding spec before Anti continues.

The old spec remains historical evidence.

## Minimal Anti prompt

Normal executor dispatch should be short but must make remote authority explicit:

```text
TASK: <TASK-ID>

Run `git fetch origin`.
Read ACTIVE directly from:
  origin/<review-branch>:.ai/task_specs/ACTIVE.md
using `git show`.

Then read the exact referenced spec from the same remote ref using `git show`.
Local ACTIVE/spec copies are not authority.
Execute that spec exactly.
On any unexpected error or out-of-spec condition: STOP; do not self-repair.
Return only the evidence required by the spec.
```

The prompt is not the implementation contract. The remote GitHub execution spec is.

## Current transition rule

Existing historical tasks/prompts remain evidence only. New executor tasks created after adoption of this protocol should use PM Execution Specs with remote-only authority, strict command control, no self-repair, and hard pre-push gates by default.
