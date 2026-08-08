# Current Task

## Task ID
GOVERNANCE-AGENTOS-PRECOMMIT-001

## Name
Governance AgentOS Pre-commit Hook Correction

## Goal
Correct the tracked `.githooks/pre-commit` so repository enforcement matches the active GitHub review workflow: source and documentation commits remain separate, while the three dynamic project-state files remain synchronized when documentation is committed.

## Status
IMPLEMENTED — WAITING PM REVIEW

## Single objective
Implement a 4-case logic in `.githooks/pre-commit` to allow isolated source commits, block mixed commits, require all 3 dynamic docs in docs-only commits, and allow unrelated docs/governance commits.

## Verification gates

- Automated verification: PASS (Hook tests via disposable repo passed all 7 scenarios, syntax check passed, git diff --check passed).
- Code review: WAITING.
- Owner manual app verification: NOT APPLICABLE.
- Merge permission: BLOCKED.
