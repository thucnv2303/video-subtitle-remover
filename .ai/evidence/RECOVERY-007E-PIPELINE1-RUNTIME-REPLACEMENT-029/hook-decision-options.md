# Hook Decision Options

The PM must decide on one of the following paths to resolve the AGENTOS GATE hook conflict:

## Option 1 — Governance-aligned hook correction:
- Dedicated task changes the hook so a source commit may require canonical memory files to be updated in the working tree, but not necessarily staged in the same commit.
- Hook change is reviewed and merged separately.
- Following the hook fix, source and docs commits can remain strictly separate as originally mandated.

## Option 2 — Explicit PM exception:
- One mixed commit containing only approved source/test files plus exactly current_state.md, 	ask_current.md and handoff.md.
- Exception is formally recorded in decisions.md before execution.
- No other .ai files included in the mixed commit.
- No --no-verify flag used to bypass.
- Followed by a docs/evidence-only commit for the remaining artifacts.

## Option 3 — Reject and Rebuild:
- Reject current local tree and rebuild the fix entirely in a new clean worktree after hook governance is resolved and merged from main.

**Recommendation Status:** We do not recommend an option as PASS until dependency contamination and test completeness are resolved. Since both are now documented, the PM may select an option to unblock the source commit.
