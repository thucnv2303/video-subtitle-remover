# RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A

## 0. HARD EXECUTION CONTRACT

This is a SOURCE-CODE implementation task with strict D-012 executor control.

Remote authority only:
- branch: `origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`
- ACTIVE: `.ai/task_specs/ACTIVE.md`
- spec: this file

Local ACTIVE/spec copies are not authority.

On the first failed command, unexpected result, basis mismatch, unauthorized changed file, failed test, remote-head move, or need for a command/file outside this spec:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

If a required command is not explicitly authorized:

`STOP — COMMAND NOT AUTHORIZED`

If the required implementation cannot be completed inside the allowed source/test/doc files and symbols:

`STOP — SPEC SCOPE INSUFFICIENT`

Forbidden:
- reset, restore, checkout, clean, revert, rebase, amend;
- force push or history rewrite;
- `git add .` or `git add -A`;
- wildcard delete or wildcard staging;
- whole-repository formatters;
- line-ending conversion;
- shell-based file generation/editing (`Set-Content`, `Out-File`, shell redirection, `[System.IO.File]` write/edit, ad-hoc Python/Node/PowerShell patch generators);
- dependency install/update;
- source changes outside the exact source/test allowlist;
- any Pipeline 2/Pipeline 3 implementation change;
- scene detection, multimodal timeline, remix planning, final rendering;
- provider/network calls with real credentials;
- raw credential logging;
- merge of the Draft PR;
- starting 036-B/C/D.

Use the editor/write-file capability for source/test/document edits.

Exact diagnostic commands `echo "Exit: $LASTEXITCODE"` or `Write-Output "Exit: $LASTEXITCODE"` are authorized immediately after an approved command only to display that command's exit code.

## 1. Task identity

Task ID:
`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Name:
Pipeline 1 Artifact Persistence + Source Identity Foundation

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical base SHA after Audit 035 closeout merge:
`07e31d8a7cdd26565e6d6528f7bdc15693cc4698`

Reviewed application source identity inherited from Task 034:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Review branch:
`review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Draft PR:
The Draft PR whose head is the review branch above. PM will record the exact PR number in the PR body before executor dispatch.

Accepted audit evidence:
`.ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-PM-VERIFIED.md`

## 2. Why this task exists

Audit 035 established:
- dedicated `processPipeline1Queue()` is the authoritative P1-only ASR -> AI rewrite -> TTS path;
- current P1 job fields are session-memory-only;
- TTS audio is disk-backed but currently emitted to a temp/backend-derived path;
- `jobs/<job_id>/p1/` is missing;
- `source_fingerprint`, artifact version and durable source timing metadata are missing;
- higher-level artifacts (`scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`) must NOT be implemented until this foundation exists.

This task implements only that foundation.

## 3. PM design decisions for 036-A

These decisions are normative for this task and must be recorded in canonical documentation by the docs commit.

### 3.1 Artifact root

P1 v1 artifacts live under:

`<jobs_root>/<job_id>/p1/`

`jobs_root` resolution:
1. if environment variable `VIDEO_SUBTITLE_REMOVER_JOBS_ROOT` is non-empty, use its resolved absolute path;
2. otherwise use `<backend current working directory>/jobs`.

Current Electron PythonBridge launches the backend with `cwd = appRoot`, so the default development/runtime location is `<appRoot>/jobs/<job_id>/p1/`.

Do NOT modify `src/main/python-bridge.js` in this task.

### 3.2 Safe job id

A job id used in filesystem paths must match exactly:

`^[A-Za-z0-9_-]{1,128}$`

Any other value is rejected with controlled code:

`P1_INVALID_JOB_ID`

Do not sanitize traversal characters into a different id. Reject them.

Current `createJob()` base36 ids satisfy this contract.

### 3.3 Source fingerprint v1

Algorithm for artifact contract v1:
- SHA-256 over the ENTIRE source video file bytes;
- streamed, not loaded wholly into memory;
- chunk size: 4 MiB (`4 * 1024 * 1024` bytes);
- lowercase hexadecimal;
- persisted string format:
  `sha256:<64 lowercase hex chars>`.

