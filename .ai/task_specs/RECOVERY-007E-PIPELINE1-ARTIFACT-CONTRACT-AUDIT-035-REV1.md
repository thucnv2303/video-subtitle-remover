# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1

## 0. Hard execution contract

This is a READ-ONLY PRODUCT AUDIT RECOVERY task.

The previous Audit 035 executor publication is INVALIDATED because the executor continued after a helper failure and used commands outside the approved shell whitelist. Its report is candidate material only, not proof.

This REV1 task deliberately removes the executor closeout helper and removes executor authority to edit dynamic canonical state.

Executor may create exactly ONE file:

`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md`

No existing file may be modified by the executor.

On the first unexpected result, failed command, source-basis mismatch, unlisted required command, remote-head move, or inability to use the editor/write-file capability:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

If a required command is not explicitly authorized below:

`STOP — COMMAND NOT AUTHORIZED`

No reset, restore, checkout, clean, revert, rebase, amend, force push, history rewrite, wildcard delete, formatter, line-ending conversion, Set-Content, Out-File, New-Item, shell redirection for report creation, `[System.IO.File]` write/edit operations, or ad-hoc Python/Node/PowerShell report generator is authorized.

## 1. Task identity

Task ID:
`RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical basis SHA:
`55be60509a94b4e6f18397dd691b42fd95776faa`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`

Reviewed application source identity:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Invalidated candidate report commit:
`2a5319cb8b46bee6a90d9181bf53d870403c17b4`

Candidate report path:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`

REV1 report path:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md`

Incident record:
`.ai/incidents/INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001.md`

## 2. Authority and purpose

The executor must independently re-verify the substantive Audit 035 claims against canonical source. The invalidated report may be read only as a checklist/candidate reference.

Do not copy a candidate claim into REV1 unless direct source evidence supports it.

This task does NOT implement artifacts, fix routing, modify code, run the application, run tests, or authorize Task 036.

After REV1 publication, Project Manager reviews GitHub source and the REV1 report. Only Project Manager may then perform deterministic updates to `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`, `.ai/bugs.md`, `.ai/architecture.md`, `.ai/qa_checklist.md`, or other canonical knowledge files.

## 3. Remote-only execution authority

Begin with:

1. `git fetch origin`
2. Read remote ACTIVE only from:
   `origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`
3. Read this full spec from the same remote ref.
4. Capture:
   `EXECUTION_BASE_HEAD = git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`

Local ACTIVE/spec copies are not authority.

## 4. Isolated worktree

Required worktree:

`E:\Project AI\_audit\035-rev1-pipeline1-artifact-contract`

Before creation:

`Test-Path "E:\Project AI\_audit\035-rev1-pipeline1-artifact-contract"`

Expected: `False`.

If it exists:
`STOP — AUDIT 035 REV1 WORKTREE ALREADY EXISTS`

Create detached worktree at `EXECUTION_BASE_HEAD` only.

After creation, only the following navigation command is authorized:

`Set-Location "E:\Project AI\_audit\035-rev1-pipeline1-artifact-contract"`

or exact-path alias:

`cd "E:\Project AI\_audit\035-rev1-pipeline1-artifact-contract"`

Do not remove or repair any prior Audit 035 worktree.

## 5. Source-basis preflight

Run:

`git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"`

Expected exit 0.

Run:

`git diff --name-only "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"`

Every returned path must be under `.ai/`.

If any application source/test/dependency path appears:

`STOP — REVIEWED SOURCE IDENTITY MOVED`

Inside the worktree `git status --short` must be empty.

## 6. Exact blob gate

Verify with `git hash-object <exact file>`:

