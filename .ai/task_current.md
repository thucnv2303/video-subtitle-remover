# Current Task

## Task ID
PIPELINE1-HANDOFF-001

## Name
Pipeline 1 → Pipeline 2 State/Handoff Gate

## Status
OWNER_RUNTIME_PASS

## Base
`2324d922de4874af1eb33f5dec2ea2d63a2bb968`

## Review branch / PR
- Branch: `review/PIPELINE1-HANDOFF-001`
- Draft PR: #40

## Required behavior
- Upload creates a P1 job only.
- P2 remains locked/hidden until P1 succeeds.
- P1 error/cancel stays locked from P2.
- P1 success makes the exact job ready in P2.
- P2 processes the ORIGINAL source video only for subtitle removal.
- P2 cannot accept direct upload/drop bypass.
- P2 success, not P1 success, opens P3.

## Verification
- Static/source review: PASS.
- State/guard simulations: PASS.
- Owner runtime verification on 2026-08-10: PASS for the P1→P2 handoff/processing route.
- Runtime evidence shows ASR completed, AI rewrite and TTS were skipped in this test, P1 completed, and P2 was automatically unlocked.
- BUG-008: resolved by Owner runtime evidence.
- BUG-005: remains open/narrowed because the full enabled AI rewrite + TTS chain has not yet been verified.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS.
- Owner manual app verification: PASS for this handoff task.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED pending explicit merge approval.

## Next focused task
Verify and repair the full Pipeline 1 chain with AI rewrite + TTS enabled, without changing the approved UI or the accepted P1→P2 handoff contract.
