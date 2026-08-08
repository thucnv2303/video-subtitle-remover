# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035 — Execution Addendum

Status: MANDATORY

This addendum is part of the active Audit 035 execution contract and must be read from the same remote review ref immediately after the main spec.

It changes only the two points below. All other rules in the main Audit 035 spec remain unchanged.

## 1. Worktree navigation command authorization

After the exact worktree has been created, the following command is explicitly authorized:

`Set-Location "E:\Project AI\_audit\035-pipeline1-artifact-contract"`

The alias form below is also authorized only for the same exact path:

`cd "E:\Project AI\_audit\035-pipeline1-artifact-contract"`

No other directory-changing command/path is authorized by this addendum.

## 2. Expected git grep no-match behavior

For the read-only audit searches authorized by Section 8 of the main spec:

- `git grep -n ...` exit code `0` = matches found; record the evidence.
- `git grep -n ...` exit code `1` = zero matches; this is an EXPECTED audit outcome and must be recorded as negative evidence. It is NOT a failed command and does NOT trigger STOP.
- any `git grep` exit code greater than `1` = command failure; STOP immediately.

Do not convert a zero-match result into an implementation claim without also checking the relevant execution-path source files required by the main spec.

## 3. Authority

If the main spec and this addendum differ on either of the two points above, this addendum controls.

No other command or scope expansion is authorized.
