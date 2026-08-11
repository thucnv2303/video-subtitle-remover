# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Resilience, File-Path Compatibility, Reasoning/GPU Resilience, and Failed-Job Recovery

## Status
FILE_PATH_COMPATIBILITY_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest Owner-tested failing head: `51c35e7841b5e44b7571e7fc35390e517bfaa702`.
- Latest reviewed source commit: `37e6e46a8393ac16cd2a1258979170d4190c51bc`.
- PM incremental review: `4903672613`.

## Latest Owner runtime result
- Backend startup and GPU detection: PASS.
- Both selected Jobs reached queue execution but failed before ASR because their stored input paths were bare filenames.
- Preview evidence: `/api/video-info?path=vn-...mp4` -> 404 `Video file not found`.
- P1 evidence: `/api/p1/extract-text` -> application error `Video file not found` for both Jobs.
- Retry/requeue mechanism ran, but re-used the same invalid path and failed again.

## Root cause
Existing drag/drop and HTML File-input fallback code uses `f.path || f.name`. With Electron 33, that legacy `File.path` value is unavailable in this path, so only `f.name` is stored. Backend APIs require the absolute local filesystem path.

## Current implementation
1. Preload imports Electron `webUtils` and exposes only `getPathForFile(file)` through contextBridge.
2. New `file-path-compat.js` defines a compatibility getter for `File.prototype.path` backed by that bridge.
3. Existing `app.js` drag/drop and fallback logic therefore receives an absolute path again without a broad app.js rewrite.
4. Native `dialog.showOpenDialog()` flow using `result.filePaths` is unchanged.
5. Previous P1 queue isolation, popup retry/error detail, steady spinner, bounded reasoning repair, and OmniVoice idle release remain preserved.

## Verification
- Incremental compare `51c35e78...` -> `37e6e46a...` contains exactly task spec + preload + new compatibility adapter.
- `node --check` PASS for changed preload and compatibility adapter source.
- PM review PASS `4903672613`.
- No unresolved inline review threads.
- No GitHub CI/status checks configured.

## Owner retest acceptance
- Add/drag the same two videos using the same UI interaction as the failed run.
- Preview request must carry an absolute Windows path such as `F:\...\test3.mp4`, not `test3.mp4` alone.
- Preview must no longer return `Video file not found` for an existing source file.
- `/api/p1/extract-text` must advance into ASR rather than immediately fail on path existence.
- After path acceptance passes, continue the prior clone-TTS -> `test3.mp4` reasoning/VRAM stress sequence.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner FAIL on previous head / RETEST READY on new source; documentation sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.
