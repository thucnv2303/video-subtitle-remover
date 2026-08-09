# INCIDENT-REV6-004 — Evidence Amendment 02

Date: 2026-08-09
Status: ACTIVE

## Purpose
Close the two remaining evidence gaps found by PM review after correction commit `2e7485a99dbbc017706dd3e14e2ade541f7516c3`.

This is evidence-only. Do not touch `src/` or the contaminated REV6 branch.

## Required correction
Update only `.ai/incidents/INCIDENT-REV6-004/verification-evidence.txt`.

### 1. Resolve EOL contradiction
Current evidence says both:
- `EOL classification check: NOT RUN`
- pre-edit `git ls-files --eol`: `RUN`

These cannot both stand without qualification.

Correct the file to distinguish:
- pre-edit EOL classification: RUN, because `git ls-files --eol src/renderer/index.html src/renderer/js/components/settings.js` was executed;
- post-apply EOL classification: NOT RUN, unless verbatim evidence proves otherwise.

Include the actual pre-edit `git ls-files --eol` command output if recoverable from the transcript/log. If the output itself is unavailable, state exactly: `COMMAND RUN; OUTPUT NOT CAPTURED IN PUBLISHED EVIDENCE`.

### 2. Separate evidence classes
Amendment 01 required three explicit classes. Reformat the file so these are clearly separated:
- ACTUAL COMMAND OUTPUT
- EXECUTOR SUMMARY / CLAIM
- PM INFERENCE

Do not present a prose summary as command output.

For pre-edit blob/hash verification, include the actual outputs of the two `git hash-object` commands if recoverable. If not recoverable, state `COMMAND RUN; OUTPUT NOT CAPTURED IN PUBLISHED EVIDENCE` rather than PASS.

For every gate status, use only:
- PASSED — only with supporting output/evidence;
- FAILED — with supporting output/evidence;
- RUN — command/action proven but result insufficient for PASS/FAIL;
- NOT RUN.

## Publication controls
- Read this amendment directly from `origin/incident/RECOVERY-007E-SETTINGS-V1-001-REV6-004` before editing.
- Startup authority is the exact current remote incident HEAD.
- Change only `verification-evidence.txt`.
- Exact-path staging only. No `git add .` or `git add -A`.
- Inspect cached filename and diff before commit.
- One new evidence-correction commit only.
- No amend, rebase, reset, restore, checkout, force push, or source changes.
- Fetch before push; remote must still equal startup authority.
- Fast-forward push only to the same incident branch.
- Keep PR #37 OPEN + DRAFT.

Owner test: NOT AUTHORIZED.
Merge permission: BLOCKED.
