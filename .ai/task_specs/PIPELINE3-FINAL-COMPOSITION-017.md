# PIPELINE3-FINAL-COMPOSITION-017 — Subtitle-first Final Composition

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Continuing review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Exact starting HEAD for this revision: `63cabee71f0faaf451138201da789ba0c935fc68`
- Parent implementation: `PIPELINE3-EDITOR-REBUILD-016`
- Owner approval: 2026-08-14 — focus P3 on subtitle coverage, voice/video fit, audio composition and high-quality final output; do not expand into a general-purpose NLE.

## Product job-to-be-done
Pipeline 3 combines:
- P2 `clean_video.mp4` / clean video artifact;
- P1 narration voice + timed subtitle artifacts;

and produces a final publishable video where:
1. new subtitles are deliberately styled/positioned to cover residual blemishes left in the old burned-subtitle area;
2. voice and video duration/speed are reconciled conservatively and transparently;
3. original/background audio is mixed at an intentional level;
4. final output preserves source geometry/FPS and avoids unnecessary quality loss.

## Non-goals
- no general clip cutting/reordering;
- no transition library;
- no arbitrary overlay/media tracks;
- no keyframe editor;
- no masks/chroma/plugin system;
- no fake export controls unsupported by the current engine.

## Verified current engine capabilities
### Voice tempo
`window.electronAPI.prepareP1NarrationAudio()` uses FFmpeg `atempo`, pitch-preserving, and can create a derived P3 voice without overwriting P1 audio.

### Video tempo
Existing `/api/adjust-video-tempo`:
- computes video speed against a requested target duration;
- supports bounded min/max speed;
- uses `setpts` and H.264 CRF 18 when actual retiming is needed;
- copies the video when deviation is <2%.

### Audio mix
Existing finalizer/backend:
- can preserve original audio at a selected background level;
- can optionally remove original vocal first and mix the separated bed with TTS;
- keeps the video stream copied during audio-only mix.

### Subtitle burn
P3 already generates a derived ASS and backend burns ASS with FFmpeg. Exact logical `\\pos(x,y)` is supported. Burn requires video re-encode but preserves source canvas geometry.

## V3 feature scope

### A. Subtitle coverage studio — highest priority
Per-Job controls:
- existing font / size / bold / italic / text color / outline / shadow;
- existing text background box;
- new **Cover old-sub area** mode independent of glyph background:
  - off / band;
  - band color;
  - opacity;
  - width %;
  - height in logical video px;
  - exact X/Y uses the same logical position model as subtitle text;
  - cover band is rendered as a separate lower ASS layer for each active subtitle cue, so it can cover P2 residual artifacts behind the new subtitle without hiding the text;
- preset `Che vùng lem` optimized for a dark semi-transparent subtitle band;
- preview must show the cover band with the same logical geometry;
- safe-zone + direct drag remain authoritative;
- no destructive changes to P1/P2 subtitle artifacts.

### B. Cue edit
Focused correction only, not a full caption editor:
- selecting/clicking a subtitle cue exposes current text, start and end time;
- user can edit text and bounded start/end;
- commit rebuilds `job.p3TimedSrt` in memory;
- cue times must remain ordered, positive and non-overlapping after normalization;
- edited P3 SRT is derived state; original P1 SRT remains untouched.

### C. Voice / video fit planner
Per-Job modes:
- `natural`: no duration forcing; valid when voice does not overrun the final video;
- `fit_voice`: keep video speed 1.00x, adjust voice only within 0.92x–1.08x;
- `fit_video`: keep voice speed 1.00x, adjust video only within 0.90x–1.10x;
- `balanced`: split the mismatch multiplicatively using the geometric-mean solution, subject to both safe bounds;
- `auto`: no-op if already close; otherwise choose balanced when feasible; if voice is shorter and safe fit is not feasible, keep natural; if voice is longer and cannot fit safely, block render.

The UI must show before render:
- source video duration;
- P1 voice duration;
- selected/recommended strategy;
- planned voice speed;
- planned video speed;
- predicted final video duration;
- predicted final voice duration;
- residual gap/overrun.

Manual unsafe values are not exposed in this revision.

### D. Finalizer integration
- compute the fit plan once from Job config and measured duration;
- create derived P3 video only if planned video speed differs materially from 1.0, using existing `/api/adjust-video-tempo` with min=max=planned video speed and target duration consistent with that plan;
- create derived P3 voice only if planned voice speed differs materially from 1.0, using existing `prepareP1NarrationAudio`;
- scale the active P3 SRT to the actual derived voice duration when voice speed changes;
- subtitle burn timing bridge must continue rebuilding ASS from the exact final SRT used by finalizer;
- never overwrite P1 voice/SRT or P2 clean video;
- second render always restarts from preserved `job.p3CleanVideoPath`.

### E. Audio composition
Keep scope narrow:
- original/background level 0–100%;
- remove-original-vocal toggle using current backend;
- no new unsupported music library;
- no DAW features.

### F. High-quality output contract
For this revision, do not expose unsupported codec/CRF selectors.
The real quality contract is:
- preserve source resolution;
- preserve source FPS;
- do not resize;
- audio-only stages use `-c:v copy`;
- video retime uses existing H.264 CRF 18 path;
- subtitle burn occurs once, at the final stage;
- avoid extra intermediate video re-encodes;
- UI must show the actual contract rather than fake quality controls.

A future dedicated backend task may expose explicit H.264 CRF/preset settings only after a narrow server API change and runtime validation.

## UI hierarchy
Retain the approved P3 V2 3-column editor, but make the right inspector focused:
1. `Phụ đề` — default open;
2. `Che vùng lem` — default open when enabled;
3. `Sửa cue`;
4. `Voice ↔ Video Fit`;
5. `Audio`;
6. `Xuất video`;
7. `Nâng cao`.

Related settings remain fold/accordion groups.

## Allowed source
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/editor.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline3/render-controller.js`
- new `src/renderer/js/pipeline3/fit-planner.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- `src/renderer/styles/pipeline3-editor.css`

No backend/API/TTS/P1/P2 source change in this revision.

## Acceptance
1. User can create a full-width/partial-width subtitle cover band behind each active cue and drag it with the subtitle to cover old-sub residual areas.
2. Preview and derived ASS use the same logical X/Y, band width/height and color/opacity.
3. User can edit a cue text/start/end and immediately see timeline/preview update; P1 SRT remains unchanged.
4. Fit panel reports durations and exact planned speeds before render.
5. `fit_voice`, `fit_video`, `balanced`, `natural`, `auto` behave within documented safe bounds.
6. Unsafe long-voice case blocks instead of applying extreme speed.
7. Render uses derived voice/video only when needed and never overwrites P1/P2 artifacts.
8. Re-render starts from P2 clean video.
9. Source resolution/FPS are preserved; no unnecessary extra video encode stage is introduced.
10. Per-Job P3 configuration remains isolated.

## Required verification
```text
node --check src/renderer/js/pipeline3/editor.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipeline3/fit-planner.js
node --check src/renderer/js/pipeline3/subtitle-ass.js
node --check src/renderer/js/pipeline3/render-controller.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
git diff --check 63cabee71f0faaf451138201da789ba0c935fc68..HEAD
```

Owner runtime:
- reuse existing test directory only;
- verify cover band at bottom/center/top and after window resize;
- edit at least one subtitle cue and verify final burn uses edited text/timing;
- test one near-match fit and one visibly mismatched fit;
- verify speed plan shown before render matches logs/result;
- render twice with changed subtitle settings and confirm no double-burn/reuse of final output.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING for revision source.
- Owner runtime: WAITING after PM source review.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
