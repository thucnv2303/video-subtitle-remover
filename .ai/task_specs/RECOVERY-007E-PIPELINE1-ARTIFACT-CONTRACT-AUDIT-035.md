# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035

## 0. Hard execution contract

This is a READ-ONLY PRODUCT AUDIT plus documentation publication.

Application source, tests, dependencies, configuration, runtime outputs and existing evidence are READ-ONLY.

The executor may create/update only these four files:

1. `.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`
2. `.ai/current_state.md`
3. `.ai/task_current.md`
4. `.ai/handoff.md`

The three existing dynamic state files MUST be changed only by the PM-authored helper in this spec.

Do not implement any artifact contract.
Do not refactor.
Do not fix any discovered bug.
Do not modify Pipeline 1, Pipeline 2 or Pipeline 3 source.
Do not run the real app.
Owner verification is NOT REQUIRED for this audit.

On the first unexpected result, failed assertion, source-basis mismatch, helper failure, unlisted required command, or remote-head move:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

If a required command is not explicitly authorized below:

`STOP — COMMAND NOT AUTHORIZED`

No reset, restore, checkout, clean, revert, rebase, amend, force push, history rewrite, wildcard delete, broad formatter, line-ending conversion, Set-Content, Out-File, or ad-hoc repair script is authorized.

## 1. Task identity

Task ID:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical activation basis:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Reviewed application source identity:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Audit report path:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`

PM closeout helper:
`.ai/task_specs/tools/close_pipeline1_artifact_audit_035.py`

Expected helper blob:
`dc284e9e149ad6428d789823fa74bcb907351e58`

## 2. Why this is the next task

Canonical `.ai/project.md` says the ordered recovery milestone after recovery documentation is a read-only audit of the current Pipeline 1 implementation and a gap analysis against the target artifact contract.

Canonical `.ai/migration_status.md` says Pipeline 1 is the current technical priority, calls for an audit before implementation of `jobs/<job_id>/p1/` JSON artifacts, and explicitly says Pipeline 3 is not the next task.

Canonical `.ai/architecture.md` defines the proposed Pipeline 1 outputs and source-identity boundary:

- `scenes.json`
- `multimodal_timeline.json`
- `remix_script.json`
- `edit_plan.json`
- TTS/voice output
- SRT based on TTS timing
- artifact directory `jobs/<job_id>/p1/`
- every pipeline artifact must carry `job_id`, `source_fingerprint`, source duration, `FPS/timebase`, and artifact version

This task must determine what exists in code today and what is missing. It does not authorize implementing the target.

## 3. Remote-only execution authority

Executor must begin from the repository containing the remote and run:

1. `git fetch origin`
2. Read remote ACTIVE only from:
   `origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`
3. Use:
   `git show "origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035:.ai/task_specs/ACTIVE.md"`
4. Confirm ACTIVE points to this exact spec.
5. Read this full spec with `git show` from the same remote ref.
6. Capture:
   `EXECUTION_BASE_HEAD = git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

Local ACTIVE/spec copies are not authority.

If ACTIVE is unreadable:
`STOP — ACTIVE SPEC NOT AVAILABLE ON REMOTE`

If this spec is missing:
`STOP — ACTIVE SPEC TARGET MISSING`

## 4. Worktree

Required new isolated worktree:

`E:\Project AI\_audit\035-pipeline1-artifact-contract`

Before creation:

`Test-Path "E:\Project AI\_audit\035-pipeline1-artifact-contract"`

Expected: `False`.

If it exists:
`STOP — AUDIT 035 WORKTREE ALREADY EXISTS`

Create detached worktree at `EXECUTION_BASE_HEAD` only.

Do not remove or repair any prior worktree.

## 5. Source-basis preflight

The reviewed application source must remain an ancestor of `EXECUTION_BASE_HEAD`:

`git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"`

Expected exit code: 0.

Then inspect:

`git diff --name-only "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"`

Every returned path must be under `.ai/`.

If any application source/test/dependency path appears:

`STOP — REVIEWED SOURCE IDENTITY MOVED`

Inside the worktree verify `git status --short` is empty.

## 6. Exact input blob gate

The following blobs must match before audit publication work begins:

Canonical/governance basis:

