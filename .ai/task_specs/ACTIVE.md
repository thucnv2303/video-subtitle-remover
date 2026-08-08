# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Spec:
`.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A.md`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical base SHA:
`07e31d8a7cdd26565e6d6528f7bdc15693cc4698`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Draft PR:
`#19`

Accepted Audit 035 evidence:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md`

Why this task is active:
- Audit 035 is PM VERIFIED and its documentation closeout PR #18 is MERGED.
- The first dependency-ordered implementation gap is durable P1 artifact persistence plus source identity.
- Higher-level scene/multimodal/remix artifacts depend on this foundation and remain out of scope.

Execution type:
SOURCE + TEST IMPLEMENTATION, followed by canonical documentation synchronization.

Anti source/test authorization is exactly:
- `api/p1_artifacts.py` — NEW
- `api/server.py`
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `tests/test_pipeline1_artifacts.py` — NEW
- `tests/test_pipeline1_body.js`

Anti documentation authorization after a clean source/test commit is exactly:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/decisions.md`
- `.ai/architecture.md`
- `.ai/api_contracts.md`
- `.ai/qa_checklist.md`
- `.ai/migration_status.md`
- `.ai/project.md`

Pipeline 2 source authorization:
NONE.

Pipeline 3 source authorization:
NONE.

Dependency/config authorization:
NONE.

036-B/C/D authorization:
NONE.

Owner app verification:
NOT STARTED. Owner testing is NOT authorized until Project Manager code-review PASS after Anti publication.

Current gates:
- Execution: NOT STARTED
- Automated verification: WAITING
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING
- Merge permission: BLOCKED

Hard rules:
- `git fetch origin` first;
- read this ACTIVE and the full referenced spec directly from this remote review ref;
- local ACTIVE/spec is not authority;
- capture current remote review HEAD as `EXECUTION_BASE_HEAD` after fetch;
- use the exact isolated worktree and exact blob gates in the spec;
- source/test edits and documentation edits use editor/write-file capability only;
- no shell-based editing/generation;
- no unlisted command;
- on first failure or unexpected result, STOP and do not self-repair;
- source/test and docs must be separate commits;
- no source/test path outside the six-file allowlist;
- no documentation path outside the nine-file allowlist;
- no `git add .` or `git add -A`;
- no reset/restore/checkout/clean/rebase/amend/force push;
- do not run `npm start`;
- do not run real provider/network calls;
- do not start 036-B/C/D;
- do not merge PR #19.

Next permitted action:
Anti executes the exact remote 036-A spec, runs the required deterministic tests, publishes separate source/test and documentation commits to PR #19, and stops at `WAITING_PM_REVIEW`. Project Manager then reviews the source/diff directly on GitHub. Only after code-review PASS may Owner run the real application.