# Current Task

## Task ID
RECOVERY-007E-SOURCE-BASELINE-001

## Name
PUBLISH REVIEWABLE SOURCE BASELINE

## Status
WAITING_REVIEW

## Purpose
Publish the exact existing approved/restored runtime source as a reviewable source baseline without altering the original dirty working tree. The baseline will allow later AI Settings implementation hunks to be isolated and reviewed.

## Verified Facts
- **exact six-file runtime baseline published**: Yes
- **source and destination hashes match**: Yes
- **original dirty worktree untouched**: Yes
- **settings.js is now reviewable on the baseline branch**: Yes
- **pipeline2-remove.js is now reviewable on the baseline branch**: Yes
- **no functional changes**: Yes
- **no AI Settings implementation**: Yes
- **RECOVERY-007 owner verification**: remains PAUSED
- **RECOVERY-007E**: remains NOT IMPLEMENTED
- **BUG-008 and BUG-009**: remain ACTIVE

## Verification gates
- Execution: PASS — byte-for-byte baseline published
- Automated verification: PASS — hash, syntax and diff checks
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED
