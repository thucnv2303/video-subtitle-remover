# Decisions

## D-001
Do not rewrite the whole project before determining the last known good state.

## D-002
Each task must solve one narrowly scoped, verifiable objective.

## D-003
Every source-code task must update required .ai memory.

## D-004
Preserve working voice clone, TTS and hard-subtitle removal engines.

## D-005
Strict three-pipeline responsibility boundaries.

## D-006
Pipeline 1 analyzes original video.

## D-007
Pipeline 3 uses Pipeline 2 clean video by default.

## D-008
Source fingerprint and artifact boundaries.

## D-009
Pipeline 1 is the current technical priority.

## D-010
Owner manual verification blocks merge for source-code tasks.

## INCIDENT-RECOVERY-007E: Small-Fix Governance Directive
- Never blindly reuse or apply a patch broader than what is strictly required to fix the user-reported issue.
- Small cosmetic fixes bundled with layout fixes must be stripped unless explicitly verified as required for layout.
- Always write precise test assertions that do not allow false positives through loose substring matching.
- Commits must isolate source/tests from documentation/evidence to avoid dirty diffs and hook circumventions.

## D-011 — PM-authored GitHub Execution Specs

For new Anti executor tasks, the implementation contract must be written by the Project Manager as a version-controlled file under `.ai/task_specs/` before dispatch.

Rules:
- `.ai/task_specs/ACTIVE.md` points to the one currently authorized Anti execution spec, or explicitly says `NONE`.
- The Anti chat prompt is only a short routing instruction to read and execute the active GitHub spec; it is not the primary implementation contract.
- Specs should identify exact files/symbols, current incorrect behavior/text, required behavior/text, implementation guidance or snippets, machine-checkable acceptance criteria, required tests, forbidden actions, knowledge updates, delivery rules, and stop conditions.
- Anti treats PM execution specs as read-only and must not edit them to make implementation appear compliant.
- Once execution starts, requirements are not silently rewritten. Changed requirements require a versioned superseding/REV spec.
- If actual branch/HEAD invalidates the reviewed basis, Anti stops with `SPEC BASE MOVED`.
- If a required fix exceeds allowed scope, Anti stops with `SPEC SCOPE INSUFFICIENT`.
- Canonical project-state files remain maintained by Anti when affected; execution specs do not replace `current_state.md`, `task_current.md`, `handoff.md`, QA, bugs, architecture, or API contracts.

Protocol and template:
- `.ai/task_specs/README.md`
- `.ai/task_specs/TEMPLATE.md`
- `.ai/task_specs/ACTIVE.md`
