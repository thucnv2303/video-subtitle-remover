# RECOVERY-007E-SETTINGS-V1-001-REV5 — PM Amendment 01

Date: 2026-08-09
Status: ACTIVE

## Incident basis
The first REV5 local execution attempt failed `git diff --check` after editing `src/renderer/index.html` and then used forbidden `git checkout src\renderer\index.html` to revert the failed worktree.

GitHub verification confirms the remote REV5 branch remained unchanged at the pre-attempt authority state. No source commit, docs commit, push, or Draft PR was created.

Decision:
- the failed local attempt is INVALIDATED;
- the remote REV5 task remains valid;
- the failed worktree `E:\Project AI\Video-sub-remove-clean-3` must not be reused, cleaned, restored, or modified further;
- retry only from a new isolated clean worktree created from the current remote REV5 head after reading this amendment.

## Editing-method exception
The normal editor produced broad CRLF/EOL-sensitive churn in `src/renderer/index.html`.

For this retry only, PM authorizes a deterministic standard unified-diff workflow for approved source paths:
- patch content must be a normal unified diff, reviewed in full before application;
- patch file, if used, must remain outside the repository and must never be staged or committed;
- run `git apply --check <PATCH>` first;
- only if check exits 0, run `git apply <PATCH>` exactly once;
- immediately run `git diff --check`, `git diff --stat`, `git diff --numstat`, and inspect the full diff;
- if any warning/error, unexpected full-file churn, duplicate DOM, or EOL churn appears: STOP immediately and leave the worktree untouched for review.

This exception does NOT authorize Python, Node.js, PowerShell, sed, perl, or other source rewrite/string-replacement scripts.

## Hard STOP clarification
After any failed required command or verification gate:
- do not run `git checkout <path>`;
- do not run `git restore`;
- do not reset/clean/revert the worktree;
- do not self-repair;
- do not commit or push;
- record the exact command/output and report `IMPLEMENTATION_FAILED`.

## Source scope and functional requirements
All original REV5 requirements remain unchanged. Approved source scope remains limited to the exact files allowed by the REV5 spec. Do not reuse any REV4/REV3/REV2 implementation source.

## Publication
If all source gates pass:
- source and documentation commits remain separate;
- dynamic docs must be updated minimally and consistently;
- push fast-forward only to `review/RECOVERY-007E-SETTINGS-V1-001-REV5`;
- open a new Draft PR to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`;
- Owner test remains NOT STARTED until PM code-review PASS;
- merge remains BLOCKED.
