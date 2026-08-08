# Active PM Execution Spec

Status: HOLD

Task:
`NONE — 036-A FROZEN BY INCIDENT-RECOVERY-007E-AUDIT035-CLOSEOUT-CONTROL-003`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Draft PR:
`#19 — CANCELLED / DO NOT EXECUTE / DO NOT MERGE`

Incident reason:
- The executor transcript for Audit 035 PM Closeout 002 reports use of unlisted `Write-Output "---"` shell commands.
- The Closeout 002 spec authorized only exact exit-code diagnostic commands `echo "Exit: $LASTEXITCODE"` or `Write-Output "Exit: $LASTEXITCODE"`; all other shell commands were forbidden.
- Project Manager initially missed this control violation, merged PR #18, and activated 036-A. That PM decision is now under incident review.

Anti authorization:
NONE.

Application source/test/dependency authorization:
NONE.

036-A/B/C/D authorization:
NONE.

Owner app verification:
NOT STARTED / NOT AUTHORIZED.

Merge permission:
BLOCKED.

Next permitted action:
Incident evidence publication/review only. Do not execute the 036-A implementation spec on this branch. Do not create a worktree for 036-A. Do not edit source/tests. Do not merge PR #19.