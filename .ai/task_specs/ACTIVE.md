# Active PM Execution Spec

Status: PIPELINE3_EDITOR_REBUILD_016_SOURCE_PUBLISHED_REVIEW_IN_PROGRESS

Task: `PIPELINE3-EDITOR-REBUILD-016`
Repository: `thucnv2303/video-subtitle-remover`
Branch: `review/PIPELINE3-EDITOR-REBUILD-016`
Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
Main spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`
Bootstrap amendment: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016-BOOTSTRAP-AMENDMENT.md`
Application-source head before docs: `936ddb32ceed3fda2839fc6a000e593a37f4a75d`

## Purpose
Implement the Owner-approved Pipeline 3 final assembly editor with a visible Job Manager, aspect-correct logical preview, assembly timeline, per-Job subtitle/audio/export settings, smooth subtitle drag, and collapsible fold/accordion groups for related settings.

## Source scope
- `src/renderer/js/pipeline3/editor.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/preview-geometry.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/styles/pipeline3-editor.css`
- `src/renderer/js/pipeline1-run-config.js`: exactly one import-only P3 bootstrap addition.

## Invariants
- no P1/P2/backend/dependency behavior change;
- existing P3 finalizer stays unchanged;
- P3 consumes P1 artifacts + P2 clean video only;
- settings are per Job;
- legacy hidden Step-3 DOM remains for compatibility;
- real source width/height controls logical canvas geometry;
- derived ASS uses exact logical position and does not overwrite P1/P2 artifacts;
- original karaoke ASS is preserved;
- re-render always restores preserved P2 clean input;
- no new local clone/worktree/test directory.

## Required verification
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
- Code review: WAITING final PR/full-file review.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS pre-runtime.
- Merge: BLOCKED.

## Next permitted action
Open Draft PR, complete GitHub code review, then Owner may reuse the existing clean local test directory for verification only after review PASS.
