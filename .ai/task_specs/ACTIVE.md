# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`

Spec:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis SHA:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Supersedes invalidated task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Invalidated candidate report commit:
`2a5319cb8b46bee6a90d9181bf53d870403c17b4`

Incident:
`INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001`

Execution type:
READ-ONLY AUDIT RECOVERY — REPORT ONLY.

Anti authorization:
- read this ACTIVE and full REV1 spec directly from this remote ref;
- read only the source/canonical paths allowed by the REV1 spec;
- read the invalidated Audit 035 report only as candidate material;
- independently re-verify every accepted claim against canonical source;
- create exactly `.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md` using editor/write-file capability;
- publish exactly one executor-authored file.

Executor dynamic-state authorization:
NONE.

Application source/test/dependency authorization:
NONE.

Closeout helper:
NONE — intentionally removed from REV1.

Owner app verification:
NOT REQUIRED.

Task 036 authorization:
NONE.

Merge permission:
BLOCKED pending executor REV1 report publication and Project Manager direct GitHub review.

Hard rules:
- local ACTIVE/spec is not authority;
- no shell-based report writing/editing;
- no self-repair;
- no unlisted command;
- no helper;
- no app/test execution;
- no source modification;
- no dynamic canonical state edit;
- no force push;
- no Task 036;
- no merge.

Next permitted action:
Anti executes Audit 035 REV1 exactly and publishes the single REV1 report file. Project Manager then independently verifies the report and source, synchronizes canonical knowledge if PASS, closes the incident, and selects the first implementation task.