- `.ai/project.md` = `c58c90374100ec62fd24d4f2dd9e84e58744e139`
- `.ai/architecture.md` = `6beb2b8a1c1d2e9cb9a31bf3a0d896c073115775`
- `.ai/migration_status.md` = `68ef23e0cf7bcffb995afa168965438146186a8f`
- `.ai/current_state.md` = `29cdb4357a5f339a4826bb6a7be1c267bf7f148e`
- `.ai/task_current.md` = `07a8e6c3dcd88cc38f213c05638834d829361266`
- `.ai/handoff.md` = `793026f262859719e96080e18cb4d7fb32835016`
- `.ai/bugs.md` = `30ec90df1e31e251bf40cdc4ea7b1ee7d483470b`
- `.ai/api_contracts.md` = `ce47db38dbf6fec7b1a9c2450c2f4467341e522c`
- PM helper = `dc284e9e149ad6428d789823fa74bcb907351e58`

Primary source basis:

- `src/renderer/js/app.js` = `2afdb3ad480fef78cf5419f9db5032da570c86bf`
- `src/renderer/js/api.js` = `a578c9ee3fc63aea083ea27af335dd21c3903fc1`
- `src/renderer/js/store.js` = `e02427237800b70cfaba5c150444d5d897f03211`
- `src/renderer/js/pipelines/pipeline1-ai.js` = `83424e1ba86fe94d6357b6cf89c1dac3bbf99436`
- `src/main/main.js` = `cafc5b4d0f94b3d4c6ebbce18535fb7c0d7e21e3`
- `src/main/preload.js` = `c64cb89bf4b06c29c503747da642d6fe9faf4ca5`
- `src/main/python-bridge.js` = `0c37ab9fc3a61303f4b910055149186f7f76141d`
- `api/server.py` = `b3b1e712bd29ce7825788da9c3f7c345863141f5`
- `api/tts_engine.py` = `bb5d5e20d127bd4e1c2c5ecc64987db2dc53f521`

Use only `git hash-object <exact file>` for this gate.

Any mismatch:

`STOP — AUDIT 035 BASIS MISMATCH`

## 7. Authorized read scope

The audit may read, but must not modify:

Canonical docs:

