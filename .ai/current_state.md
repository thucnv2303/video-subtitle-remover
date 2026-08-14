# Current State

## Status
PIPELINE3-WORKSPACE-015 — SOURCE PUBLISHED / PM SOURCE REVIEW IN PROGRESS / STATIC WAITING / OWNER RUNTIME NOT STARTED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE3-WORKSPACE-015`.
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1` from `review/PIPELINE1-INTEGRATION-013`.
- Task spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015.md`.
- Spec commit: `1ca68db5672b0f710af8ce0b15171b7d6ebfd8cf`.
- Application source commits published through `037c6627df5977e705a59a2ce5d6476b803637ea`.

## Owner-approved product direction
Owner approved the PEP3 Final Render & Assembly mockup and explicitly authorized implementation. Required visual direction: retain the current app dark tokens, use a large final preview + compact timeline + detailed settings inspector, and allow direct mouse dragging of subtitle position.

Owner also explicitly requires no more local clone/worktree/test directories. Future runtime verification must reuse the existing test directory only when clean.

## Published application source
Authorized application delta from starting SHA currently contains only:
- new `src/renderer/js/pipeline3-workspace.js`;
- new `src/renderer/styles/pipeline3-workspace.css`;
- one loader import in `src/renderer/js/pipeline1-run-config.js`.

No backend, Pipeline 3 finalizer, P1 reasoning/TTS, P2, dependency or package changes are included.

### Workspace behavior
- Replaces the legacy minimal Step 3 pane at runtime without changing the HTML shell.
- Shows only P3-eligible Jobs and stores settings per Job in `job.p3Config`.
- Real local-video preview with play/pause/seek and timed-SRT cue preview.
- Subtitle preset library plus font, size, bold/italic, text/outline colors, outline/shadow, optional background box, opacity, padding, line-height, max width, alignment and fade/pop text effects.
- Subtitle can be dragged with Pointer Events; pointer capture + `requestAnimationFrame` keeps X/Y updates smooth. Optional snap/grid and safe-zone overlay are available.
- Preview X/Y becomes exact ASS `\\pos(x,y)` placement in a P3-derived ASS stored only in Job memory; immutable P1/P2 artifacts are not overwritten.
- Existing P1 karaoke ASS is preserved separately before a P3-derived ASS is installed.
- Audio controls map only to currently supported finalizer inputs: remove original vocal and background/original-bed volume.
- Export summary exposes the real current MP4/H.264 path only; no fake backend controls.
- Render CTA calls existing `window.finalizeVideo(job)` once and blocks duplicate clicks while rendering.

## Parent integration status
Per-Job Semantic Remix was observed by Owner as functionally OK in the parent integration build. The long Standard narration issue remains a separate unresolved P1 design problem; task 014 research proposal exists but no corrective source is part of this P3 task.

## Gates
- Execution: PASS (source published).
- Automated/static: WAITING on exact final checkout.
- Code review: IN PROGRESS; GitHub scope review is clean so far.
- Owner manual app verification: NOT STARTED for P3 workspace.
- Documentation synchronization: PASS for pre-runtime state after this docs commit.
- Merge permission: BLOCKED.

## Next permitted action
Finish PM full-file/diff review, open/update Draft PR, verify exact head/files/checks/comments, then Owner may reuse the existing clean test directory to run static checks and verify the approved P3 UI/drag/render behavior. Do not create another local directory and do not merge yet.