Canonical/source basis:
- `.ai/project.md` = `c58c90374100ec62fd24d4f2dd9e84e58744e139`
- `.ai/architecture.md` = `6beb2b8a1c1d2e9cb9a31bf3a0d896c073115775`
- `.ai/migration_status.md` = `68ef23e0cf7bcffb995afa168965438146186a8f`
- `.ai/current_state.md` = `29cdb4357a5f339a4826bb6a7be1c267bf7f148e`
- `.ai/task_current.md` = `07a8e6c3dcd88cc38f213c05638834d829361266`
- `.ai/handoff.md` = `793026f262859719e96080e18cb4d7fb32835016`
- `.ai/bugs.md` = `30ec90df1e31e251bf40cdc4ea7b1ee7d483470b`
- `.ai/api_contracts.md` = `ce47db38dbf6fec7b1a9c2450c2f4467341e522c`
- `src/renderer/js/app.js` = `2afdb3ad480fef78cf5419f9db5032da570c86bf`
- `src/renderer/js/api.js` = `a578c9ee3fc63aea083ea27af335dd21c3903fc1`
- `src/renderer/js/store.js` = `e02427237800b70cfaba5c150444d5d897f03211`
- `src/renderer/js/pipelines/pipeline1-ai.js` = `83424e1ba86fe94d6357b6cf89c1dac3bbf99436`
- `src/main/main.js` = `cafc5b4d0f94b3d4c6ebbce18535fb7c0d7e21e3`
- `src/main/preload.js` = `c64cb89bf4b06c29c503747da642d6fe9faf4ca5`
- `src/main/python-bridge.js` = `0c37ab9fc3a61303f4b910055149186f7f76141d`
- `api/server.py` = `b3b1e712bd29ce7825788da9c3f7c345863141f5`
- `api/tts_engine.py` = `bb5d5e20d127bd4e1c2c5ecc64987db2dc53f521`

Any mismatch:

`STOP — AUDIT 035 REV1 BASIS MISMATCH`

## 7. Authorized read scope

May read only:

Canonical:
- `.ai/project.md`
- `.ai/architecture.md`
- `.ai/migration_status.md`
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/bugs.md`
- `.ai/qa_checklist.md`
- `.ai/api_contracts.md`
- `.ai/incidents/INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001.md`

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

Candidate reference:
- exact candidate report from commit `2a5319cb8b46bee6a90d9181bf53d870403c17b4` only.

If evidence requires a source file outside this list:

`STOP — AUDIT 035 REV1 SCOPE INSUFFICIENT`

## 8. Authorized shell command whitelist

Only these shell command families are authorized.

Remote/preflight:
- `git fetch origin`
- `git show <approved-ref>:<approved-path>`
- `git rev-parse <approved-ref-or-HEAD>`
- `git merge-base --is-ancestor <approved-sha> <approved-sha>`
- `git diff --name-only <approved-sha> <approved-sha>`
- `Test-Path <exact REV1 worktree path>`
- `git worktree add --detach <exact REV1 worktree path> <EXECUTION_BASE_HEAD>`
- exact `Set-Location` / `cd` command from Section 4
- `$PWD.Path`
- `git status --short`
- `git hash-object <exact file named in Section 6>`

Read-only source inspection:
- `git show HEAD:<path>` only for paths in Section 7
- `git show 2a5319cb8b46bee6a90d9181bf53d870403c17b4:.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md`
- `git grep -n` only against paths in Section 7 and only for these search terms:
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
  - `tts-retry`
  - `startProcessBatch`
  - `processNextJob`
  - `processPipeline1Queue`
  - `onJobFinished`
  - `finalizeVideo`
  - `clean_video`
  - `inpaint`
  - `subtitle`
  - `fps`
  - `duration`
  - `timebase`
  - `saveState`
  - `loadState`

`git grep` exit handling:
- exit 0: matches found, record evidence;
- exit 1: expected no-match evidence, not a command failure;
- exit >1: STOP immediately.

Publication:
- `git diff --name-status`
- `git diff --numstat`
- `git -c core.whitespace=cr-at-eol diff --check`
- `git add .ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md`
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- `git -c core.whitespace=cr-at-eol diff --cached --check`
- `git fetch origin`
- `git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`
- `git commit -m "docs: publish Pipeline 1 artifact contract audit 035 rev1"`
- `git push origin HEAD:review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`
- post-push `git rev-parse HEAD`, `git fetch origin`, remote `git rev-parse`, `git status --short`

No other shell command is authorized.

## 9. Report creation rule

Create the REV1 report only with the executor's editor/write-file capability.

If that capability is unavailable:

`STOP — APPROVED REPORT WRITE CAPABILITY UNAVAILABLE`

Do not create or mutate the report using shell commands.

The report is the only executor-authored file.

## 10. Mandatory review questions

The report must independently verify:

1. The real current dedicated P1 execution path from UI/job action through renderer/backend.
2. Whether a legacy post-inpaint P1 coupling exists and whether it is reachable.
3. Every current P1 output and whether it is memory-only, persisted application state, backend-emitted, or disk-persisted.
4. Whether `store.js` persists job/P1 outputs or settings only.
5. Presence/classification of:
   - `jobs/<job_id>/p1/`
   - `scenes.json`
   - `multimodal_timeline.json`
   - `remix_script.json`
   - `edit_plan.json`
   - TTS audio
   - TTS-timed SRT
   - `job_id`
   - `source_fingerprint`
   - source duration
   - FPS/timebase
   - artifact version
6. P1→P2 boundary reachability.
7. P1→P3 boundary reachability.
8. Source identity/fingerprint availability.
9. Minimum dependency-ordered implementation sequence.
10. Whether candidate report commit `2a5319...` conclusions are ACCEPTED, CORRECTED, or REJECTED.

Do not claim runtime behavior; app/tests are not run in this audit.

## 11. Required report headings

Create exactly:

`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md`

Required headings exactly:

```text
# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1

