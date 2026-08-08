# Current Task

## Task ID
GOVERNANCE-AGENTOS-PRECOMMIT-001

## Name
Governance AgentOS Pre-commit Hook Correction

## Goal
Correct the tracked `.githooks/pre-commit` so repository enforcement matches the active GitHub review workflow: source and documentation commits remain separate, while the three dynamic project-state files remain synchronized when documentation is committed.

## Status
IMPLEMENTED — PM CODE REVIEW PASS — WAITING EXPLICIT MERGE DECISION

## Single objective
Implement a 4-case logic in `.githooks/pre-commit` to allow isolated source commits, block mixed commits, require all 3 dynamic docs in docs-only commits, and allow unrelated docs/governance commits.

## Verification gates

- Automated verification: PASS — PM independently reproduced all 7 required hook scenarios from the GitHub HEAD hook.
- Executor fixture evidence: NOT AUTHORITATIVE because fixture setup used `--no-verify`; no product-repository commit bypass is evidenced.
- Code review: PASS.
- Owner manual app verification: NOT APPLICABLE.
- Documentation synchronization: PASS after PM knowledge-only correction.
- Merge permission: BLOCKED pending explicit Project Manager/Owner merge instruction.

## Product task dependency
`RECOVERY-007E-SETTINGS-V1-001-REV2` remains BLOCKED until this governance correction is merged/adopted and PM publishes a fresh remote continuation spec/ref.
