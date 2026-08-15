# PIPELINE3-EDITOR-REBUILD-016 — Final Assembly Editor V2

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/PIPELINE3-EDITOR-REBUILD-016`
- Exact starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`
- Starting ref: `review/PIPELINE1-INTEGRATION-013`
- Prior rejected prototype: PR #57 / `PIPELINE3-WORKSPACE-015`; do not reuse it as merge-ready source.
- Owner approved the new P3 editor demo in chat on 2026-08-14 and explicitly authorized implementation.
- Owner additionally requires settings with related functions grouped as collapsible fold/accordion sections: click the section header to open/close details instead of permanently showing every field.
- Local safety: do not create any additional local clone/worktree/test directory. Owner test must reuse the existing test directory only when clean.

## Product outcome
Rebuild Pipeline 3 as a focused final-assembly editor inspired by OpenCut information architecture while remaining purpose-built for this application. P3 consumes P1 artifacts + P2 clean video, provides a professional preview/timeline/settings workflow, and calls the existing finalization engine. It is not a free-form NLE.

## Screen architecture
### 1. Visible Job Manager / Source Bin — left
- Dedicated P3 Job panel, not a dropdown-only selector.
- Shows P3-ready / rendering / completed / error jobs with name, readiness indicators and active selection.
- Search and status filter.
- Job selection is isolated from P1/P2 selection state unless an explicit sync is needed.
- Settings live per Job in `job.p3Config`.

### 2. Preview & Logical Canvas — center
- Logical video canvas uses actual source width/height as authority.
- Viewport may resize independently; fit scale = `min(viewportWidth/videoWidth, viewportHeight/videoHeight)`.
- Letterbox/pillarbox is expected; source image must never stretch.
- Video playback, play/pause, seek and current/total time.
- Safe-zone overlay.
- Subtitle is a draggable overlay whose coordinates map explicitly between viewport pixels and logical video coordinates.
- Pointer Events + pointer capture + requestAnimationFrame for smooth drag.
- Clamp to logical canvas and optional snap/safe-zone behavior.

### 3. Properties Inspector — right
Use collapsible accordion/fold groups. Only one or a few related groups need be expanded at once; clicking a group header toggles its body.

Required groups:
- **Phụ đề**: preset, font, size, bold/italic, text color, outline color/width, shadow, background, opacity, padding, line-height, max width, burn toggle.
- **Bố cục & Vị trí**: 3×3 anchors, align, logical X/Y, safe-zone, snap, reset position.
- **Hiệu ứng chữ**: none/fade/pop, bounded duration. No fake effect not supported by ASS generation.
- **Audio**: voice-fit telemetry, remove-original-vocal toggle.
- **Nhạc nền**: current original/background-bed volume only; no unsupported music library/download feature.
- **Xuất video**: current real MP4/H.264 summary and render readiness; no fake codec/resolution controls that backend cannot honor.
- **Nâng cao**: preserve karaoke source timing when available, reset P3 config, debug/readiness summary.

Subtitle-related groups should be near the top and `Phụ đề` open by default. Other groups default collapsed.

### 4. Assembly Timeline — bottom center
- Separate rows for Video, Voice, Subtitle and Effects.
- Subtitle cues render as actual timed blocks, not one full-length bar.
- Playhead is synchronized with preview currentTime.
- Clicking timeline ruler or cue seeks preview.
- This V2 timeline is inspection/assembly only: no arbitrary clip cutting or media rearrangement.

### 5. Primary action
- Sticky/always-visible `Bắt đầu Render` at lower right.
- Disabled until a P3-ready Job and clean P2 video exist.
- Render state blocks duplicate clicks.
- Completed state exposes final output/open action.

## Theme
The prior P3 black/purple local theme is rejected.
Use the approved app/editor palette:
- page: dark navy;
- surface: blue-gray/navy;
- border: blue-gray;
- primary selection/focus: blue;
- semantic success/warning/error: green/orange/red;
- purple only as limited existing accent/primary render CTA, not the entire P3 identity.
No external fonts/dependencies.

