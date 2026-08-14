# Current State

## Status
PIPELINE3-EDITOR-REBUILD-016 — SOURCE PUBLISHED / PM REVIEW IN PROGRESS / STATIC WAITING / OWNER RUNTIME NOT STARTED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE3-EDITOR-REBUILD-016`.
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1` from `review/PIPELINE1-INTEGRATION-013`.
- Approved spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`.
- Bootstrap safety amendment: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016-BOOTSTRAP-AMENDMENT.md`.
- Exact application-source head before docs sync: `936ddb32ceed3fda2839fc6a000e593a37f4a75d`.
- Rejected prototype PR #57 remains frozen/unmerged and is not the source basis for this rebuild.

## Owner-approved P3 V2 direction
- visible dedicated Job Manager;
- aspect-correct logical video canvas in a resizable viewport;
- direct subtitle dragging in logical video coordinates;
- bottom assembly timeline with timed subtitle cue blocks;
- detailed per-Job inspector;
- related settings grouped as collapsible fold/accordion sections, opened by clicking the section header;
- app navy/blue-gray/blue visual system with purple limited to accent/primary render CTA;
- no new local clone/worktree/test directory.

## Published application source
New focused modules:
- `src/renderer/js/pipeline3/editor.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/preview-geometry.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/styles/pipeline3-editor.css`

Bootstrap delta:
- `src/renderer/js/pipeline1-run-config.js`: exactly one import-only addition for `./pipeline3/editor.js`; no P1 symbol/run behavior changed.

`src/renderer/js/pipelines/pipeline3-finalize.js` remains unchanged.

## Implementation behavior
- P3 consumes the existing `window._appState` and P2 readiness state.
- Legacy `#step3-job-list` and old P3 controls are preserved inside a hidden compatibility container so inherited app/pipeline state code can continue synchronization.
- Visible Job Manager has search/filter and per-Job selection.
- Preview logical canvas uses actual video metadata and `min(viewport/video)` fit geometry, preventing stretch and keeping expected letterbox/pillarbox.
- Subtitle coordinates live in per-Job percentage/logical space and are converted to exact ASS `\\pos(x,y)` against source resolution.
- Pointer capture + requestAnimationFrame handles drag.
- Subtitle settings are per Job and grouped into native accessible `<details>` folds; Subtitle is open by default, related groups are collapsed by default.
- Timeline shows distinct Video/Voice/Subtitle/Effects rows; subtitle cues are actual timed blocks and support click-to-seek.
- Derived ASS stays in Job memory; original P1 karaoke ASS is preserved separately.
- Render controller captures/restores `job.p3CleanVideoPath` before every render and maps supported audio controls into the existing finalizer contract.
- No fixed 300 ms P3 polling loop is used as primary synchronization; hidden legacy list mutations trigger visible Job refresh.

## Review status
Scope compare from exact base currently contains only the approved P3 spec/docs, six P3 application assets, and one P3 bootstrap import line. PM source review is still in progress. ChatGPT environment could not execute repository Node static checks from GitHub source because the isolated container has no outbound DNS; this is not a source failure and static remains WAITING for exact local checkout evidence.

## Parent project status
- Per-Job Semantic Remix was previously observed by Owner as functionally OK in the parent integration build.
- Long Standard narration remains a separate P1 design issue tracked by task 014 research and is not modified by P3 task 016.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING final PR/full-file review.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: PASS for current pre-runtime state.
- Merge permission: BLOCKED.

## Next permitted action
Open/update Draft PR for task 016, review exact PR files/patches/full source and GitHub status/comments, then if code review PASS authorize Owner to reuse the existing clean test directory for static and real-app verification. Do not create another local directory and do not merge.