This is D-013 for this implementation task.

Do not use path, filename, size, mtime or partial-file sampling as the fingerprint.

### 3.4 Source timing metadata v1

Do not introduce ffprobe in 036-A.

Use the same OpenCV source facts already used by `/api/video-info`:
- FPS = `CAP_PROP_FPS`;
- frame count = `CAP_PROP_FRAME_COUNT`;
- source duration seconds = `frame_count / fps`.

FPS must be finite and > 0; frame count must be > 0. Otherwise artifact creation fails closed.

Derive v1 frame timebase from FPS:
1. `rate = Fraction(float(fps)).limit_denominator(100000)`;
2. persisted `timebase = f"{rate.denominator}/{rate.numerator}"`.

Examples:
- 30 fps -> `1/30`;
- approximately 29.97002997 fps -> `1001/30000`.

Persist:
- `fps` as number;
- `frame_count` as integer;
- `source_duration` as number seconds;
- `timebase` as string;
- `timebase_source` exactly `fps-derived-v1`.

This v1 timebase is an artifact identity/timing basis only. It does NOT establish the future P1/P2 timeline tolerance contract.

### 3.5 Artifact version

Persist exactly:

`"artifact_version": "1"`

### 3.6 Manifest schema

File:

`jobs/<job_id>/p1/manifest.json`

Required top-level shape:

```json
{
  "artifact_version": "1",
  "job_id": "<job_id>",
  "source_fingerprint": "sha256:<hex>",
  "source_path": "<absolute normalized source path>",
  "source_duration": 0.0,
  "fps": 0.0,
  "frame_count": 0,
  "timebase": "1/30",
  "timebase_source": "fps-derived-v1",
  "artifacts": {
    "raw_srt": null,
    "tts_audio": null,
    "tts_srt": null,
    "karaoke_ass": null
  }
}
```

Artifact entries in `manifest.json` are RELATIVE filenames within the same `p1` directory, never absolute paths.

Exact filenames:
- raw ASR SRT: `raw.srt`;
- final TTS audio: `tts.mp3`;
- TTS-timed SRT: `tts.srt`;
- karaoke ASS when present: `karaoke.ass`.

The API responses may return absolute paths for renderer convenience.

### 3.7 Identity collision behavior

If `manifest.json` already exists for a job id:
- load and validate it;
- if `job_id` differs from the requested job id, fail closed;
- if `source_fingerprint` differs from the requested/current source fingerprint, return/raise controlled code:
  `P1_SOURCE_IDENTITY_MISMATCH`;
- do not overwrite the existing manifest or its artifacts on mismatch.

Re-running the same job id with the same source fingerprint is allowed and must be idempotent.

### 3.8 Atomic metadata/text writes

`manifest.json`, `raw.srt`, `tts.srt`, and `karaoke.ass` must use deterministic sibling temp files and `os.replace()` for atomic replacement.

Exact temp names:
- `manifest.json.tmp`
- `raw.srt.tmp`
- `tts.srt.tmp`
- `karaoke.ass.tmp`

On successful write there must be no matching `.tmp` file left.

Do not use wildcard cleanup.

TTS audio is produced by the existing TTS pipeline directly/finally at `tts.mp3`; do not add a new transcoding dependency.

## 4. Source/test allowlist

The SOURCE/TEST commit may modify/create exactly these files and no others:

1. `api/p1_artifacts.py` — NEW
2. `api/server.py`
3. `src/renderer/js/app.js`
4. `src/renderer/js/pipelines/pipeline1-ai.js`
5. `tests/test_pipeline1_artifacts.py` — NEW
6. `tests/test_pipeline1_body.js`

No other source/test/dependency/config file is authorized.

`src/renderer/js/api.js` is intentionally NOT in scope: `extractTextP1()` already sends `job_id` and `video_path`.

`src/main/python-bridge.js` is intentionally NOT in scope.

Pipeline 2 and Pipeline 3 files are read-only / forbidden for modification.

## 5. Existing source basis and exact blobs

At canonical base `07e31d8a7cdd26565e6d6528f7bdc15693cc4698` verify:

