# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
READY_FOR_IMPLEMENTATION

## Canonical base
- Branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Latest accepted merge lineage includes:
  - PR #39 UI merge `bf166660807423ec5d97ed365e9735940b2804e3`
  - PR #40 handoff merge `9a0b301171d047ccb0280eabe917f1bcd9ea85c2`

## Goal
Make the approved Pipeline 1 Start flow execute the full enabled chain correctly:
`ASR → AI Rewrite → TTS → P1 COMPLETE → P2 READY`.

## Required behavior
- Preserve the approved Pipeline 1 UI.
- Preserve the accepted P1→P2 handoff gate.
- P1 must never perform subtitle removal or final rendering.
- AI rewrite must use the selected provider/model/prompt.
- TTS must use the selected voice/settings when enabled.
- P1 must only mark complete after all enabled P1 stages finish successfully.
- P2 remains locked on P1 failure/cancel.
- Successful P1 completion unlocks exactly the matching P2 job.

## Known evidence
- Owner runtime on PR #40 proved ASR can complete and handoff can work when AI rewrite/TTS are skipped.
- Full enabled AI rewrite + TTS chain is not yet runtime verified.

## Gates
- Execution: NOT STARTED.
- Automated verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: PASS for task transition.
- Merge permission: BLOCKED.
