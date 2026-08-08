# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`

Spec:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002.md`

PM-authored helper:
`.ai/task_specs/tools/close_audit035_pm_002.py`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis SHA:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-CLOSEOUT-002`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted PM audit evidence:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md`

Incident:
`INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001 — CONTAINED / CLOSED FOR IMPLEMENTATION`

Why this closeout is active:
- executor Audit 035 PR #16 was invalidated and closed without merge;
- executor Audit 035 REV1 PR #17 was invalidated and closed without merge;
- PM independently verified the substantive audit findings from canonical GitHub source;
- the remaining work is deterministic synchronization of the three dynamic canonical state files.

Anti authorization:
- read this remote ACTIVE and the full referenced closeout spec;
- run the exact PM helper once after its syntax gate;
- publish exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`.

Application source/test/dependency authorization:
NONE.

Task 036-A authorization:
NONE — `RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A` is selected as the next implementation candidate but is not executable until a separate PM-authored ACTIVE/spec is published.

Owner app verification:
NOT REQUIRED for this documentation-only closeout.

Merge permission:
BLOCKED pending executor closeout publication and PM direct GitHub review.

Command-whitelist note:
The closeout spec explicitly authorizes exact exit-code diagnostic commands using `echo "Exit: $LASTEXITCODE"` or `Write-Output "Exit: $LASTEXITCODE"` immediately after an approved command. No other unlisted command is authorized.

Next permitted action:
Anti executes the exact Audit 035 PM Closeout 002 spec and stops at WAITING_PM_REVIEW. Project Manager then verifies the three-file diff, merges the documentation closeout if PASS, and publishes the separate exact implementation spec for Task 036-A.