- `api/server.py` = `b3b1e712bd29ce7825788da9c3f7c345863141f5`
- `src/renderer/js/app.js` = `2afdb3ad480fef78cf5419f9db5032da570c86bf`
- `src/renderer/js/pipelines/pipeline1-ai.js` = `83424e1ba86fe94d6357b6cf89c1dac3bbf99436`
- `tests/test_pipeline1_body.js` = `b8beff480661058ad0d4cdd87313dca83b5ac8b6`
- `tests/test_pipeline1_runtime.js` = `8a697224e9013b7ffe13959d486e9157610a0395`
- `tests/test_renderer_dom_structure.js` = `c5e8a662a6af6c890ec88150d35a3ce4926cf394`

The following must NOT exist before implementation:
- `api/p1_artifacts.py`
- `tests/test_pipeline1_artifacts.py`

If any listed source/test blob differs or either new file already exists:

`STOP — SPEC BASE MOVED`

## 6. Existing canonical documentation blobs

Before executor documentation edits verify:

- `.ai/current_state.md` = `27f19ecff7c939bcb287cbc3d7eb789afc176c4b`
- `.ai/task_current.md` = `a41ba4ad9d9d21f3c129cb50c5edd4fcb00b681a`
- `.ai/handoff.md` = `1c0c3f4ae4fa7d9d31ff7f234e9025958d927c3b`
- `.ai/decisions.md` = `7085f121d64b7c8bc24ca20727463eba2b30200d`
- `.ai/architecture.md` = `6beb2b8a1c1d2e9cb9a31bf3a0d896c073115775`
- `.ai/api_contracts.md` = `ce47db38dbf6fec7b1a9c2450c2f4467341e522c`
- `.ai/qa_checklist.md` = `0f33f0533daa5660eed8db52e8c14f2c3cd75acf`
- `.ai/migration_status.md` = `68ef23e0cf7bcffb995afa168965438146186a8f`
- `.ai/project.md` = `c58c90374100ec62fd24d4f2dd9e84e58744e139`

The DOCS commit may modify exactly those nine files and no other existing `.ai` file.

## 7. Required implementation — `api/p1_artifacts.py`

Create a focused stdlib-only helper module.

Required responsibilities:
- artifact-root resolution from Section 3.1;
- strict job-id validation from Section 3.2;
- full-file SHA-256 from Section 3.3;
- metadata derivation from FPS/frame_count from Section 3.4;
- P1 directory creation;
- manifest creation/load/validation;
- atomic UTF-8 text/JSON writes;
- raw SRT persistence;
- TTS artifact path preparation / manifest update;
- controlled exception/error codes needed by server integration.

No network access.
No dependency on FastAPI.
No dependency on Electron.
Do not import Pipeline 2/Pipeline 3 code.

The module must be directly unit-testable with temporary directories and small fake source files.

## 8. Required implementation — `/api/p1/extract-text`

Modify only the dedicated P1 route and any narrowly required helper code in `api/server.py`.

Existing ASR behavior must remain:
- `extraction_mode` supports only `asr`;
- existing `api_extract_srt()` remains the ASR engine;
- response remains associated with the same `job_id`.

After ASR succeeds and before returning status `ok`:
1. validate job id;
2. verify source file exists;
3. compute full-file source fingerprint;
4. read FPS/frame count using OpenCV facts consistent with `/api/video-info`;
5. create/validate `jobs/<job_id>/p1/manifest.json`;
6. atomically persist ASR SRT to `raw.srt`;
7. update manifest `artifacts.raw_srt = "raw.srt"`.

The status `ok` response must additionally include exactly named fields:
- `artifact_version`
- `artifact_dir`
- `manifest_path`
- `raw_srt_path`
- `source_fingerprint`
- `source_duration`
- `fps`
- `frame_count`
- `timebase`
- `timebase_source`

`artifact_dir`, `manifest_path`, `raw_srt_path` are absolute paths.

If persistence/identity validation fails, do NOT return ephemeral status `ok`.
Return `status: "error"`, same `job_id`, and a controlled `error_code`:
- `P1_INVALID_JOB_ID`
- `P1_SOURCE_IDENTITY_MISMATCH`
- otherwise `P1_ARTIFACT_PERSISTENCE_FAILED`.

