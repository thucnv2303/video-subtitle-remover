# Current Task

## Task ID
PIPELINE3-EDITOR-REBUILD-016

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`.
- Main spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`.
- Bootstrap amendment: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016-BOOTSTRAP-AMENDMENT.md`.
- Reviewed application-source head: `205ced27e8c203300f656114d2bcfd7d529d4a35`.

## User outcome
Rebuild P3 to the approved editor demo: visible Job Manager, aspect-correct preview, assembly timeline, detailed per-Job settings, smooth subtitle drag, and click-to-expand fold/accordion groups for related settings.

## Reviewed implementation
- focused editor/store/geometry/ASS/render-controller modules;
- app-consistent navy/blue-gray P3 CSS;
- one import-only P3 bootstrap line in `pipeline1-run-config.js`;
- inherited finalizer/backend remain unchanged;
- compatibility legacy Step-3 DOM remains hidden for existing state synchronization;
- logical canvas preserves source ratio;
- exact ASS position is generated from logical coordinates;
- retimed voice/SRT rebuilds derived ASS at burn time so subtitle timing follows the actual P3 voice timeline;
- stale source karaoke timing is not reused after voice retime;
- one-render-at-a-time guard prevents render races across Job switching.

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
1. Reuse existing local test directory only.
2. Job Manager visible/search/filter works.
3. Preview preserves source aspect ratio; resize does not stretch video or move logical subtitle position.
4. Drag subtitle smoothly and verify X/Y sync.
5. Accordion groups open/close without losing settings or playback state.
6. Per-Job style/position survives switching Jobs.
7. Timeline subtitle cue blocks align with cue timing and seek works.
8. Render a short Job; final subtitle placement/style/timing matches preview/current voice timeline closely.
9. Change style and render again; second render starts from original P2 clean video.
10. P1 per-Job Remix and P2 behavior remain unchanged.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS pre-runtime.
- Merge: BLOCKED.

## Next action
Verify live PR #58 exact final head/status/comments, then authorize Owner to switch the existing clean test directory to that exact head and run static/runtime verification.
