# Active PM Execution Spec

Status: INCIDENT_HOLD

Task:
`INCIDENT-RECOVERY-007E-AUDIT035-CLOSEOUT-CONTROL-003`

Incident evidence:
`.ai/incidents/INCIDENT-RECOVERY-007E-AUDIT035-CLOSEOUT-CONTROL-003.md`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical HEAD entering incident review:
`07e31d8a7cdd26565e6d6528f7bdc15693cc4698`

Why incident hold is active:
- Audit 035 PM Closeout 002 executor transcript reports unlisted `Write-Output "---"` commands under a positive command whitelist;
- PM initially missed the violation and merged PR #18;
- PR #18 changed documentation/governance only, but its procedural closeout validity is invalidated pending recovery review;
- briefly activated 036-A PR #19 has been frozen and closed before implementation.

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

Forbidden:
- implementation;
- source/test/dependency edits;
- 036-A/B/C/D worktrees or commits;
- product merge;
- reset/revert/history rewrite/force push to erase the merged incident state.

Merge permission:
BLOCKED.

Next permitted action:
Project Manager reviews the incident evidence directly on GitHub, then creates a separate recovery task if warranted. This evidence task must not perform repair.