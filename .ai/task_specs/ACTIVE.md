# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical base SHA:
`57c037ad3cfaf400f9f6a6ffd36d8449e6a16267`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

Primary spec:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1.md`

Mandatory base annex:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1-BASE-ANNEX.md`

Expected base-annex blob:
`32c2237833ca8004fd5402d5912618460e3ed40c`

Incident recovery basis:
`INCIDENT-RECOVERY-007E-AUDIT035-CLOSEOUT-RATIFICATION-004 — MERGED / RESOLVED FOR FORWARD EXECUTION`

Why active:
- Audit 035 technical findings are PM VERIFIED and PM RATIFIED;
- Incident 003 is resolved for forward execution while invalid executor history remains preserved;
- cancelled PR #19/original 036-A activation is NOT reusable;
- source code did not change between the pre-incident base and this fresh canonical base;
- durable P1 artifact persistence/source identity remains the first dependency-ordered implementation gap.

Execution type:
SOURCE + TEST IMPLEMENTATION, then separate canonical documentation commit.

Exact source/test authorization:
- `api/p1_artifacts.py` — NEW
- `api/server.py`
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `tests/test_pipeline1_artifacts.py` — NEW
- `tests/test_pipeline1_body.js`

Exact docs authorization after clean source/test commit:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/decisions.md`
- `.ai/architecture.md`
- `.ai/api_contracts.md`
- `.ai/qa_checklist.md`
- `.ai/migration_status.md`
- `.ai/project.md`

Pipeline 2 authorization:
NONE.

Pipeline 3 authorization:
NONE.

Dependencies/config authorization:
NONE.

036-B/C/D authorization:
NONE.

Owner app verification:
NOT STARTED. NOT AUTHORIZED until PM code-review PASS.

Current gates:
- Execution: NOT STARTED
- Automated verification: WAITING
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING
- Merge permission: BLOCKED

Hard controls:
- `git fetch origin` first;
- read remote ACTIVE + complete primary REV1 spec + complete base annex from this review ref;
- local copies are not authority;
- capture current remote review HEAD as `EXECUTION_BASE_HEAD`;
- use exact fresh worktree `E:\Project AI\_work\036-a-rev1-p1-artifact-persistence`;
- verify annex blob and all annex source/docs blob gates;
- editor/write-file edits only;
- no shell-based generation/editing;
- no unlisted command;
- no decorative `Write-Output`/`echo` commands;
- only exact exit-code diagnostic forms are allowed;
- source/test and docs must be separate commits;
- no reset/restore/checkout/clean/rebase/amend/force push;
- no `git add .` / `git add -A`;
- no `npm start` before PM code review;
- no real provider/network calls;
- no 036-B/C/D;
- no merge.

Next permitted action:
Anti executes the exact remote REV1 primary spec plus mandatory base annex, publishes the two required commits fast-forward to this branch, and stops at WAITING_PM_REVIEW. Project Manager then reviews the source and full PR diff directly on GitHub before any Owner app test.