Do not expose stack traces or source file contents in API error messages.

## 9. Required implementation — `/api/tts-retry`

Preserve existing legacy behavior when no P1 identity is supplied.

Extend `TTSRetryReq` with OPTIONAL fields:
- `job_id: Optional[str] = None`
- `source_fingerprint: Optional[str] = None`

Rules:
- both absent -> existing temp-output behavior remains unchanged;
- exactly one present -> return controlled error `P1_ARTIFACT_IDENTITY_INCOMPLETE` before TTS generation;
- both present -> validate job id and load existing manifest; manifest fingerprint must equal request `source_fingerprint`; mismatch returns `P1_SOURCE_IDENTITY_MISMATCH` before TTS generation.

When both identity fields are valid:
- final combined TTS audio path must be `<artifact_dir>/tts.mp3`;
- after successful audio generation, atomically persist returned TTS-timed SRT content as `<artifact_dir>/tts.srt`;
- if `karaoke_ass` content is non-empty, atomically persist `<artifact_dir>/karaoke.ass`; otherwise keep manifest `karaoke_ass` null;
- update manifest only after corresponding artifact writes succeed;
- manifest artifact entries use relative filenames;
- do not mark an artifact present when its file write failed.

The successful identity-aware response must include/add:
- existing `audio_path`, `srt_content`, `karaoke_ass`, `segments_timing`, etc.;
- `artifact_version`
- `artifact_dir`
- `manifest_path`
- `source_fingerprint`
- `tts_srt_path`
- `karaoke_ass_path` (null when no file was written).

Legacy callers with no identity fields must not be forced into the P1 artifact directory by this task.

## 10. Required renderer wiring — `app.js`

Modify only:
- `createJob()` P1 artifact field initialization;
- `processPipeline1Queue()` handling of the successful `extractTextP1` response.

Initialize these job fields to null in `createJob()`:
- `p1ArtifactVersion`
- `p1ArtifactDir`
- `p1ManifestPath`
- `p1RawSrtPath`
- `sourceFingerprint`
- `sourceDuration`
- `sourceFps`
- `sourceFrameCount`
- `sourceTimebase`
- `sourceTimebaseSource`
- `ttsTimedSrtPath`
- `karaokeAssPath`

After `extractTextP1` status/job-id validation succeeds, require all foundation response fields from Section 8. If any required field is missing/empty, throw a controlled Pipeline 1 artifact-contract error rather than continuing with ephemeral state.

Populate the corresponding job fields before Step 2 AI rewrite/TTS begins.

Do not change Pipeline 2 queue/routing behavior in this task.
Do not change Pipeline 3 behavior.

## 11. Required renderer wiring — `pipeline1-ai.js`

Preserve current AI provider/model/TTS speed behavior.

In `triggerAutoTts(job, srtText)`:
- for a dedicated job (`job.pipeline === 1`), require `job.id` and `job.sourceFingerprint` before the TTS fetch; missing identity is a controlled TTS error and no request is sent;
- when both `job.id` and `job.sourceFingerprint` are present, add exactly `job_id` and `source_fingerprint` to the `/api/tts-retry` JSON body;
- a legacy/non-dedicated caller without those fields must keep the old request shape and temp-output behavior.

On successful identity-aware response, retain existing assignments and additionally set when provided:
- `job.p1ArtifactVersion`
- `job.p1ArtifactDir`
- `job.p1ManifestPath`
- `job.sourceFingerprint`
- `job.ttsTimedSrtPath`
- `job.karaokeAssPath`.

`job.ttsAudioPath` must continue to use response `audio_path`.
`job.ttsTimedSrt` must continue to use response `srt_content`.

Do not alter AI rewrite provider IPC or credentials.

## 12. Explicit non-goals

