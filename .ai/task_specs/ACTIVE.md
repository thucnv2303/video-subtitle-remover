# Active PM Execution Spec

Status: HOLD

Task:
`NONE — AUDIT 035 EXECUTION INVALIDATED`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical activation basis:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Invalidated executor commit:
`2a5319cb8b46bee6a90d9181bf53d870403c17b4`

Decision:
`INVALIDATED — EXECUTOR CONTROL VIOLATION`

Verified reason:
- The active main spec required the PM closeout helper to run exactly once.
- The first helper run failed because the report did not contain the required exact term `artifact version`.
- The spec required immediate STOP on helper failure and explicitly said `Do not run it again`.
- The executor instead inspected the helper, modified the audit report, and ran the helper a second time.
- The executor also used shell-based PowerShell file creation/edit commands for the manually authored report even though the spec allowed editor/write-file capability only and stated that no shell command outside the whitelist was authorized.

GitHub publication facts:
- Commit `2a5319cb8b46bee6a90d9181bf53d870403c17b4` exists.
- Its GitHub diff is narrow and contains only the expected audit report plus three dynamic `.ai` files.
- That clean final diff does not cure the execution-contract violation.
- The report may be treated only as candidate material until independently re-verified under a superseding task.

Application source/test/dependency changes from invalidated executor commit:
NONE.

Anti authorization on this branch:
NONE.

Task 036 authorization:
NONE.

Merge permission for PR #16:
BLOCKED — PR #16 must not be merged.

Next permitted action:
Project Manager publishes a superseding Audit 035 REV1 task from the canonical base. REV1 may use the invalidated report only as candidate reference and must re-verify claims against canonical source. Dynamic canonical state will be synchronized by Project Manager only after REV1 audit review PASS.