- `.ai/project.md`
- `.ai/architecture.md`
- `.ai/migration_status.md`
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/bugs.md`
- `.ai/qa_checklist.md`
- `.ai/api_contracts.md`

Product source:

- `src/renderer/index.html`
- `src/renderer/js/app.js`
- `src/renderer/js/api.js`
- `src/renderer/js/store.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/js/pipelines/pipeline2-remove.js` only for boundary verification
- `src/renderer/js/pipelines/pipeline3-finalize.js` only for boundary verification
- `src/main/main.js`
- `src/main/preload.js`
- `src/main/python-bridge.js`
- `api/server.py`
- `api/tts_engine.py`
- existing tests under `tests/` may be READ for evidence, but must not be run or modified unless this spec explicitly says otherwise

If audit evidence points to a required source file outside this list, STOP and report:

`STOP — AUDIT SCOPE INSUFFICIENT`

Do not silently expand scope.

## 8. Authorized shell command whitelist

Only the following command families are authorized:

### Remote/spec/preflight

- `git fetch origin`
- `git show <approved-ref>:<approved-path>`
- `git rev-parse <approved-ref-or-HEAD>`
- `git merge-base --is-ancestor <approved-sha> <approved-sha>`
- `git diff --name-only <approved-sha> <approved-sha>`
- `Test-Path <exact audit worktree path>`
- `git worktree add --detach <exact audit worktree path> <EXECUTION_BASE_HEAD>`
- `$PWD.Path`
- `git status --short`
- `git hash-object <exact file named in this spec>`

### Read-only source inspection

- `git show HEAD:<path>` only for paths in Section 7
- `git grep -n` only against paths in Section 7 and only for audit search terms below

Authorized grep/search terms:

- `scenes.json`
- `multimodal_timeline`
- `remix_script`
- `edit_plan`
- `source_fingerprint`
- `artifact_version`
- `job_id`
- `ttsAudioPath`
- `ttsTimedSrt`
- `karaokeAss`
- `outputPath`
- `finalOutputPath`
- `triggerAutoAiRewrite`
- `triggerAutoTts`
- `aiRewrite`
- `generate-tts`
- `startProcessBatch`
- `processNextJob`
- `analyze`
- `inpaint`
- `subtitle`
- `finalizeVideo`
- `clean_video`
- `fps`
- `duration`
- `timebase`

Do not use broad filesystem search utilities, wildcard rewriting scripts, or generated analysis scripts.

### Audit closeout and publication

- `python -m py_compile .ai/task_specs/tools/close_pipeline1_artifact_audit_035.py`
- `python .ai/task_specs/tools/close_pipeline1_artifact_audit_035.py` exactly once
- `git diff --name-status`
- `git diff --numstat`
- `git -c core.whitespace=cr-at-eol diff --check`
- `git add .ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md .ai/current_state.md .ai/task_current.md .ai/handoff.md`
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- `git -c core.whitespace=cr-at-eol diff --cached --check`
- `git commit -m "docs: publish Pipeline 1 artifact contract audit 035"`
- `git push origin HEAD:review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`
- post-push `git fetch origin`, `git rev-parse HEAD`, `git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`, `git status --short`

No other shell command is authorized.

## 9. Audit questions — mandatory

The report must answer every question below using direct source evidence.

### A. Current Pipeline 1 execution map

Trace the current Pipeline 1 path from user/job action through renderer, Electron IPC/main process and Python backend where applicable.

For each step record:

- file path
- function/symbol
- input fields
- output fields
- persistence behavior
- next caller/consumer

Do not infer a call edge without code evidence.

### B. Current outputs and persistence

Identify all current Pipeline 1 outputs that are:

- only in-memory/job state
- saved to disk
- persisted in application state
- emitted by backend endpoints

Explicitly cover at least:

- rewrite text/script
- TTS audio path
- timed SRT
- karaoke ASS if present
- analysis/OCR/ASR artifacts if the current P1 path actually uses them
- any JSON written for Pipeline 1

For every output, record the exact path/name logic if present.

### C. Proposed artifact contract comparison

For each proposed artifact classify current implementation as exactly one of:

- `IMPLEMENTED`
- `PARTIAL`
- `MISSING`
- `NOT VERIFIED`

Required rows:

- `jobs/<job_id>/p1/`
- `scenes.json`
- `multimodal_timeline.json`
- `remix_script.json`
- `edit_plan.json`
- TTS audio
- SRT based on TTS timing
- `job_id`
- `source_fingerprint`
- source duration
- `FPS/timebase`
- artifact version

Every classification must cite direct file/symbol evidence or an explicit repository search result.

### D. Pipeline boundary verification

Verify current P1 execution does not intentionally perform Pipeline 2 subtitle removal or Pipeline 3 final rendering.

If current source contains shared helpers or legacy code, distinguish:

- code merely present in the repository
- code reachable from the current P1 execution path

Do not mark a boundary violation solely because Pipeline 2/3 functions exist in `app.js` or other shared files.

If a reachable violation is found, record it as a blocker but DO NOT FIX IT.

### E. Source identity

Determine whether the current code has a source identity/fingerprint mechanism usable by future P1/P2/P3 artifact matching.

Search specifically for:

- `source_fingerprint`
- hashing/fingerprint logic associated with video identity
- source duration/FPS/timebase metadata attached to persisted artifacts

If absent, mark MISSING. Do not design cryptographic details in this task beyond listing the missing contract.

### F. Gap matrix

For every gap include:

- Gap ID (`A035-G01`, `A035-G02`, ...)
- required target behavior
- current evidence
- affected files/symbols
- risk if deferred
- dependency order
- proposed future task boundary

### G. Follow-up task breakdown

Propose the minimum safe sequence of future implementation tasks.

Each proposed task must:

- have one narrow responsibility
- list likely source files/symbols
- list acceptance evidence needed
- preserve P1/P2/P3 separation
- avoid combining Pipeline 2 timeline-tolerance verification with Pipeline 1 artifact implementation
- not authorize itself

Do not assign Task 036 automatically unless the evidence justifies a specific next task and PM later activates it.

## 10. Audit report format

Create exactly:

`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`

Use the following required headings exactly:

```text
# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035

## Basis
## Current Pipeline 1 execution map
## Current outputs and persistence
## Target artifact contract comparison
## Pipeline boundary findings
## Gap matrix
## Proposed follow-up task breakdown
## Evidence
## Conclusion
```

The report must contain all required contract terms checked by the PM helper and must be at least 3000 UTF-8 bytes.

For evidence entries use a consistent form such as:

`E-01 | src/renderer/js/pipelines/pipeline1-ai.js | triggerAutoTts | <fact supported by code>`

Do not paste large source excerpts. Short symbol-level excerpts are sufficient.

Do not claim runtime behavior that was not run in this audit. Historical prior tests may be identified as historical evidence only.

## 11. Creating the audit report

The new audit report may be created using the executor's editor/write-file capability.

This is the only manually authored file in this task.

Forbidden for report creation:

- `Set-Content`
- `Out-File`
- ad-hoc Python/Node/PowerShell generator scripts
- whole-repository formatting
- line-ending conversion

Do not manually edit `.ai/current_state.md`, `.ai/task_current.md`, or `.ai/handoff.md`.

## 12. Closeout helper gate

After the audit report is complete, but before staging:

Run:

`python -m py_compile .ai/task_specs/tools/close_pipeline1_artifact_audit_035.py`

Expected exit 0.

If not:

`STOP — AUDIT 035 HELPER SYNTAX INVALID`

Then run the helper exactly once:

`python .ai/task_specs/tools/close_pipeline1_artifact_audit_035.py`

Expected exit 0.

If not:

`STOP — AUDIT 035 CLOSEOUT HELPER FAILED`

Do not run it again.
Do not manually repair the dynamic state files.

The helper verifies the report structure and exact input blobs, then updates only the three dynamic canonical docs to `WAITING_PM_REVIEW` audit state.

## 13. Pre-stage hard gate

After helper success:

Expected changed files are exactly:

- `.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

