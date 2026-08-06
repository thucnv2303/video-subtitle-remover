# Owner Governance Directive — Small-Fix Handling

Recorded from owner instruction on 2026-08-06.

## Decision

For future project-control work, small and low-risk corrections should be handled directly by the Project Manager through GitHub tools when safe, instead of repeatedly dispatching Anti.

## Project Manager may handle directly

- Pull request body or metadata corrections.
- Incorrect SHA references in documentation or evidence.
- Small documentation-only status synchronization.
- Markdown formatting errors, headings joined to prior lines, and UTF-8 BOM removal.
- Canonical tracker corrections that do not alter source behavior.
- Evidence metadata corrections that do not change source or test results.
- Retargeting an evidence-only PR when the correct base is already verified.

## Anti remains required for

- Source-code, CSS, HTML, JavaScript, Python, test, dependency, workflow, or runtime-behavior changes.
- Git worktree operations and local test execution.
- Electron or real application runtime verification.
- Branch publication requiring local Git isolation.
- Any repair with material regression risk.

## Owner remains responsible for

- Real application verification after code review PASS.
- Reporting observed PASS or FAIL.

## Safety boundaries

Direct Project Manager corrections must remain reviewable, must not rewrite history, must not touch a dirty local worktree, and must not bypass incident restrictions or merge gates.

## Required canonical synchronization

When the replacement review branch is established, this directive must be promoted into the canonical project knowledge, at minimum `.ai/decisions.md` and the applicable workflow/governance file. Until then, this incident evidence file is the authoritative record of the owner directive.
