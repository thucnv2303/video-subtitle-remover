# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Source/integration verification
- [x] Dedicated branch and Draft PR #44.
- [x] Latest reviewed file-path source `37e6e46a8393ac16cd2a1258979170d4190c51bc`.
- [x] Owner failing head `51c35e78...` recorded before compatibility fix.
- [x] Incremental compare changes only task spec, preload, and new `file-path-compat.js`.
- [x] Preload exposes `webUtils.getPathForFile(file)` through a narrow bridge.
- [x] Compatibility adapter restores only the legacy `File.prototype.path` getter consumed by existing drag/drop/fallback code.
- [x] Native dialog `result.filePaths` flow remains untouched.
- [x] `node --check` PASS for `src/main/preload.js` reviewed source.
- [x] `node --check` PASS for `src/renderer/js/file-path-compat.js` reviewed source.
- [x] PM incremental code review PASS `4903672613`.
- [x] No unresolved inline PR review threads.
- [ ] GitHub CI/status checks — none configured.
- [ ] Full Electron runtime path test — Owner required.

## Previous P1 evidence already retained
- [x] Multi-job failure isolation: failed Job did not block next Job.
- [x] Failed Job can open popup.
- [x] Reasoning output has finite timeout and bounded repair in reviewed source.
- [x] OmniVoice idle-release revision remains present in branch.
- [x] Whole-card pulse removal remains present in branch.

## Fresh Owner retest — BLOCKING
- [ ] Add/drag `test3.mp4` and `vn-11110105-...mp4` using the same interaction that failed on `51c35e78...`.
- [ ] Preview request contains an absolute, drive-qualified Windows source path; it must not be `path=test3.mp4` or another basename-only path.
- [ ] Preview no longer fails `Video file not found` for an existing source video.
- [ ] `/api/p1/extract-text` progresses into ASR rather than immediately returning path-not-found.
- [ ] Retrying a failed Job reuses a valid absolute source path.
- [ ] Processing card/badge stays steady; only spinner rotates.
- [ ] Exact popup error detail and popup `↻ Chạy lại` remain usable.
- [ ] After path gate passes, run clone-TTS Job then `test3.mp4`.
- [ ] Clone-TTS sequence logs `[TTS] OmniVoice released after idle TTS burst.`.
- [ ] `test3.mp4` reasoning completes or fails with a bounded explicit diagnostic instead of unexplained near-timeout behavior.
- [ ] If JSON is truncated/malformed, at most one reasoning-only retry occurs and vision is not repeated solely for repair.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner FAIL on prior head / RETEST READY on new head; documentation sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.
