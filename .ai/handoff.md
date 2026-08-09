# AgentOS Handoff Status

## Canonical baseline
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical source HEAD:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

## Invalidated product executions
- REV3 — INVALIDATED.
- REV4 / PR #35 — INVALIDATED and closed unmerged.
- REV5 implementation — INVALIDATED; INCIDENT-REV5-003 evidence PASS; PR #36 closed unmerged.
- REV6 implementation — INVALIDATED.

## Latest incident disposition
- INCIDENT-REV6-004 evidence publication: PASS / RESOLVED.
- Evidence PR #37: closed unmerged.
- REV6 source/docs commits remain untrusted and forbidden as recovery/implementation input.

## Trusted REV7 basis
- Trusted project-state basis: `b88ffc62aec35cb28de7adf7ce70750f478b29f5`.
- GitHub comparison verifies no source changes between canonical `cf20a02...` and trusted `b88ffc62...`; differences are `.ai` only.

## Active task
`RECOVERY-007E-SETTINGS-V1-001-REV7`

## Status
ACTIVE — WAITING

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Execution authority
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7.md`

## REV7 execution rule
Use a NEW isolated clean worktree from exact current remote REV7 authority. Allowed source is only `src/renderer/index.html` and `src/renderer/js/components/settings.js`.

Edit tracked source directly with the normal editor, one file at a time. No external candidate/baseline-copy, no generated patch, no `git apply`, no rewrite script, and no line-ending normalization. Complete the per-file hard gate before touching the next source file. First required gate failure => STOP without self-repair.

## Gates
- Execution: WAITING.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED.
- Documentation synchronization: PASS for REV7 authority setup.
- Merge permission: BLOCKED.

## Next action
Executor fetches `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV7`, reads remote ACTIVE + REV7 spec, records exact remote HEAD, creates a new isolated clean worktree from that HEAD, verifies source blobs, then executes REV7 exactly.
