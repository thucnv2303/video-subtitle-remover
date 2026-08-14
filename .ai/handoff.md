# AgentOS Handoff Status

## Active task
`PIPELINE3-WORKSPACE-015`

## Status
SOURCE PUBLISHED / PM REVIEW IN PROGRESS / STATIC WAITING / OWNER RUNTIME NOT STARTED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/PIPELINE3-WORKSPACE-015`
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
- Spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015.md`
- Source head before docs: `037c6627df5977e705a59a2ce5d6476b803637ea`

## Product decision
Owner approved the concrete PEP3 workspace demo and authorized direct GitHub implementation. The implementation must stay visually consistent with the existing app rather than introducing a separate neon theme. Direct mouse positioning of subtitles is required and must be smooth.

## Published source
- new `src/renderer/js/pipeline3-workspace.js`
- new `src/renderer/styles/pipeline3-workspace.css`
- `src/renderer/js/pipeline1-run-config.js` changed only by one module-loader import

The workspace uses the existing P3 finalizer and backend. No backend/TTS/P2/P1 reasoning dependency changes are part of this task.

## Key behavior for review
- P3-ready Job selector and independent `job.p3Config`.
- Real final-video preview and timed subtitle cue display.
- Rich subtitle inspector with presets, typography, outline/shadow/background/layout and text effects.
- Pointer-captured drag + requestAnimationFrame updates normalized X/Y; optional snap/grid/safe zone.
- Renderer derives an ASS with exact `\\pos(x,y)` and passes it through the existing `job.karaokeAss` finalizer contract without modifying P1 artifact files.
- Current audio support only: remove original vocal + background volume + voice-fit telemetry.
- Current export support only: MP4/H.264 summary and existing `window.finalizeVideo(job)`.

## Parent project note
Owner observed per-Job Semantic Remix working correctly. Long Standard narration remains unresolved in P1 and is tracked separately by the task-014 research proposal. Do not mix that source redesign into P3 Workspace 015.

## Local safety
Do not create any more clone/worktree/test directories. Owner runtime must reuse the existing local test directory only after `git status --short` is empty. Dirty => STOP; no reset/restore/clean overwrite.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: IN PROGRESS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS for pre-runtime state after docs commit.
- Merge: BLOCKED.

## Next permitted action
Complete GitHub source/diff review and Draft PR publication. If PM review passes, provide commands to reuse the existing test directory at the exact P3 head for static/UI/manual render verification. No merge until those gates pass.
