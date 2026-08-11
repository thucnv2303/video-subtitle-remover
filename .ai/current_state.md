# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — FILE-PATH COMPATIBILITY CODE REVIEW PASS / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest Owner-tested failing head: `51c35e7841b5e44b7571e7fc35390e517bfaa702`.
- Latest reviewed source commit: `37e6e46a8393ac16cd2a1258979170d4190c51bc`.
- PM incremental review: `4903672613`.

## Latest Owner runtime evidence — 2026-08-11
Owner retest on `51c35e78...` exposed a new blocker before ASR/Ollama execution:
- both added videos were stored as bare filenames rather than absolute Windows paths;
- preview called `/api/video-info?path=vn-...mp4` and received `404 Video file not found`;
- `/api/p1/extract-text` then returned application error `Video file not found` for both Jobs;
- requeue/retry worked mechanically but necessarily failed again because the Job path was already invalid.

This invalidates the previous Owner-retest-ready claim for that exact head.

## Verified root cause
- `app.js` drag/drop and HTML File-input fallback consume `f.path || f.name`.
- Electron dependency is `^33.0.0`.
- On the current Electron path, the Web `File` object no longer supplies the legacy `path` value, so the code falls through to `f.name` and persists only the basename.
- Native Electron dialog remains separate: it already supplies `result.filePaths` and is not changed by this fix.

## Current correction
- `src/main/preload.js` exposes a narrow `getPathForFile(file)` bridge backed by Electron `webUtils.getPathForFile`.
- New `src/renderer/js/file-path-compat.js` restores the `File.prototype.path` getter expected by existing drag/drop/fallback code, without modifying broad `app.js` behavior.
- The bridge is usable only with the user-supplied Web `File` object; no arbitrary path discovery API was added.
- Earlier reasoning/token/VRAM, popup/retry, queue-isolation, and steady-spinner corrections remain present.

## Verification
- Incremental GitHub compare `51c35e78...` → `37e6e46a...`: only task spec, `src/main/preload.js`, and new `src/renderer/js/file-path-compat.js` changed.
- `node --check` PASS for exact reviewed source text of both changed JS files.
- PM incremental code review PASS: `4903672613`.
- No unresolved inline review threads.
- GitHub status checks: none configured; no CI PASS claimed.
- Runtime path resolution is not considered PASS until Owner retests drag/drop/fallback on the real Electron app.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: PARTIAL — changed JS syntax PASS; no configured CI/full Electron runtime.
- Code review: PASS for `37e6e46a...`.
- Owner manual verification: FAIL on `51c35e78...`; new head RETEST READY.
- Documentation synchronization: PASS after this publication chain completes.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner retests latest PR #44 head by adding the same two videos through the same interaction that failed. Preview/backend requests must contain absolute drive-qualified paths and P1 ASR must progress beyond `Video file not found`. Only after that should the prior clone-TTS → `test3.mp4` reasoning stress sequence continue.
