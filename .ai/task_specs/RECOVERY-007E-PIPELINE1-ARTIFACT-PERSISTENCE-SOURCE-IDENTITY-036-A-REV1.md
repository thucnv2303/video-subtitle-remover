# RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1

## 0. HARD EXECUTION CONTRACT

This is the fresh, versioned SOURCE-CODE implementation task after Incident 003 / Ratification 004.

Remote authority only:
- branch: `origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`
- ACTIVE: `.ai/task_specs/ACTIVE.md`
- primary spec: this file
- mandatory base annex: `.ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1-BASE-ANNEX.md`

The primary spec + mandatory base annex together are the complete execution contract.

The annex must have exact Git blob:
`32c2237833ca8004fd5402d5912618460e3ed40c`

The annex is a byte-identical copy of the unexecuted pre-incident 036-A implementation design. Its stale task identity, old branch, old canonical base, old worktree path, old push target, and old docs task wording are NOT authority. This REV1 spec overrides them explicitly below.

Authority precedence:
1. project safety/governance and D-012;
2. this REV1 spec;
3. mandatory base annex for implementation/test details not overridden here;
4. canonical state / source evidence.

On the first failed command, failed test, failed assertion, unexpected result, blob mismatch, unauthorized changed file, remote-head move, or need for an unlisted command/file:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

If a required command is not explicitly authorized by this REV1 spec or the annex whitelist as overridden here:

`STOP — COMMAND NOT AUTHORIZED`

If required work exceeds the exact file/symbol scope:

`STOP — SPEC SCOPE INSUFFICIENT`

Do NOT use, repair, reopen, or execute from cancelled PR #19 or branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Do NOT use any local copy of ACTIVE/spec/annex as authority.

Forbidden remains exactly as in the annex, including reset/restore/checkout/clean/revert/rebase/amend, force push, `git add .`, `git add -A`, shell-based editing/generation, dependency changes, Pipeline 2/Pipeline 3 implementation changes, real credential/provider calls, scene/multimodal/remix/final-render work, and starting 036-B/C/D.

Additional explicit prohibition after prior incidents:
- no decorative/separator shell output commands such as `Write-Output "---"`, `echo "---"`, or equivalent;
- the ONLY allowed `echo`/`Write-Output` commands are the exact exit-code diagnostics already authorized by the annex: `echo "Exit: $LASTEXITCODE"` or `Write-Output "Exit: $LASTEXITCODE"` immediately after an approved command.

All edits must use editor/write-file capability as required by the annex.

## 1. Task identity and fresh basis

Task ID:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

Name:
Pipeline 1 Artifact Persistence + Source Identity Foundation — REV1

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Fresh canonical base SHA after Incident 003 Ratification 004:
`57c037ad3cfaf400f9f6a6ffd36d8449e6a16267`

Prior pre-incident canonical base used by the annex:
`07e31d8a7cdd26565e6d6528f7bdc15693cc4698`

Reviewed application source identity inherited from Task 034:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`

Accepted Audit 035 evidence:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md`

Incident resolution evidence:
`.ai/incidents/INCIDENT-RECOVERY-007E-AUDIT035-CLOSEOUT-RATIFICATION-004.md`

## 2. Why the annex remains technically valid

GitHub compare from `07e31d8a...` to fresh canonical base `57c037ad...` contains only `.ai/` incident/ratification/governance files. No application source, tests, dependencies, or configuration changed.

Therefore:
- all source/test blob gates in annex Section 5 remain exact;
- all nine canonical documentation blob gates in annex Section 6 remain exact;
- `api/p1_artifacts.py` and `tests/test_pipeline1_artifacts.py` must still not exist before implementation;
- all product requirements and acceptance tests in annex Sections 3-15 remain normative.

Anti must verify this unchanged-source fact during preflight with the authorized compare command described below. Any non-`.ai/` path between those canonical bases means:

`STOP — REV1 SOURCE BASIS MOVED`

## 3. Exact overrides to the base annex

Every occurrence of the following annex values is superseded:

### 3.1 Task identity
Annex task `...036-A` -> this task `...036-A-REV1`.

### 3.2 Canonical base
Annex canonical base SHA `07e31d8a7cdd26565e6d6528f7bdc15693cc4698` -> fresh base:
`57c037ad3cfaf400f9f6a6ffd36d8449e6a16267`.

The old SHA remains authorized only for the read-only unchanged-source comparison in Section 2.

### 3.3 Review branch and publication target
Annex branch/push target `review/...036-A` -> exactly:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`.

### 3.4 Required isolated worktree
Replace annex Section 21 path with exactly:
`E:\Project AI\_work\036-a-rev1-p1-artifact-persistence`

Before creation, `Test-Path` must return `False`.
If it exists:

`STOP — 036-A-REV1 WORKTREE ALREADY EXISTS`

Do not remove/reuse any old 036-A worktree.

### 3.5 Documentation wording
In annex Section 17 required canonical updates:
- record task as `RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`;
- record fresh source base `57c037ad3cfaf400f9f6a6ffd36d8449e6a16267`;
- record cancelled PR #19/original 036-A activation as historical incident containment, not as an active task;
- code review `WAITING_PM_REVIEW`;
- Owner app verification `NOT STARTED`;
- documentation synchronization `WAITING_PM_REVIEW`;
- merge `BLOCKED`;
- 036-B/C/D `NOT AUTHORIZED`.

Do not claim `ea9521...` is the new implementation source after the new source commit; the new source commit is pending PM review.

### 3.6 Commit messages
Source/test commit remains exactly:
`feat: add Pipeline 1 artifact persistence foundation`

Documentation commit is overridden to exactly:
`docs: record Pipeline 1 artifact persistence 036-A-REV1 review state`

### 3.7 Remote-head guard / push
All remote-head guard and push commands must use the REV1 review branch.
The remote REV1 head immediately before push must still equal captured `EXECUTION_BASE_HEAD`.

### 3.8 Start-of-execution ancestry
Verify fresh canonical base `57c037ad...` is an ancestor of `EXECUTION_BASE_HEAD`.

`git diff --name-only "57c037ad3cfaf400f9f6a6ffd36d8449e6a16267" "$EXECUTION_BASE_HEAD"`

must contain only PM control files under `.ai/task_specs/` before executor mutation.

Also verify:

`git diff --name-only "07e31d8a7cdd26565e6d6528f7bdc15693cc4698" "57c037ad3cfaf400f9f6a6ffd36d8449e6a16267"`

contains only `.ai/` paths.

## 4. Normative implementation requirements

Read the mandatory base annex completely.

The following annex sections remain normative without semantic change except overrides in Section 3 above:
- Section 3 — PM v1 design decisions;
- Section 4 — exact six-file source/test allowlist;
- Section 5 — exact source/test blob gates;
- Section 6 — exact nine documentation blob gates;
- Sections 7-11 — backend and renderer implementation;
- Section 12 — explicit non-goals;
- Sections 13-14 — backend and renderer tests;
- Section 15 — seven exact automated verification commands and acceptance;
- Section 16 — clean source/test staging and source commit;
- Section 17 — nine canonical knowledge updates, with REV1 wording/base override;
- Section 18 — documentation staging, with REV1 docs commit message override;
- Section 20 — command whitelist, subject to REV1 additions/substitutions;
- Section 23 — required delivery gate state;
- Section 24 — final report fields, using REV1 task/basis/branch values.

Key product scope remains exactly:
- NEW `api/p1_artifacts.py`;
- modify `api/server.py`;
- modify `src/renderer/js/app.js`;
- modify `src/renderer/js/pipelines/pipeline1-ai.js`;
- NEW `tests/test_pipeline1_artifacts.py`;
- modify `tests/test_pipeline1_body.js`.

No other source/test/config/dependency file is authorized.

The v1 contract remains:
- `<jobs_root>/<job_id>/p1/`;
- `VIDEO_SUBTITLE_REMOVER_JOBS_ROOT` override else `<backend cwd>/jobs`;
- safe job id `^[A-Za-z0-9_-]{1,128}$`;
- streamed full-file SHA-256 fingerprint `sha256:<64 lowercase hex>` with 4 MiB chunks;
- OpenCV FPS/frame-count metadata and FPS-derived v1 timebase;
- `artifact_version = "1"`;
- `manifest.json`, `raw.srt`, `tts.mp3`, `tts.srt`, optional `karaoke.ass`;
- fail-closed source-identity mismatch;
- atomic metadata/text replacement;
- identity-aware TTS while preserving legacy no-identity TTS behavior.

Do not implement `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`, routing cleanup, Pipeline 2 changes, Pipeline 3 changes, or app job-list rehydration.

## 5. Required tests

Run the seven exact annex Section 15 commands, unchanged:
1. `python -m py_compile api/p1_artifacts.py api/server.py tests/test_pipeline1_artifacts.py`
2. `python tests/test_pipeline1_artifacts.py`
3. `.\node_modules\.bin\electron.cmd tests\test_pipeline1_runtime.js`
4. `node tests/test_renderer_dom_structure.js`
5. `node --check src/renderer/js/app.js`
6. `node --check src/renderer/js/pipelines/pipeline1-ai.js`
7. `git -c core.whitespace=cr-at-eol diff --check`

Acceptance remains:
- all exit 0;
- Python artifact test 0 FAIL;
- Pipeline 1 runtime 0 FAIL / 0 NOT TESTED;
- DOM test 0 FAIL;
- no real provider call;
- do not claim clean renderer console if the known non-fatal harness warning appears.

Do NOT run `npm start` before PM code review.

## 6. REV1 preflight sequence

After `git fetch origin`:
1. read remote `ACTIVE.md` from the REV1 branch;
2. confirm Active Task is this REV1 task;
3. read this entire primary spec from the same remote ref;
4. read the entire mandatory base annex from the same remote ref;
5. verify annex with `git hash-object` after worktree creation = `32c2237833ca8004fd5402d5912618460e3ed40c`;
6. capture `EXECUTION_BASE_HEAD = git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1`;
7. verify fresh canonical base ancestry;
8. verify fresh-base -> execution-head changed paths are PM `.ai/task_specs/` control files only;
9. verify old-base -> fresh-base changed paths are `.ai/` only;
10. create the exact new detached worktree;
11. initial status must be clean;
12. run all annex source/test and docs blob gates plus annex blob gate.

Any mismatch = STOP.

## 7. Command authorization clarification

The annex Section 20 positive whitelist remains in force with exact REV1 branch/base/worktree substitutions.

Additionally authorized read-only commands are only those needed to read/verify:
- this remote REV1 spec;
- the remote base annex;
- the two exact compare commands in Sections 2/3;
- `git hash-object .ai/task_specs/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A-REV1-BASE-ANNEX.md`.

No generic shell output/decorative commands are added.

Exact exit-code diagnostics remain the only authorized `echo`/`Write-Output` use.

## 8. Publication gates

Create exactly two executor commits in order:
1. source/test commit — exact six source/test files only;
2. docs commit — exact nine canonical documentation files only.

No push until both commits exist and are individually verified clean.

Immediately before push:
- `git fetch origin`;
- REV1 remote head must equal captured `EXECUTION_BASE_HEAD`;
- otherwise `STOP — SPEC BASE MOVED`.

Push normal fast-forward only to the REV1 branch.
Do not edit PR metadata.
Do not merge.
Do not start 036-B/C/D.

## 9. Required delivery state

After successful push:
- Execution: PASS
- Automated verification: PASS
- Code review: WAITING_PM_REVIEW
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING_PM_REVIEW
- 036-B/C/D: NOT AUTHORIZED
- Merge permission: BLOCKED
- STATUS: WAITING_PM_REVIEW

Owner app testing is NOT authorized until Project Manager reviews the source diff and explicitly records code-review PASS.

## 10. Final report

Use the annex Section 24 report schema, but report this REV1 task ID, fresh canonical base, REV1 worktree, REV1 branch, source commit, docs commit, and remote head.

Also report:
- base annex read directly from remote: YES/NO;
- base annex blob hash result;
- old-base -> fresh-base `.ai/`-only comparison result;
- decorative/unlisted shell output commands used: NO.
