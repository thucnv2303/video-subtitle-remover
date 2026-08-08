# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-PM-VERIFIED-CLOSEOUT-006-REV1`

Spec:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-PM-VERIFIED-CLOSEOUT-006-REV1.md`

PM-authored helper:
`.ai/task_specs/tools/finalize_034_pm_verified_006_rev1.py`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted documentation correction SHA:
`7d2e108a3fe57b6cdbc55f31b966bb633894f772`

PM verification result:
PASS — GitHub verifies Finalize-005-REV1 correction is narrow, docs-only, and current 034-REV2 canonical content agrees on Owner PASS.

Previous Closeout-006 result:
STOPPED SAFELY before any write. The first Closeout-006 helper incorrectly assumed both handoff Next-Permitted-Action occurrences were the same CRLF two-line block. Direct GitHub blob inspection proves they are not; the file has existing mixed newline sequences and different section bodies.

Purpose:
Run only the corrected Closeout-006-REV1 helper from a brand-new isolated worktree. The helper uses section-bound exact replacements, is pinned to the unchanged canonical input blobs, validates all transformations before any write, and preserves CRLF/LF counts.

Executor must fetch GitHub, read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced Closeout-006-REV1 spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual editing.
No self-repair.
No command outside the REV1 whitelist.
Do not modify `.ai/qa_checklist.md`.
Do not modify task specs/helper.
Do not touch/remove/repair any prior Finalize/Closeout worktree.
Do not modify source/tests/dependencies.
Do not start Task 035 or Task 036.
Do not force push.
Do not merge PR #14.

Documentation synchronization is PM-verified PASS in review, but canonical files still require this corrected final deterministic PASS-recording commit.
Merge remains BLOCKED pending explicit PM merge approval after Closeout-006-REV1 publication is verified.
