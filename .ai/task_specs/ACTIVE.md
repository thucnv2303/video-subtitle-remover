# Active PM Execution Spec

Status: PIPELINE3_EDITOR_REBUILD_016_CODE_REVIEW_PASS_STATIC_OWNER_VERIFY_WAITING

Task: `PIPELINE3-EDITOR-REBUILD-016`
Repository: `thucnv2303/video-subtitle-remover`
Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
Main spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`
Bootstrap amendment: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016-BOOTSTRAP-AMENDMENT.md`
Reviewed application-source head: `205ced27e8c203300f656114d2bcfd7d529d4a35`

## Purpose
Implement the Owner-approved Pipeline 3 final assembly editor with visible Job Management, aspect-correct logical preview, assembly timeline, per-Job subtitle/audio/export settings, smooth subtitle drag, and collapsible fold/accordion groups for related settings.

## Source scope
- `src/renderer/js/pipeline3/editor.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/preview-geometry.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/styles/pipeline3-editor.css`
- `src/renderer/js/pipeline1-run-config.js`: exactly one import-only P3 bootstrap addition.

## Verified invariants
- existing P3 finalizer/backend remain unchanged;
- no P1/P2 run logic change;
- P3 settings are per Job;
- hidden legacy Step-3 DOM remains for compatibility;
- source dimensions control logical canvas geometry;
- derived ASS uses exact logical position;
- voice-retimed SRT rebuilds the ASS used by burn;
- old karaoke timing is bypassed when it would be stale after retime;
- P2 clean video is preserved for re-render;
- only one P3 render can execute at a time;
- no fixed P3 polling loop as primary sync;
- no new local clone/worktree/test directory.

## Required local verification
```text
node --check src/renderer/js/pipeline3/editor.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/preview-geometry.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline3/render-controller.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS pre-runtime.
- Merge: BLOCKED.

## Next permitted action
PM verifies live PR #58 final head/files/status/comments; then Owner may reuse the existing clean local test directory for exact-head static and runtime verification.