## State / integration rules
- P3 settings per Job only; no hidden global subtitle style authority.
- Existing `window._appState` remains source for Job data.
- Existing `pipeline-state.js` P1/P2/P3 readiness remains source for `job.p3Status`.
- Keep a hidden compatibility `#step3-job-list` so existing `app.js` / `pipeline-state.js` may continue their legacy synchronization without overwriting the visible P3 Job Manager.
- Visible P3 Job Manager is refreshed from explicit legacy-list mutation / render events, not fixed 300 ms polling as primary authority.
- Do not modify P1/P2 behavior.

## Subtitle render contract
- Generate a P3-derived ASS in renderer memory from the current timed SRT / karaoke ASS.
- Exact logical X/Y uses ASS `\\pos(x,y)`.
- Preserve original P1 karaoke ASS separately before applying P3 decoration.
- Existing P1/P2 files on disk remain immutable.
- Existing Pipeline 3 finalizer may continue receiving `job.karaokeAss` as the runtime derived ASS.

## Re-render safety
The inherited finalizer currently assigns `job.outputPath = job.finalOutputPath` after success. P3 V2 MUST preserve the original clean P2 video path in `job.p3CleanVideoPath` before first render and restore it before every subsequent render so a final render is never used as the next clean input.

## Source scope
Allowed application source:
- new `src/renderer/js/pipeline3/editor.js`
- new `src/renderer/js/pipeline3/editor-store.js`
- new `src/renderer/js/pipeline3/preview-geometry.js`
- new `src/renderer/js/pipeline3/subtitle-ass.js`
- new `src/renderer/js/pipeline3/render-controller.js`
- new `src/renderer/styles/pipeline3-editor.css`
- minimal P3 bootstrap import in `src/renderer/js/pipelines/pipeline3-finalize.js` only because that module is already loaded by the canonical renderer module bridge.

No changes to:
- backend API/server;
- TTS engine;
- P1/P2 logic;
- dependencies;
- package files.

## Interaction details
- Accordion headers support click and keyboard activation; expanded state updates `aria-expanded`.
- Opening a group does not remount preview or reset current playback.
- Job search/filter preserves active Job if still visible.
- Job switch restores each Job's P3 config and preview position/style.
- Inspector changes update preview immediately and rebuild derived ASS without console spam.
- Preview resize recalculates viewport fit only; logical subtitle coordinates remain unchanged.
- Subtitle drag uses logical coordinates, so resizing the app cannot shift final burn position.
- The UI must remain usable at typical Electron desktop widths; Job Manager and Inspector may scroll internally but preview/timeline should retain primary space.

## Verification
Required static on exact final checkout:
```text
node --check src/renderer/js/pipeline3/editor.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/preview-geometry.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline3/render-controller.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
git diff --check abfe33510523b800654dcf3b1b56f25f4ccd43d1..HEAD
```

PM source review must verify:
- application diff contains only authorized source files;
- no 300 ms P3 polling loop as primary sync;
- logical canvas aspect preservation is explicit;
- visible Job Manager exists;
- accordion/fold behavior is implemented;
- derived ASS uses logical X/Y and escapes dialogue text;
- re-render clean-source safety is active;
- no P1/P2 regression from P3 bootstrap.

## Owner runtime acceptance
Use existing local test directory only; no new clone/worktree.
1. P3 colors/hierarchy match approved demo and app tone.
2. Visible Job Manager appears and lists only appropriate P3 jobs.
3. 16:9, 9:16 and/or another available source preview without stretch; expected letterbox/pillarbox is acceptable.
4. Resize app window; video aspect and subtitle logical position remain stable.
5. Drag subtitle top-left / center / bottom-right; inspector X/Y sync smoothly.
6. Open/close accordion groups; related settings remain grouped and state does not reset.
7. Change subtitle preset/style/position; switch Job and return; each Job retains its own config.
8. Timeline subtitle blocks match timed cues and click-to-seek works.
9. Render one short Job; burned subtitle position/style should closely match preview.
10. Change style and render again; second render still starts from original clean P2 video.
11. P1 per-Job Remix and P2 flow remain unchanged.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