036-A must NOT implement or create:
- `scenes.json`;
- `multimodal_timeline.json`;
- `remix_script.json`;
- `edit_plan.json`;
- scene/keyframe detection;
- OCR changes;
- ASR model/language behavior changes;
- AI rewrite prompt/provider/model changes;
- legacy `onJobFinished()` routing cleanup (reserved for 036-B);
- Pipeline 2 clean-video changes;
- Pipeline 3 finalization changes;
- app job-list restoration after restart.

Artifacts must survive restart on disk, but automatic UI rehydration of jobs is NOT part of 036-A.

## 13. Required backend tests — NEW `tests/test_pipeline1_artifacts.py`

Use Python stdlib test code; do not require pytest.
Use temporary directories/files only.
No real video, ASR, TTS, provider, network or GPU call.

The test must exit non-zero on any failure and print a final PASS/FAIL summary.

Minimum required assertions:
1. jobs-root environment override resolves exactly.
2. safe job ids are accepted; empty, traversal (`../x`), slash/backslash, whitespace and >128 chars are rejected with `P1_INVALID_JOB_ID`.
3. known fake source bytes produce exact `sha256:<hex>` full-file fingerprint.
4. 4 MiB streaming path handles a file larger than one chunk and matches `hashlib.sha256(all_bytes)`.
5. metadata 30 fps -> timebase `1/30`.
6. metadata approximately 29.97002997 fps -> timebase `1001/30000`.
7. base manifest has exact required schema/version and null artifact entries.
8. raw SRT persistence writes `raw.srt`, updates manifest, leaves no `raw.srt.tmp`/`manifest.json.tmp`.
9. same job + same source is idempotent.
10. same job + different source fingerprint raises `P1_SOURCE_IDENTITY_MISMATCH` and preserves the original manifest bytes.
11. TTS artifact manifest update records only relative `tts.mp3`, `tts.srt`, optional `karaoke.ass` names.
12. manifest loader rejects malformed/incompatible manifest rather than silently replacing it.

If implementation adds more safety behavior, tests may add assertions, but must remain within 036-A scope.

## 14. Required renderer runtime-test extension

Modify only `tests/test_pipeline1_body.js`.

Extend the existing TTS execution-contract section so the mocked dedicated job has a deterministic `sourceFingerprint` and verifies:
- `/api/tts-retry` payload contains `job_id === job.id`;
- payload contains exact `source_fingerprint === job.sourceFingerprint`;
- existing voice and speed assertions continue to pass;
- mocked successful response with artifact fields causes the expected `job.p1ArtifactDir`, `job.p1ManifestPath`, `job.ttsTimedSrtPath`, `job.karaokeAssPath` assignments;
- existing `job.ttsAudioPath` and `job.ttsTimedSrt` behavior remains.

Add a negative assertion using a dedicated Pipeline 1 job with missing `sourceFingerprint`:
- `triggerAutoTts` must not call fetch;
- it must complete through the existing controlled error/log path without throwing an unhandled renderer exception.

Do not weaken any existing assertion.
Do not convert a required assertion to NOT TESTED.

## 15. Required automated verification

Run exactly these verification commands after implementation and before staging source/tests:

1. `python -m py_compile api/p1_artifacts.py api/server.py tests/test_pipeline1_artifacts.py`
2. `python tests/test_pipeline1_artifacts.py`
3. `.\node_modules\.bin\electron.cmd tests\test_pipeline1_runtime.js`
4. `node tests/test_renderer_dom_structure.js`
5. `node --check src/renderer/js/app.js`
6. `node --check src/renderer/js/pipelines/pipeline1-ai.js`
7. `git -c core.whitespace=cr-at-eol diff --check`

Acceptance:
- every command exit 0;
- Python artifact test: 0 FAIL;
- Pipeline 1 runtime test: 0 FAIL and 0 NOT TESTED;
- renderer DOM test: 0 FAIL;
- no production provider call is made by tests.

The existing harness-only renderer warning about `window.electronAPI.hasProviderKeys` may be recorded if it remains non-fatal, but do not claim a clean console if it appears.

Do NOT run `npm start` before PM code review. Owner manual app verification occurs only after PM code-review PASS.

## 16. Source/test staging and commit gate

Before source/test staging:

`git diff --name-status`

must contain exactly the six allowlisted source/test files from Section 4.

