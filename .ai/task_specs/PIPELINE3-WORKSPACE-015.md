# PIPELINE3-WORKSPACE-015 — Final Render Workspace V1

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Starting ref: `review/PIPELINE1-INTEGRATION-013`
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
- Review branch: `review/PIPELINE3-WORKSPACE-015`
- Owner-approved visual reference: PEP3 Final Render & Assembly demo approved in chat on 2026-08-14.
- Local safety: do not create any additional clone/worktree/test directory. Future Owner test must reuse the existing project test directory only after `git status --short` is clean.

## Product outcome
Replace the current minimal Pipeline 3 pane with a production-oriented final assembly workspace matching the approved demo while preserving the application's existing dark color system and Pipeline responsibilities.

Pipeline 3 remains final composition only: consume P1 artifacts + P2 clean video, configure subtitle/audio/final presentation, preview, and call the existing final render path. Do not move P1 analysis or P2 subtitle removal into P3.

## UX requirements
### Workspace skeleton
- Large final preview with real video playback.
- Multi-track compact timeline for video, voice, subtitle and effect state.
- Quick configuration column and a full settings inspector.
- Primary CTA `Bắt đầu Render` visible without scrolling on normal desktop height.
- Job selector/list shows only P3-ready/in-progress/completed jobs.
- Empty, blocked, rendering, error and completed states must be explicit.

### App visual consistency
- Reuse current CSS variables (`--bg`, `--surface`, `--surface-hover`, `--border`, `--text`, `--text-dim`, `--accent`, semantic colors).
- No independent purple/neon design system that conflicts with current app.
- Use 4/8px spacing rhythm, existing button semantics and compact desktop density.
- No external UI/font dependency.

### Subtitle editor — V1
Per Job configuration, live preview, and final ASS generation must include:
- preset library: Default/YouTube/Karaoke/Minimal/News/Review;
- font family, size, bold, italic;
- primary color;
- outline color + thickness;
- shadow amount;
- optional subtitle background box: color, opacity, radius preview, padding;
- line-height and max-width;
- left/center/right text alignment;
- text animation: none/fade/pop with bounded duration;
- safe-zone overlay toggle;
- snap-to-safe-zone/grid toggle;
- normalized X/Y position controls and reset;
- direct mouse/pointer drag of the subtitle box inside the preview; pointer capture + requestAnimationFrame should keep dragging smooth;
- preview position is authoritative for P3 subtitle placement for the selected Job.

### Subtitle render contract
Do not require a backend redesign for V1.
- Generate/update an ASS representation in the renderer from `job.ttsTimedSrt`.
- Use ASS override tags for exact `\\pos(x,y)` placement and supported fade/pop presentation.
- Store the P3-derived ASS in Job memory for the existing `pipeline3-finalize.js` path, which already passes `job.karaokeAss` to `/api/burn-subtitle-positioned`.
- Preserve an original P1 karaoke ASS separately before replacing the runtime P3 derived ASS. If a source karaoke ASS exists and karaoke preservation is selected, decorate it rather than discarding its timing tags.
- Do not overwrite immutable P1/P2 files on disk.

### Audio controls — V1
Wire only current supported finalization controls:
- remove original vocal toggle -> existing `tts_remove_vocal` preference;
- background/original-bed volume -> existing `tts_bg_volume` preference;
- voice/video duration telemetry and current P3 fit policy summary.
Do not add unsupported music-library/download behavior in this task.

### Export controls — V1
- Show source resolution/duration, voice duration/ratio and current fit decision.
- Format/codec summary reflects current renderer (MP4/H.264 path); do not expose fake controls that backend cannot honor.
- Render button calls existing `window.finalizeVideo(job)` exactly once and provides rendering/success/failure UI state.
- Completed render exposes the existing final output path/open action when available.

## Source scope
Allowed application source:
- new `src/renderer/js/pipeline3-workspace.js`
- new `src/renderer/styles/pipeline3-workspace.css`
- minimal loader import in `src/renderer/js/pipeline1-run-config.js` only because the current HTML bootstrap has no dedicated generic renderer-module hook; this import must not change any P1 behavior.

No source changes in this V1 to:
- `api/server.py`
- `api/tts_engine.py`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- P1 analysis/reasoning/TTS logic
- P2 inpaint logic
- dependencies

## Interaction requirements
- Settings are per Job (`job.p3Config`), never a hidden global style authority.
- Switching jobs restores each Job's own P3 configuration.
- Sliders/color/font/preset changes update preview immediately.
- Drag position updates X/Y controls and derived ASS without console spam.
- Preview uses timed SRT to show the cue matching the video currentTime when available.
- Timeline playhead follows preview playback and seeking.
- All event handlers are installed once; repeated UI sync must not duplicate handlers.
- Render CTA is disabled without a P3-ready Job or required clean-video artifact.

## Acceptance criteria
1. Pipeline 3 visually follows the approved demo but uses the app's current colors/tokens.
2. Old minimal two-column Step 3 UI is replaced at runtime without modifying P1/P2 panes.
3. P3-ready Job selection works and configuration is isolated per Job.
4. Subtitle can be dragged with mouse smoothly to arbitrary preview X/Y; X/Y fields update live.
5. Font/size/color/outline/background/bold/italic/alignment/preset/effect settings update preview live.
6. P3 derived ASS contains exact position and style state; P1 artifact files remain untouched.
7. Video preview, play/pause, seek and timeline playhead operate without blocking the UI.
8. Remove-vocal/background volume controls map to the current finalizer preferences.
9. Render button calls the existing finalizer once; rendering state prevents duplicate clicks.
10. No new local clone/worktree directory is required for Owner testing.

## Verification
Required source review:
- exact changed files match scope;
- no P1 logic regression from loader import;
- no duplicate timers/listeners on remount;
- CSS is namespaced under `.p3w-*` / `#step-3-content` and does not alter P1/P2 globally;
- generated ASS escapes dialogue text and keeps timing order;
- drag is clamped to preview safe coordinates and handles resize.

Required static on exact final head:
```text
node --check src/renderer/js/pipeline3-workspace.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

Owner runtime after PM code review PASS:
- use existing local test directory only;
- verify exact HEAD;
- inspect P3 ready/empty states;
- drag subtitle to at least top-left, center, bottom-right and verify preview/control sync;
- change preset + detailed style and switch between 2 Jobs to verify isolation;
- render one short Job and confirm output subtitle placement/style matches preview closely;
- verify P1/P2 behavior and per-Job Remix remain unchanged.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL.
- Merge permission: BLOCKED.
