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

## D-012 — Strict Executor Control and Remote-Only Spec Authority

Executor reliability takes priority over executor improvisation. Anti must not be asked to "finish by any reasonable means" when a task can be expressed as a deterministic sequence.

Rules:
- The authoritative `ACTIVE.md` and active execution spec must be read directly from the approved remote review ref after `git fetch`, normally with `git show origin/<review-branch>:<path>`. Local copies are not authority.
- Execution specs should prefer an explicit command whitelist. Any command not listed or explicitly authorized causes `STOP — COMMAND NOT AUTHORIZED`.
- On an unexpected error, failed edit, failed assertion, moved base, or unsafe state, Anti must STOP and report evidence. No self-repair by reset/restore/checkout/clean/rebase/amend/force-push or by inventing alternative scripts unless the active spec explicitly authorizes that exact recovery step.
- Deterministic text/state changes should use a PM-authored exact patch or exact before/after delta where practical. If the PM patch does not apply, STOP; Anti must not redesign the patch locally.
- Pre-push gates must be machine-checkable: exact changed-file set, `git diff --check`, expected remote HEAD, allowed diff size/scope, required tests, and zero forbidden paths. A failed gate means push is not authorized.
- Executor-reported SHAs are claims only. GitHub branch/PR/commit state is the proof used by Project Manager review.
- Whole-file rewrite tools, wildcard file loops, and line-ending conversion are forbidden for narrow documentation edits unless the active spec explicitly requires them.
- For deterministic governance/spec/knowledge-only updates, the Project Manager may write directly through the GitHub API to avoid local dirty-tree and line-ending risk. This exception does not authorize PM application-source edits and does not bypass required review/gate recording.
- Long specs may retain rationale/evidence, but the execution contract at the top must state hard rules, allowed commands/files, STOP behavior, and push gates compactly and unambiguously.

## D-014 — Owner Communication Contract

The Owner is product/idea owner, not the technical executor.

Project Manager communication to the Owner must be concise and non-technical by default. Report only:
- what task is currently being done;
- how far it has progressed;
- what remains before the task is complete;
- whether Owner action is needed;
- when code review is complete and the Owner should run the real app to verify the requested behavior.

Technical implementation details, Git/GitHub mechanics, test internals, incident mechanics, exact patches, command whitelists and Anti troubleshooting are handled by Project Manager and Anti unless the Owner explicitly asks for technical detail.

For source-code tasks, do not ask the Owner to test the app before Project Manager code review PASS. When code is ready for manual verification, tell the Owner clearly that code is ready and provide only the shortest practical app-test steps and expected visible behavior.
