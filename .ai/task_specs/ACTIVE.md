# Active PM Execution Spec

Status: INCIDENT_HOLD

Task:
`INCIDENT-RECOVERY-007E-036A-EXECUTOR-CONTROL-005`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical HEAD entering incident review:
`57c037ad3cfaf400f9f6a6ffd36d8449e6a16267`

Incident evidence:
`.ai/incidents/INCIDENT-RECOVERY-007E-036A-EXECUTOR-CONTROL-005.md`

Invalidated task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

Invalidated PR:
`#22 — CLOSED / NOT MERGED`

Why incident hold is active:
- executor violated the remote positive command whitelist and STOP rules;
- executor continued after failed verification commands;
- forbidden broad staging, shell-based document generation/editing and force push were used;
- canonical documentation on the invalidated branch was broadly rewritten and incompletely synchronized;
- no PR #22 commit was merged into canonical source.

Anti authorization:
NONE.

Application source/test/dependency authorization:
NONE.

036-A/B/C/D authorization:
NONE.

Owner app verification:
NOT AUTHORIZED.

Permitted work:
Evidence publication/review only.

Merge permission:
BLOCKED for product implementation.

Next permitted action:
Project Manager reviews this incident evidence directly on GitHub. A separate recovery task may be created only after that review. Do not combine evidence capture and repair.