No other path may be modified or untracked as a result of this task.

Run:

- `git status --short`
- `git diff --name-status`
- `git diff --numstat`
- `git -c core.whitespace=cr-at-eol diff --check`

Hard conditions:

- exact changed file set above
- no source/test/dependency/config change
- no task spec/helper modification
- no line-ending churn
- no huge narrow-doc diff
- whitespace check exit 0

Failure:

`STOP — PUSH NOT AUTHORIZED`

## 14. Stage gate

Stage exactly the four approved files with the exact `git add` command in Section 8.

Then verify:

- cached name-only equals the four approved paths
- cached numstat is consistent with one new audit report plus narrow three-doc state update
- cached whitespace check exit 0

If not:

`STOP — PUSH NOT AUTHORIZED`

Do not unstage using reset/restore/checkout. Stop and report.

## 15. Remote-head guard

Immediately before commit:

1. `git fetch origin`
2. Read remote review head.
3. It must still equal `EXECUTION_BASE_HEAD`.

If remote moved:

`STOP — SPEC BASE MOVED`

Do not rebase or self-repair.

## 16. Commit and push

Exactly one executor commit:

`docs: publish Pipeline 1 artifact contract audit 035`

Push fast-forward only to:

`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035`

No force push.

Anti must not merge the Draft PR.

## 17. Acceptance criteria for PM review

PM will verify directly on GitHub:

1. executor commit exists and is exactly one commit after its captured execution basis;
2. only the four authorized files changed;
3. no application source/test/dependency change;
4. report covers every mandatory audit question;
5. every important finding has direct source evidence;
6. contract classifications do not overclaim implementation;
7. Pipeline 1/2/3 responsibilities remain separated;
8. source identity findings are evidence-based;
9. follow-up task breakdown is narrow and ordered;
10. dynamic docs agree on Audit 035 `WAITING_PM_REVIEW`;
11. Owner app test is not requested for this audit;
12. merge remains BLOCKED until PM review.

## 18. Forbidden actions

Do not:

- modify application source;
- modify tests;
- modify dependencies/config;
- execute Pipeline 1, Pipeline 2 or Pipeline 3;
- run `npm start` or Electron;
- run provider calls;
- expose or inspect raw credentials;
- modify `.ai/architecture.md`, `.ai/api_contracts.md`, `.ai/bugs.md`, `.ai/qa_checklist.md`, `.ai/decisions.md`, `.ai/project.md`, or `.ai/migration_status.md`;
- modify ACTIVE/spec/helper;
- implement any gap found;
- start Task 036;
- merge the audit PR;
- remove old worktrees;
- reset/restore/checkout/clean/revert/rebase/amend;
- use `git add .` or `git add -A`;
- force push.

## 19. Final report schema

Return exactly enough evidence for PM to verify:

- Active spec read directly from remote ref: YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- Worktree path
- Initial HEAD
- Initial `git status --short`
- Reviewed-source ancestry result
- Post-source changed paths result
- Exact blob-gate outputs
- Audit report path
- Audit conclusion summary: maximum 10 bullets
- Count of gap-matrix rows
- Proposed future task count and names
- Boundary result: P1/P2/P3
- Source identity result
- Helper syntax-gate exit code
- Helper exit code and full helper output
- Exact modified files
- `git diff --name-status`
- `git diff --numstat`
- whitespace check result
- cached name-only
- cached numstat
- cached whitespace result
- Executor commit SHA
- Remote HEAD after push
- Final `git status --short`
- Application source changed: YES/NO
- Tests changed: YES/NO
- Task 036 started: YES/NO
- Forbidden command used: YES/NO
- Owner verification required: NO
- Merge: BLOCKED

Final status must be:

`WAITING_PM_REVIEW`

Do not call the audit PASS yourself. Project Manager decides after GitHub review.
