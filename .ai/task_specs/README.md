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

## Ownership

- Project Manager authors and reviews files under `.ai/task_specs/`.
- Anti treats execution specs as READ-ONLY instructions.
- Anti must not edit a task spec to make its implementation appear compliant.
- Owner does not maintain task specs or canonical `.ai` state.
- Anti still updates affected canonical project-state files as required by the task spec.

## Required files

- `ACTIVE.md` — authoritative pointer to the currently authorized executor spec, or explicitly NONE.
- `TEMPLATE.md` — required structure for new specs.
- `<TASK-ID>.md` — immutable implementation/recovery/documentation contract for a concrete executor task.

## Dispatch protocol

Before Anti edits anything:

1. Read `.ai/task_specs/ACTIVE.md` fully.
2. Read the referenced task spec fully.
3. Verify repository, branch, expected HEAD/base SHA, and dirty-tree constraints.
4. Verify the spec is still applicable to the actual GitHub/local state.
5. If HEAD moved in a way that affects reviewed source or acceptance criteria, STOP — SPEC BASE MOVED.
6. If required work falls outside allowed files/symbols, STOP — SPEC SCOPE INSUFFICIENT.
7. Only then implement.

## Spec quality requirements

A task spec should be concrete enough that Anti does not need to redesign the solution.
Where practical, include:

- exact file and symbol;
- current incorrect behavior/text;
- exact required behavior/text;
- replacement snippet, pseudocode, algorithm, or data contract;
- allowed files and forbidden files;
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

- `git diff --check`
- `git grep -n <pattern> <files>`
- exact changed-file list
- exact function/symbol checks
- exact test command and expected exit code
- exact PASS/FAIL/NOT TESTED counts
- exact expected field/value in generated artifacts

## Immutability and revisions

Once Anti begins executing a spec, do not silently rewrite its requirements.
If review changes the required implementation:

- create a new `-REV<n>` spec, or
- publish a clearly versioned superseding spec before Anti continues.

The old spec remains historical evidence.

## Minimal Anti prompt

Normal executor dispatch should be short:

```text
TASK: <TASK-ID>
Repo: E:\Project AI\Video-sub-remove
Branch: <branch>

Read `.ai/task_specs/ACTIVE.md`, then read the exact spec referenced there.
Execute that spec exactly.
Do not expand scope or reinterpret acceptance criteria.
If branch/HEAD/spec basis conflicts, STOP and report BLOCKED.
Return the evidence required by the spec.
```

The prompt is not the implementation contract. The GitHub execution spec is.

## Current transition rule

Existing historical tasks/prompts remain evidence only. New executor tasks created after adoption of this protocol should use PM Execution Specs by default.
