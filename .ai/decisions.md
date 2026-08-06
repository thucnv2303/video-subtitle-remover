# Decisions

## D-001
Do not rewrite the whole project before determining the last known good state.

## D-002
Each task must solve one narrowly scoped, verifiable objective.

## D-003
Every source-code task must update required .ai memory.

## D-004
Preserve working voice clone, TTS and hard-subtitle removal engines.

## D-005
Strict three-pipeline responsibility boundaries.

## D-006
Pipeline 1 analyzes original video.

## D-007
Pipeline 3 uses Pipeline 2 clean video by default.

## D-008
Source fingerprint and artifact boundaries.

## D-009
Pipeline 1 is the current technical priority.

## D-010
Owner manual verification blocks merge for source-code tasks.

## INCIDENT-RECOVERY-007E: Small-Fix Governance Directive
- Never blindly reuse or apply a patch broader than what is strictly required to fix the user-reported issue.
- Small cosmetic fixes bundled with layout fixes must be stripped unless explicitly verified as required for layout.
- Always write precise test assertions that do not allow false positives through loose substring matching.
- Commits must isolate source/tests from documentation/evidence to avoid dirty diffs and hook circumventions.
