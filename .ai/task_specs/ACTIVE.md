# Active PM Execution Spec

Status: PIPELINE3_WORKSPACE_015_SOURCE_PUBLISHED_CODE_REVIEW_PASS_OWNER_VERIFY_WAITING

Task: `PIPELINE3-WORKSPACE-015`
Repository: `thucnv2303/video-subtitle-remover`
Review branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57
Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
Main spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015.md`
Revision-1 safety spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015-REV1-RERENDER-SAFETY.md`
Reviewed application-source head: `198aa12d376cc7bdea23da6ea791717b07a73d4b`

## Purpose
Implement the Owner-approved Pipeline 3 final render workspace with current app visual tokens, detailed subtitle styling, smooth direct subtitle placement, final preview/timeline, current audio controls and existing render path.

## Application source scope
- new `src/renderer/js/pipeline3-workspace.js`
- new `src/renderer/styles/pipeline3-workspace.css`
- new `src/renderer/js/pipeline3-rerender-safety.js`
- two loader imports in `src/renderer/js/pipeline1-run-config.js`

No backend, P1 reasoning/TTS, P2, existing P3 finalizer or dependency changes.

## Required invariants
- P3 consumes P1 artifacts + P2 clean video and does not overwrite immutable artifacts.
- Settings live per Job in `job.p3Config`.
- Subtitle position is directly draggable and maps to exact derived ASS placement.
- Existing P1 karaoke ASS is preserved before P3 runtime derivation.
- Subsequent renders restore preserved `job.p3CleanVideoPath` before finalization.
- Render calls existing `window.finalizeVideo(job)` once and prevents duplicate render clicks.
- Only actual current audio/export capabilities are shown as actionable controls.
- UI uses current CSS variables and P3-namespaced selectors.
- Existing pipeline.js remains Step 1/2/3 visibility authority.
- No new local clone/worktree/test directory.

## Required verification on exact final HEAD
```text
git rev-parse HEAD
node --check src/renderer/js/pipeline3-workspace.js
node --check src/renderer/js/pipeline3-rerender-safety.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

## Owner runtime acceptance
- P3 UI follows approved demo composition and app color tone.
- P3 empty/ready/rendering/completed states are clear.
- Drag subtitle to multiple locations; controls/preview remain synchronized and smooth.
- Style/preset settings preview immediately and remain isolated between Jobs.
- One short final render places/styles burned subtitle close to preview.
- Change settings and render again; second render must use the original clean P2 source, not previous final output.
- Existing P1 per-Job Remix and P2 flow remain unchanged.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS pre-runtime.
- Merge: BLOCKED.

## Next permitted action
PM verifies live PR #57 exact final head/files/checks/comments. Then Owner updates the existing clean local test directory to that exact head and runs static/UI/manual render verification. Do not merge.
