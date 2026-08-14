# Current State

## Status
PIPELINE3-EDITOR-REBUILD-016 — SOURCE PUBLISHED / PM CODE REVIEW PASS / STATIC WAITING / OWNER RUNTIME NOT STARTED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1` from `review/PIPELINE1-INTEGRATION-013`.
- Approved spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`.
- Bootstrap safety amendment: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016-BOOTSTRAP-AMENDMENT.md`.
- Exact reviewed application-source head before final docs sync: `205ced27e8c203300f656114d2bcfd7d529d4a35`.
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

## Reviewed application source
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

## Verified P3 behavior from source
- P3 consumes existing `window._appState` and P2 readiness state.
- Legacy `#step3-job-list` and old controls are preserved inside a hidden compatibility container so inherited app/pipeline synchronization continues.
- Visible Job Manager has search/filter and per-Job selection.
- Preview logical canvas uses actual video metadata and `min(viewport/video)` fit geometry, preventing stretch and keeping expected letterbox/pillarbox.
- Subtitle position is per Job and converted to exact ASS `\\pos(x,y)` against source resolution.
- Pointer capture + requestAnimationFrame handles drag.
- Settings use native accessible `<details>` folds; Subtitle opens by default and the other functional groups are collapsed by default.
- Timeline shows Video/Voice/Subtitle/Effects rows; subtitle cues are actual timed blocks with click-to-seek.
- Original P1 karaoke ASS is preserved separately; P3 derived ASS stays in Job memory.
- Re-render controller preserves/restores `job.p3CleanVideoPath` before each finalization.
- Burn timing bridge rebuilds P3 ASS from the finalizer's actual retimed SRT when voice-fit changes timing; stale P1 karaoke timing is intentionally not reused in that case.
- P3 render controller enforces a single active render to prevent Job-switch concurrency races.
- No fixed 300 ms P3 polling loop is used as primary synchronization; hidden legacy list mutation triggers visible Job refresh.

## PM review findings corrected before Owner test
1. Voice-fit could retime SRT after P3 ASS had already been generated. Because backend prioritizes `karaoke_ass`, this could burn stale subtitle timing. The render controller now rebuilds ASS from the exact SRT passed into burn.
2. If original karaoke timing exists but voice was retimed, preserving that old karaoke ASS would still be stale. The burn bridge now disables karaoke preservation for that render and logs the reason.
3. Switching Job during render could expose another Render button and race the global burn bridge. A module-level single-render lock now blocks concurrent P3 renders.

## Static status
ChatGPT's isolated container could not download raw GitHub source because outbound DNS is disabled. This is not a source failure. Exact local `node --check` and `git diff --check` remain WAITING and are required before runtime acceptance.

## Parent project status
- Per-Job Semantic Remix was previously observed by Owner as functionally OK in the parent integration build.
- Long Standard narration remains a separate P1 design issue tracked by task 014 research and is not modified by P3 task 016.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: PASS pre-runtime.
- Merge permission: BLOCKED.

## Next permitted action
Verify live PR #58 exact head/files/status/comments, then Owner may reuse the existing clean local test directory for static and P3 runtime verification. Do not create another local directory and do not merge.
