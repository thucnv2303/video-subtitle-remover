# Current State

## Status
PIPELINE3-FINAL-COMPOSITION-017 — SUBTITLE UX REV1 SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Revision-017 starting SHA: `63cabee71f0faaf451138201da789ba0c935fc68`.
- Owner runtime-feedback basis: `8f00455b4cec869556be09d87e7e8366dfa5537c`.
- Subtitle UX Rev1 reviewed application-source head: `ac84f58c69a503c4f7341a91eadc33025a3677b5`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Subtitle UX amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-UX-REV1.md`.

## Owner runtime feedback — 2026-08-14
Owner screenshot confirms P3 subtitle preview is active, but requests:
1. direct drag-resize of subtitle text-frame width;
2. a larger subtitle effect library.

Decision: `NEEDS_REVISION` for the previously tested build; Subtitle UX Rev1 has now been published for re-verification.

## Reviewed Subtitle UX Rev1 source
Delta from `8f00455b4cec869556be09d87e7e8366dfa5537c` is limited to:
- `src/renderer/js/pipeline1-run-config.js` — one import-only bootstrap line;
- new `src/renderer/js/pipeline3/subtitle-resize-effects.js`;
- `src/renderer/js/pipeline3/subtitle-ass.js`.

No P1 execution logic, P2, backend, TTS, dependency or P3 finalizer change in this revision.

## Verified behavior from source
### Direct subtitle width resize
- Active subtitle gets left/right horizontal resize handles.
- Dragging either handle updates existing per-Job `maxWidth` symmetrically around subtitle X.
- Width is clamped to logical canvas bounds.
- Existing `Độ rộng chữ tối đa` slider is kept synchronized through the normal P3 input path.
- Preview subtitle uses the selected frame width.
- Non-karaoke ASS output uses deterministic width-aware word wrapping based on logical video width and configured font size.

### Expanded subtitle effects
In addition to existing `none`, `fade`, `pop`, Rev1 adds:
- slide up/down/left/right;
- zoom in/out;
- pulse;
- blur in;
- fade + slide up.

Preview uses matching CSS animation. Final ASS uses libass-supported `move`, `fad`, `fscx/fscy`, `t`, and `blur` tags.

### Regression protections
- Resize enhancer does not use a style-attribute MutationObserver, avoiding a self-triggering resize feedback loop.
- Existing direct subtitle position drag remains separate from resize-handle pointer capture.
- Existing cover band, cue edit, voice/video fit and finalizer logic are untouched.

## Verification status
- PM source/code review: PASS logic/scope.
- Exact checkout `node --check` + `git diff --check`: WAITING.
- GitHub CI/status: no PASS may be inferred from absence of checks.
- Owner runtime verification for Subtitle UX Rev1: WAITING.

## Local safety
Do not create another clone/worktree/test directory. Reuse only the existing clean test directory. Dirty => STOP; no reset/restore/clean.

## Gates
- Execution: PASS.
- Automated verification: WAITING exact-checkout evidence.
- Code review: PASS.
- Owner manual app verification: WAITING for Rev1.
- Documentation synchronization: PASS pre-runtime after dynamic-doc/PR closeout.
- Merge permission: BLOCKED.

## Next permitted action
Verify live PR #58 exact final head/status/checks/comments. Then Owner may update the existing clean test directory to that exact HEAD and test resize handles plus the new effect set. No merge.
