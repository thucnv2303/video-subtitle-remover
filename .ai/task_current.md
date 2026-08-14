# Current Task

## Task ID
PIPELINE3-WORKSPACE-015

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57.
- Starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`.
- Main spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015.md`.
- Re-render safety amendment: `.ai/task_specs/PIPELINE3-WORKSPACE-015-REV1-RERENDER-SAFETY.md`.
- Reviewed application-source head: `198aa12d376cc7bdea23da6ea791717b07a73d4b`.

## User outcome
Implement the Owner-approved Pipeline 3 workspace matching the approved demo composition while using the application's existing dark visual system. Subtitle configuration is the highest-priority detailed area, especially smooth direct mouse placement in preview.

## Implemented V1
- Runtime replacement of old minimal Step 3 pane with a P3 workspace that still obeys the existing pipeline step visibility controller.
- Final preview, play/pause/seek, subtitle cue preview and compact video/voice/subtitle/effect timeline.
- Per-Job `p3Config` so switching Jobs restores independent style/position/audio choices.
- Presets: Default, YouTube, Karaoke, Minimal, News, Review.
- Subtitle controls: font, size, bold, italic, text color, outline color/width, shadow, background box/color/opacity/radius/padding, max width, line height, alignment, X/Y, reset, fade/pop.
- Pointer-event subtitle drag with pointer capture, requestAnimationFrame, safe bounds, optional snap and grid/safe-zone display.
- P3-derived ASS generated from timed SRT with exact `\\pos(x,y)` and text effect tags. Existing P1 karaoke ASS is preserved before runtime decoration.
- Audio controls use current remove-vocal/background-volume finalizer inputs.
- Export UI describes only current MP4/H.264 behavior.
- Render CTA calls existing finalizer once and exposes rendering/completed states.
- Re-render safety restores preserved `job.p3CleanVideoPath` before subsequent final renders so previous final output is never used as the next clean source.

## Source scope
Changed application source is limited to:
- `src/renderer/js/pipeline3-workspace.js` (new)
- `src/renderer/styles/pipeline3-workspace.css` (new)
- `src/renderer/js/pipeline3-rerender-safety.js` (new)
- `src/renderer/js/pipeline1-run-config.js` (+2 loader imports only)

No backend, TTS, P2, existing P3 finalizer or dependency changes.

## PM review evidence
- Scope reviewed against exact starting SHA.
- Initial Step-3 visibility override was found during self-review and corrected before Owner testing.
- Re-render clean-source reuse risk was found during self-review and corrected by an isolated capture-phase guard.
- Existing step navigation explicitly controls `.pipeline-pane` inline display; final CSS no longer overrides it.
- P1 run-config logic itself is unchanged except module imports.
- No review comments/CI status currently exist on the Draft PR.

## Required local static on exact final HEAD
```text
git rev-parse HEAD
node --check src/renderer/js/pipeline3-workspace.js
node --check src/renderer/js/pipeline3-rerender-safety.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

Owner runtime:
1. reuse existing test directory only; no new clone/worktree;
2. P3 visual hierarchy matches approved demo and current app color tone;
3. drag subtitle top-left/center/bottom-right; X/Y follow smoothly;
4. modify preset/font/size/color/outline/background/alignment/effect and verify live preview;
5. switch between two P3-ready Jobs and confirm configuration isolation;
6. render a short Job; final burned subtitle position/style should closely match preview;
7. change style and render again; second render must still start from original clean P2 video, not previous final output;
8. verify per-Job Remix/P1 and P2 were not regressed.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS pre-runtime after final sync.
- Merge: BLOCKED.
