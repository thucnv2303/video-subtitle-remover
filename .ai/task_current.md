# Current Task

## Task ID
PIPELINE3-EDITOR-REBUILD-016

## Status
SOURCE_PUBLISHED_PM_REVIEW_IN_PROGRESS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Exact basis
- Branch: `review/PIPELINE3-EDITOR-REBUILD-016`.
- Starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`.
- Main spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`.
- Bootstrap amendment: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016-BOOTSTRAP-AMENDMENT.md`.
- Application-source head before docs sync: `936ddb32ceed3fda2839fc6a000e593a37f4a75d`.

## User outcome
Rebuild Pipeline 3 to match the approved editor demo and current app tone: visible Job Manager, aspect-correct preview, assembly timeline, detailed settings, smooth subtitle drag, and collapsible fold/accordion groups for related settings.

## Implemented source
- focused P3 editor/store/geometry/subtitle-ASS/render-controller modules;
- P3-specific navy/blue-gray CSS;
- one import-only bootstrap addition to `pipeline1-run-config.js`;
- inherited finalizer/backend remain unchanged.

## Core behavior
1. P3-ready Jobs are visible in a dedicated searchable/filterable Job panel.
2. Real video resolution defines the logical canvas; viewport fit preserves aspect ratio.
3. Subtitle X/Y is per Job and stable through resize; pointer drag maps viewport to logical canvas coordinates.
4. Subtitle styling generates in-memory derived ASS with exact `\\pos(x,y)` while preserving original karaoke ASS separately.
5. Settings are grouped in native collapsible folds: Phụ đề, Bố cục & Vị trí, Hiệu ứng chữ, Audio, Nhạc nền, Xuất video, Nâng cao.
6. Timed subtitle cues appear as individual timeline blocks and support seek.
7. Re-render restores preserved P2 clean video before calling the existing finalizer.
8. No P1/P2/backend/dependency implementation change.

## Required static on exact final HEAD
```text
node --check src/renderer/js/pipeline3/editor.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/preview-geometry.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline3/render-controller.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

## Owner runtime acceptance
- reuse existing local test directory only;
- Job Manager visible and responsive;
- preview does not stretch for available aspect ratios;
- resize window preserves canvas ratio/subtitle logical position;
- drag subtitle to multiple positions and confirm X/Y sync;
- accordion sections expand/collapse without resetting preview/playback;
- per-Job settings persist while switching Jobs;
- timeline cue blocks align with subtitle timing and seek correctly;
- short render matches preview placement/style closely;
- second render starts from original P2 clean video;
- P1 per-Job Remix/P2 remain unchanged.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING final PR/full-file review.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS pre-runtime.
- Merge: BLOCKED.

## Next action
Open Draft PR, complete exact GitHub code review, then authorize Owner static/runtime test only if review PASS.
