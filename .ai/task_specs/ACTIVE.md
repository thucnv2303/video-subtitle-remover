# Active PM Execution Spec

Status: PIPELINE3_WORKSPACE_015_SOURCE_PUBLISHED_REVIEW_IN_PROGRESS

Task: `PIPELINE3-WORKSPACE-015`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/PIPELINE3-WORKSPACE-015`
Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
Spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015.md`
Source head before canonical docs: `037c6627df5977e705a59a2ce5d6476b803637ea`

## Purpose
Implement the Owner-approved Pipeline 3 final render workspace with the current app's visual tokens, detailed subtitle styling, smooth direct subtitle placement, final preview/timeline, current audio controls and existing render path.

## Application source scope
- new `src/renderer/js/pipeline3-workspace.js`
- new `src/renderer/styles/pipeline3-workspace.css`
- one loader import in `src/renderer/js/pipeline1-run-config.js`

No backend, P1 reasoning/TTS, P2, existing P3 finalizer or dependency changes are authorized.

## Required invariants
- P3 consumes P1 artifacts + P2 clean video and does not overwrite immutable artifacts.
- Settings live per Job in `job.p3Config`.
- Subtitle position is directly draggable and maps to exact derived ASS placement.
- Existing P1 karaoke ASS is preserved before P3 runtime derivation.
- Render calls existing `window.finalizeVideo(job)` once and prevents duplicate render clicks.
- Only actual current audio/export capabilities are shown as actionable controls.
- UI uses current CSS variables and P3-namespaced selectors.
- No new local clone/worktree/test directory.

## Required verification on exact final HEAD
```text
git rev-parse HEAD
node --check src/renderer/js/pipeline3-workspace.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

## Owner runtime acceptance
- P3 UI follows approved demo composition and app color tone.
- P3 empty/ready/rendering/completed states are clear.
- Drag subtitle to multiple locations; controls/preview remain synchronized and smooth.
- Style/preset settings preview immediately and remain isolated between Jobs.
- One short final render places/styles burned subtitle close to preview.
- Existing P1 per-Job Remix and P2 flow remain unchanged.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: IN PROGRESS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS for pre-runtime state after docs publication.
- Merge: BLOCKED.

## Next permitted action
PM completes exact source/diff review, publishes Draft PR, verifies live PR head/files/checks/comments, then Owner tests from the existing clean local test directory. Do not merge.
