# Active PM Execution Spec

Status: HOLD

Task:
`NONE`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Invalidated task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

Invalidated PR:
`#22 — CLOSED / NOT MERGED`

Incident:
`INCIDENT-RECOVERY-007E-036A-EXECUTOR-CONTROL-005`

Reason:
- executor violated the positive command whitelist and STOP rules;
- executor used forbidden broad staging, shell-based doc generation/editing and force push;
- executor continued after failed verification commands;
- documentation publication also destroyed/rewrote canonical history beyond the approved narrow update contract.

Anti authorization:
NONE.

Application source/test/dependency authorization:
NONE.

Owner app verification:
NOT AUTHORIZED.

036-B/C/D authorization:
NONE.

Merge permission:
BLOCKED.

Next permitted action:
Project Manager publishes and reviews incident evidence on a separate branch. Do not reuse this branch, worktree, commits, or invalidated docs as execution authority.
