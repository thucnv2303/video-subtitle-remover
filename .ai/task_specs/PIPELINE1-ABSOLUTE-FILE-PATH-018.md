# PIPELINE1-ABSOLUTE-FILE-PATH-018

## Objective
Fix the runtime regression where a selected/dropped video can enter the shared Job state as basename only, causing both preview and Pipeline 1 ASR to fail with `Video file not found`.

## Basis
- Base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@c731b71c1e4fb4ba5294cc5f9a20486bcfbf96f9`.
- Owner runtime evidence: preview and P1 ASR fail for the same Job/path.

## Verified path flow
- `app.js::createJob(filePath)` stores `job.filePath`.
- Preview uses `api.videoInfo(job.filePath)`.
- P1 ASR uses `api.extractTextP1(job.id, job.filePath, ...)`.
- Electron preload exposes `getPathForFile(file) => webUtils.getPathForFile(file)`.
- `file-path-compat.js` previously returned early for any pre-existing `File.prototype.path` getter, so it did not guarantee that the project compatibility getter remained authoritative.
- Legacy HTML-input/drop code still permits `f.path || f.name`, so a non-native/stale `path` value can fall through to basename and poison the Job.

## Fix
Keep the existing compatibility architecture. `file-path-compat.js` now exposes one native resolver backed by `electronAPI.getPathForFile()` and installs it as the configurable `File.prototype.path` getter even when a configurable getter already exists. No second path system is introduced.

## Scope
Application source changed only:
- `src/renderer/js/file-path-compat.js`

No P2/P3/TTS/backend/dependency source changes.

## Acceptance
Picker and drag/drop must preserve independent absolute paths through Job creation, preview, P1 ASR, job switching and retry. Basename remains display-only.

## Gates
- Execution: PASS source published.
- Automated/static: PARTIAL — `node --check src/renderer/js/file-path-compat.js` PASS; exact checkout `git diff --check` still required.
- Code review: WAITING final GitHub PR review.
- Owner runtime: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge: BLOCKED.
