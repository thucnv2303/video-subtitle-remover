# Current Task

## Task ID
RECOVERY-007E-SOURCE-BASELINE-001

## Name
PUBLISH REVIEWABLE SOURCE BASELINE

## Status
NOT STARTED

## Purpose
Publish the exact existing approved/restored runtime source as a reviewable source baseline without altering the original dirty working tree. The baseline will allow later AI Settings implementation hunks to be isolated and reviewed.

## Task Constraints
- Source baseline publication only.
- No functional source changes.
- No AI Settings implementation.
- No restoration or overwrite of the original dirty working tree.
- No wholesale staging of untracked settings.js or pipeline2-remove.js.
- No owner test.
- No merge.

## Historical Verified Facts
- **Incident**: INCIDENT-RECOVERY-007E-TRACKING-001: COMPLETED
- **Project Manager evidence review**: PASS
- **Immutable reviewed evidence head**: fb94d94e66c27470d665cb1fa4ca9620cfad0984
- **Incident execution**: PASS — forensic capture completed
- **Incident automated verification**: NOT APPLICABLE — evidence-only
- **Incident code review**: PASS
- **Six verified source-path classifications**: `settings.js` and `pipeline2-remove.js` are UNTRACKED, others are TRACKED — MODIFIED.
- **Verified source ownership and isolation finding**: AI Settings logic is split across `settings.js` and `app.js`. Untracked files require a separate source baseline review.
- **RECOVERY-007 owner verification**: PAUSED
- **RECOVERY-007E**: NOT IMPLEMENTED
- **BUG-008 and BUG-009**: ACTIVE — BLOCKING AI ANALYSIS
- **AI Settings demo**: DESIGN DIRECTION APPROVED, IMPLEMENTATION NOT STARTED
- **Current PR head**: must be resolved directly from GitHub and must not be hard-coded as current state.

## Active Task Verification gates
- Execution: NOT STARTED
- Automated verification: WAITING
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED
