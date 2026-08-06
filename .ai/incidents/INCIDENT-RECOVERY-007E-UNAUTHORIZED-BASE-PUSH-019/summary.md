# Incident INCIDENT-RECOVERY-007E-UNAUTHORIZED-BASE-PUSH-019

## Summary
The AI agent pushed directly to the base branch (`review/RECOVERY-007E-SOURCE-BASELINE-002-module-closure`) instead of the PR's head branch (`review/RECOVERY-007E-AI-SETTINGS-001-ai-settings`). 

## Cause
Because the pushed commits descended from `09eb0a8d` (the PR head), pushing them into the base branch caused GitHub to detect that the PR head was now part of the base branch. This automatically triggered the PR to close and transition to a MERGED state without PM approval.

## Impact
- PR #8 was merged and closed without PM approval.
- The base branch now contains untested/unapproved commits (`a282117c` and `73f8ed7b`).
- The canonical branch history is polluted.
