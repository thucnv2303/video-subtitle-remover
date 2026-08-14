# Current Task

## Task ID
PIPELINE3-WORKSPACE-015

## Status
SOURCE_PUBLISHED_REVIEW_IN_PROGRESS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Exact basis
- Branch: `review/PIPELINE3-WORKSPACE-015`.
- Starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`.
- Spec: `.ai/task_specs/PIPELINE3-WORKSPACE-015.md`.
- Source head before canonical docs: `037c6627df5977e705a59a2ce5d6476b803637ea`.

## User outcome
Implement the Owner-approved Pipeline 3 workspace matching the approved demo composition while using the application's existing dark visual system. Subtitle configuration is the highest-priority detailed area, especially smooth direct mouse placement in preview.

## Implemented V1
- Runtime replacement of old minimal Step 3 pane with a P3 workspace.
- Final preview, play/pause/seek, subtitle cue preview and compact video/voice/subtitle/effect timeline.
- Per-Job `p3Config` so switching Jobs restores independent style/position/audio choices.
- Presets: Default, YouTube, Karaoke, Minimal, News, Review.
- Subtitle controls: font, size, bold, italic, text color, outline color/width, shadow, background box/color/opacity/radius/padding, max width, line height, alignment, X/Y, reset, fade/pop.
- Pointer-event subtitle drag with pointer capture, requestAnimationFrame, safe bounds, optional snap and grid/safe-zone display.
- P3-derived ASS generated from timed SRT with exact `\\pos(x,y)` and text effect tags. Existing P1 karaoke ASS is preserved before runtime decoration.
- Audio controls use current remove-vocal/background-volume finalizer inputs.
- Export UI describes only current MP4/H.264 behavior.
- Render CTA calls existing finalizer once and exposes rendering/completed states.

## Source scope
Changed application source is limited to:
- `src/renderer/js/pipeline3-workspace.js` (new)
- `src/renderer/styles/pipeline3-workspace.css` (new)
- `src/renderer/js/pipeline1-run-config.js` (+1 loader import only)

No backend, TTS, P2, existing P3 finalizer or dependency changes.

## Required review / verification
PM review must confirm:
- CSS is P3-namespaced and does not bleed into P1/P2;
- module can mount before/after `app.js` and does not duplicate listeners;
- P3 job selection respects existing pipeline gate state;
- drag updates X/Y smoothly and remains per Job;
- generated ASS escapes dialogue text and preserves timing order;
- render path does not overwrite P1/P2 artifacts;
- loader import makes no behavioral P1 changes.

Required local static on exact final HEAD:
```text
node --check src/renderer/js/pipeline3-workspace.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

Owner runtime after PM source review PASS:
1. reuse existing test directory only; no new clone/worktree;
2. P3 visual hierarchy matches approved demo and current app color tone;
3. drag subtitle top-left/center/bottom-right; X/Y follow smoothly;
4. modify preset/font/size/color/outline/background/alignment/effect and verify live preview;
5. switch between two P3-ready Jobs and confirm configuration isolation;
6. render a short Job; final burned subtitle position/style should closely match preview;
7. verify per-Job Remix/P1 and P2 were not regressed.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: IN PROGRESS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PASS for pre-runtime state after docs publication.
- Merge: BLOCKED.