## Basis
## Candidate report reconciliation
## Current Pipeline 1 execution map
## Current outputs and persistence
## Target artifact contract comparison
## Pipeline boundary findings
## Gap matrix
## Proposed follow-up task breakdown
## Evidence
## Conclusion
```

Under `## Candidate report reconciliation`, enumerate candidate conclusions 1 through 10 from the invalidated report and classify each exactly one of:
- `ACCEPTED`
- `CORRECTED`
- `REJECTED`

Every CORRECTED/REJECTED item must state direct source evidence.

Report must contain the exact contract terms:
- `scenes.json`
- `multimodal_timeline.json`
- `remix_script.json`
- `edit_plan.json`
- `source_fingerprint`
- `job_id`
- `FPS/timebase`
- `artifact version`
- `Pipeline 1`
- `Pipeline 2`
- `Pipeline 3`

Minimum size: 3000 UTF-8 bytes.

## 12. Pre-stage hard gate

Before staging, expected changed file set is exactly ONE file:

`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1.md`

Run the publication checks in Section 8.

Hard conditions:
- exact one-file change;
- no source/test/dependency/config change;
- no existing `.ai` file modified;
- no task spec modification;
- no line-ending churn in existing files;
- whitespace check exit 0.

Failure:

`STOP — PUSH NOT AUTHORIZED`

## 13. Remote-head guard

Immediately before commit:
- `git fetch origin`
- remote review head must equal `EXECUTION_BASE_HEAD`.

If it moved:

`STOP — SPEC BASE MOVED`

Do not rebase or repair.

## 14. Commit and push

Exactly one executor commit:

`docs: publish Pipeline 1 artifact contract audit 035 rev1`

Push fast-forward only to:

`review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1`

Do not merge the Draft PR.

## 15. Final report schema

Return:
- Active spec read directly from remote ref: YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- Worktree path
- Initial HEAD/status
- Reviewed-source ancestry result
- Exact blob-gate results
- Candidate report read: YES/NO
- Audit report path and byte size
- Candidate conclusions: counts ACCEPTED / CORRECTED / REJECTED
- Gap count
- Proposed follow-up task count/order
- P1/P2 boundary result
- P1/P3 boundary result
- Source identity result
- Exact changed files
- diff name-status
- diff numstat
- whitespace check
- cached name-only/numstat/whitespace
- executor commit SHA
- remote HEAD after push
- final status
- application source changed: NO
- tests/dependencies changed: NO
- existing dynamic canonical docs changed: NO
- Task 036 started: NO
- forbidden command used: NO
- merge: BLOCKED
- status: WAITING_PM_REVIEW

## 16. PM acceptance

Project Manager will verify the REV1 report and direct source evidence on GitHub.

If Audit 035 REV1 review PASS:
- PM will perform canonical state synchronization through GitHub API;
- PM will document closure of `INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001`;
- PM will choose the first implementation task based on verified dependency order;
- Task 036 is not authorized until that PM decision is published.