No `.ai` file may be modified yet.

Stage exactly:

- `api/p1_artifacts.py`
- `api/server.py`
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `tests/test_pipeline1_artifacts.py`
- `tests/test_pipeline1_body.js`

Verify:
- `git diff --cached --name-only` = exactly those six files;
- `git -c core.whitespace=cr-at-eol diff --cached --check` exit 0.

Commit message exactly:

`feat: add Pipeline 1 artifact persistence foundation`

Immediately after commit run:

`git show --name-only --format= HEAD`

The source commit must contain exactly those six source/test files. Any `.ai` file or other path in that commit:

`STOP — SOURCE COMMIT CONTAMINATED`

Do not amend.

## 17. Required canonical knowledge updates

After the source/test commit is verified clean, edit exactly these nine documentation files:

- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/decisions.md`
- `.ai/architecture.md`
- `.ai/api_contracts.md`
- `.ai/qa_checklist.md`
- `.ai/migration_status.md`
- `.ai/project.md`

Required content:

### current_state / task_current / handoff
Record:
- Task 036-A active/completed implementation status = `WAITING_PM_REVIEW`;
- review branch and Draft PR;
- source commit SHA;
- source base `07e31d8a...`;
- exact automated test commands/results;
- reviewed source identity is now pending PM review of the new source commit (do not continue claiming `ea9521...` as the new implementation source);
- code review `WAITING_PM_REVIEW`;
- Owner manual app verification `NOT STARTED`;
- documentation synchronization `WAITING_PM_REVIEW`;
- merge permission `BLOCKED`;
- 036-B/C/D `NOT AUTHORIZED`.

### decisions.md
Append D-013 containing the exact v1 decisions from Section 3:
- jobs-root resolution;
- strict safe job id;
- full-file SHA-256 fingerprint format;
- FPS-derived timebase rule;
- artifact version `1`;
- mismatch fails closed.

### architecture.md
Record 036-A as IMPLEMENTED-CANDIDATE / WAITING_PM_REVIEW, not final PASS.
Document exact manifest and artifact filenames.
Keep `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json` as NOT IMPLEMENTED.
Keep strict P1/P2/P3 boundaries.

### api_contracts.md
Document the added `/api/p1/extract-text` response fields and optional `/api/tts-retry` identity fields/success fields/error codes exactly as Sections 8-9.

### qa_checklist.md
Add a 036-A section with automated verification results and Owner verification still NOT STARTED.
Do not mark Owner PASS.

### migration_status.md / project.md
Record Audit 035 complete and 036-A as the current implementation milestone/candidate awaiting PM review; Pipeline 3 remains not next.

Do not rewrite historical sections broadly.
Append/narrowly update current sections only.

## 18. Documentation staging and commit gate

After docs edits, the working tree must contain exactly the nine docs files from Section 17 and no source/test changes beyond the already committed source commit.

Stage exactly those nine docs files.

Verify:
- `git diff --cached --name-only` = exactly nine docs files;
- `git -c core.whitespace=cr-at-eol diff --cached --check` exit 0.

Commit message exactly:

`docs: record Pipeline 1 artifact persistence 036-A review state`

Immediately after commit:

`git show --name-only --format= HEAD`

must contain exactly the nine documentation files.

## 19. Remote-head guard and publication

No push is permitted until both local commits are complete and verified.

Run:
- `git fetch origin`
- `git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Remote review HEAD must still equal the captured `EXECUTION_BASE_HEAD` from the start of execution.

If moved:

`STOP — SPEC BASE MOVED`

Then push normal fast-forward only:

