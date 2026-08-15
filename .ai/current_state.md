# Current State

## Status
PIPELINE3-FINAL-COMPOSITION-017 — RUNTIME FIX REV4 SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RE-VERIFY WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Rev4 starting HEAD: `92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Reviewed Rev4 application-source HEAD: `d5aae15c5471f0e23f35ac3ae7cc205fc47b0fe3`.
- Active amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-RUNTIME-FIX-REV4.md`.

## Owner runtime result — pre-Rev4 build, 2026-08-15
Owner supplied screenshots and reported three blocking defects:
1. right P3 inspector clips/hides settings data;
2. Remove Vocal was checked but original vocal remained audible in the result;
3. export had no selectable destination and no real output-quality selection.

Decision for the tested build: `NEEDS_REVISION` / Owner runtime FAIL.

## Verified root causes
- inspector lacked a reliable nested min-width/box-sizing containment contract;
- `/api/remove-vocal` is best-effort and may return weak fallbacks, while the old finalizer accepted them as successful background separation;
- final path was hardcoded and explicit CRF/preset was not exposed by the existing Python subtitle-burn route.

## Rev4 source now published and reviewed
### Inspector
- P3-scoped border-box/min-width containment;
- wider right inspector on large desktop widths;
- nested grids collapse at narrower widths;
- style category chips wrap instead of exposing the clipped horizontal-scroll presentation;
- inspector/folds do not allow hidden horizontal overflow.

### Strict original-vocal removal
- Remove Vocal + background > 0 now accepts only backend `method_used=demucs`;
- librosa/ffmpeg-pan/original/unknown fallbacks block final render;
- accepted no-vocals stem logs `method=demucs`;
- background=0 still replaces original audio entirely with TTS and does not require separation.

### Real output destination / quality
Per Job:
- output folder picker;
- editable sanitized MP4 filename;
- exact output path display;
- H.264 quality presets: CRF20/medium, CRF18/slow, CRF16/slow, CRF14/slower;
- output cannot overwrite source or P2 clean video.

A narrow Electron FFmpeg bridge (`src/main/p3-export-bridge.js`) owns P3 final video retime and ASS burn so the selected CRF/preset is real without broadening `api/server.py`.

### Review correction
Because Rev4 bypasses the older Python burn route, PM review caught a timing-parity risk. Finalizer now rebuilds derived ASS from the exact final SRT after voice retime before HQ burn; changed timing disables original karaoke preservation for that render.

## Rev4 application-source scope
- new `src/main/p3-export-bridge.js`;
- `src/main/preload.js`;
- `src/renderer/js/pipeline1-run-config.js` — one import-only Rev4 bootstrap line;
- `src/renderer/js/pipeline3/editor-store.js`;
- new `src/renderer/js/pipeline3/runtime-fix-rev4.js`;
- `src/renderer/js/pipelines/pipeline3-finalize.js`.

No backend Python, P1 execution, P2, TTS or dependency source change.

## Verification
- PM source/code review: PASS logic/scope.
- GitHub compare from Rev4 start: only authorized Rev4 source + task spec.
- Exact checkout `node --check` + `git diff --check`: WAITING.
- PM sandbox raw-download attempt could not run because outbound DNS is unavailable; not counted as test evidence.
- Owner Rev4 runtime: WAITING.

## Gates
- Execution: PASS.
- Automated verification: WAITING exact-checkout evidence.
- Code review: PASS.
- Owner manual app verification: FAIL for pre-Rev4 build / WAITING for Rev4.
- Documentation synchronization: PASS pre-runtime after dynamic docs/PR sync.
- Merge permission: BLOCKED.

## Local safety
Reuse only `E:\Project AI\Video-sub-remove-owner-test-LONG012`. Before switching, `git status --short` must be empty. Dirty => STOP. No reset/restore/clean and no new clone/worktree.

## Next permitted action
Verify live PR #58 exact docs-synchronized head/checks/comments. Then Owner tests Rev4 exact head: inspector visibility, Demucs strict removal, destination/filename, real quality preset, and one short final render. No merge.
