# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Spec:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`

Mandatory execution addendum:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-EXECUTION-ADDENDUM.md`

PM-authored closeout helper:
`.ai/task_specs/tools/close_pipeline1_artifact_audit_035.py`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical activation basis:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Why this task is active:
- `.ai/project.md` orders a read-only audit of current Pipeline 1 and gap analysis against the target artifact contract as the next recovery milestone.
- `.ai/migration_status.md` identifies Pipeline 1 as the current technical priority and says Pipeline 3 is not the next task.
- `.ai/architecture.md` defines proposed P1 artifacts and source-identity requirements that must be audited before implementation.

Execution type:
READ-ONLY PRODUCT AUDIT plus documentation publication only.

Anti authorization:
- read the main spec AND the mandatory execution addendum directly from this remote ref;
- read approved canonical/source files listed in the spec;
- create `.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`;
- run the exact PM closeout helper once after the report is complete;
- publish exactly the four authorized documentation files to this review branch.

Application source/test/dependency authorization:
NONE.

Owner app verification:
NOT REQUIRED for Audit 035.

Task 036 authorization:
NONE.

Merge permission:
BLOCKED pending executor audit publication and Project Manager GitHub review.

Executor must fetch GitHub, read this ACTIVE file directly from `origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`, then read the full referenced main spec and mandatory addendum from the same remote ref.

Local ACTIVE/spec/addendum copies are not authority.
No manual edits to existing dynamic state files.
No self-repair.
No command outside the spec+addendum whitelist.
Do not modify application source/tests/dependencies.
Do not run the app.
Do not start Task 036.
Do not force push.
Do not merge the Draft PR.

Next permitted action:
Anti executes the exact read-only Audit 035 spec plus mandatory addendum and publishes the audit report plus PM-helper-generated state synchronization. Project Manager then verifies the report and chooses the first implementation task from the evidence.