`git push origin HEAD:review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

No force push.

After push:
- local HEAD must equal remote review HEAD;
- `git status --short` must be empty.

Do not edit the PR body. PM owns PR metadata.

## 20. Authorized shell command whitelist

Only the following command families are authorized.

### Remote authority / preflight
- `git fetch origin`
- `git show <approved remote ref>:<ACTIVE/spec/allowed source path>`
- `git rev-parse <approved ref or HEAD>`
- `git merge-base --is-ancestor <approved sha> <approved sha>`
- `git diff --name-only <approved sha> <approved sha>`
- `Test-Path <exact path>`
- `git worktree add --detach <exact worktree path> <EXECUTION_BASE_HEAD>`
- exact `Set-Location` / `cd` to the worktree
- `$PWD.Path`
- `git status --short`
- `git hash-object <exact file from Sections 5-6>`

### Read-only inspection
- `git show HEAD:<path>` for files explicitly allowed by this spec
- `git grep -n <term> -- <explicit allowed paths>` for implementation-local navigation only
- `Select-Object -First <N>` / `Select-Object -Skip <N> -First <N>` only when piping output of an approved read command

### Verification
- the seven exact commands in Section 15
- exact diagnostic `echo "Exit: $LASTEXITCODE"` or `Write-Output "Exit: $LASTEXITCODE"` immediately after an approved command

### Diff/staging/commits
- `git diff --name-status`
- `git diff --numstat`
- `git diff -- <exact allowed path>`
- `git -c core.whitespace=cr-at-eol diff --check`
- exact `git add <explicit files>` sets from Sections 16 and 18
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- `git -c core.whitespace=cr-at-eol diff --cached --check`
- the two exact `git commit -m ...` commands from Sections 16 and 18
- `git show --name-only --format= HEAD`

### Publication
- `git fetch origin`
- remote `git rev-parse` from Section 19
- exact normal push from Section 19
- post-push `git rev-parse HEAD`, `git fetch origin`, remote `git rev-parse`, `git status --short`

No other shell command is authorized.

## 21. Isolated worktree

Required exact worktree path:

`E:\Project AI\_work\036-a-p1-artifact-persistence`

Before creation, `Test-Path` must return False.
If it exists:

`STOP — 036-A WORKTREE ALREADY EXISTS`

Do not remove/repair/reuse an old worktree.

## 22. Start-of-execution preflight

After `git fetch origin`:
1. read remote ACTIVE;
2. confirm Active Task = this task;
3. read this entire spec from the same remote ref;
4. capture:
   `EXECUTION_BASE_HEAD = git rev-parse origin/review/RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`;
5. verify canonical merge SHA `07e31d8a...` is an ancestor of `EXECUTION_BASE_HEAD`;
6. `git diff --name-only 07e31d8a... EXECUTION_BASE_HEAD` must contain only `.ai/` PM control files;
7. create detached isolated worktree at `EXECUTION_BASE_HEAD`;
8. initial worktree status must be clean;
9. run exact source/test and docs blob gates.

Any mismatch = STOP.

## 23. Required delivery state

After successful push:

- Execution: `PASS`
- Automated verification: `PASS`
- Code review: `WAITING_PM_REVIEW`
- Owner manual app verification: `NOT STARTED`
- Documentation synchronization: `WAITING_PM_REVIEW`
- 036-B/C/D: `NOT AUTHORIZED`
- Merge permission: `BLOCKED`
- Final status: `WAITING_PM_REVIEW`

No Owner app test is authorized until PM code review PASS.

## 24. Final report schema

Return exactly enough evidence for PM verification:

- Active spec read directly from remote ref: YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- Worktree path
- Initial HEAD/status
- Canonical-base ancestry result
- Pre-execution `.ai/`-only path comparison result
- Source/test blob-gate results
- Docs blob-gate results
- Exact changed source/test files
- Source/test diff numstat
- Seven automated verification commands with exit codes and test summaries
- Source commit SHA
- Source commit exact file list
- Exact changed docs files
- Docs diff numstat
- Docs commit SHA
- Docs commit exact file list
- Remote-head guard result
- Remote HEAD after push
- Final `git status --short`
- Application source changed: YES — exact files
- Pipeline 2 changed: NO
- Pipeline 3 changed: NO
- Dependencies/config changed: NO
- Owner test performed: NO
- Forbidden command used: NO
- 036-B/C/D started: NO
- Code review: WAITING_PM_REVIEW
- Owner verification: NOT STARTED
- Documentation synchronization: WAITING_PM_REVIEW
- Merge: BLOCKED
- STATUS: WAITING_PM_REVIEW
