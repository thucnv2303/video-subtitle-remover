# Current State

## Status
PIPELINE3-FINAL-COMPOSITION-017 — SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Revision-017 exact starting SHA: `63cabee71f0faaf451138201da789ba0c935fc68`.
- Reviewed application-source head: `91678a85bc3d15838c96b96b9f4fc768059f3fec`.
- Main spec: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017.md`.
- Backend-amendment record: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-BACKEND-AMENDMENT.md` — superseded; backend source was not changed.

## Owner product authority
Pipeline 3 is a focused Final Composition tool, not a general-purpose NLE. Its job is:
1. combine P2 clean video with P1 voice;
2. create/style/position new subtitles, especially to cover residual blemishes in the old subtitle area;
3. reconcile voice/video duration using conservative speed changes;
4. mix the required original/background audio;
5. export a high-quality final video while preserving source geometry/FPS and avoiding unnecessary encode stages.

## Reviewed Revision-017 source
Revision-017 application delta is limited to:
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/editor.js`
- new `src/renderer/js/pipeline3/fit-planner.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- `src/renderer/styles/pipeline3-editor.css`

No P1, P2, backend API/server, TTS engine or dependency source is changed by Revision 017.

## Verified focused behavior from source
### Subtitle-first
- Existing font/size/bold/italic/color/outline/shadow/text-box controls remain per Job.
- Preset `Che vùng lem` enables a dedicated cover band behind subtitle text.
- Cover band has independent color, opacity, width percentage and logical-video pixel height.
- Preview band shares subtitle X/Y and scales from logical video pixels to current fitted canvas.
- Derived ASS creates the cover as a closed vector polygon on layer 0 and text on layer 1 for each active cue.
- Direct subtitle drag remains logical-coordinate authority.

### Cue correction
- Clicking a timeline cue selects it for text/start/end editing.
- Save normalizes against previous/next cue boundaries and rejects invalid/overlapping timing.
- Edited SRT is stored in `job.p3BaseTimedSrt` / P3 memory only; P1 `ttsTimedSrt` remains immutable.
- Re-render always starts timing from that stable P3 base, preventing cumulative/double scaling.

### Voice ↔ Video fit
New deterministic planner supports:
- `natural`
- `fit_voice`
- `fit_video`
- `balanced`
- `auto`

Safe bounds:
- voice: `0.92x–1.08x`
- video: `0.90x–1.10x`

The UI shows source durations, planned speeds, predicted final durations and residual mismatch before render. Unsafe plans are blocked.

The planner avoids a video encode if the planned video change is below the existing engine's 2% retime threshold by converting that balanced case to effective voice-only fit when safe.

### Audio synchronization
The existing `/api/adjust-video-tempo` route drops source audio when retiming video. Revision 017 therefore does not pretend generic original-audio retime is supported:
- video retime + background volume `0`: allowed;
- video retime + `Remove original vocal` ON + non-zero background: separate the background from the base clean source, then apply the same video tempo to that derived background using the existing Electron `applyVoiceTempo`/FFmpeg `atempo` bridge before mix;
- explicit video retime + original/background audio >0 + remove-vocal OFF: blocked;
- Auto prefers a safe voice-only fit when possible instead of creating that conflict.

No backend source amendment was required.

### Final render / quality contract
- Original P1 voice/SRT and P2 clean video are not overwritten.
- P3 creates derived voice/video/timed-SRT artifacts only when required.
- Re-render restores `job.p3CleanVideoPath` and stable P3 subtitle timing source.
- Subtitle ASS is rebuilt from the exact final SRT used at burn time if voice timing changed.
- Source karaoke timing is used only when timing remains valid and cues were not edited.
- Source resolution/FPS are preserved; no resize is added.
- Audio-only mix paths copy the video stream.
- Existing video-retime path remains H.264 CRF 18.
- Subtitle is burned once at final stage.
- Explicit final burn CRF/preset selection is NOT exposed because the backend does not currently offer that contract.

## PM review corrections made before Owner test
- Stable P3 subtitle source prevents cumulative SRT scaling across second render.
- Karaoke preservation no longer gets disabled when final timing is unchanged.
- Video-retime/background-audio incompatibility is surfaced and fail-closed rather than silently losing/desynchronizing audio.
- Auto plan uses the same audio constraint logic in UI and finalizer.
- Cover polygon is explicitly closed for deterministic ASS fill.

## Verification status
- PM source/code review: PASS logic/scope.
- PM isolated syntax/functional spot checks: PASS for the newly changed P3 JS modules.
- Exact checkout `node --check` + `git diff --check`: WAITING.
- GitHub CI/status: must be rechecked at final docs HEAD; absence of checks is not PASS.
- Owner real-app verification for Revision 017: WAITING.

## Local safety
Do not create another clone/worktree/test directory. Owner verification must reuse the existing test directory only after `git status --short` is empty. Dirty => STOP; no reset/restore/clean.

## Gates
- Execution: PASS.
- Automated verification: WAITING exact-checkout evidence.
- Code review: PASS.
- Owner manual app verification: WAITING.
- Documentation synchronization: PASS pre-runtime after dynamic-doc closeout.
- Merge permission: BLOCKED.

## Next permitted action
Finish canonical Revision-017 docs/PR synchronization, verify exact live PR head/files/checks/comments, then Owner may switch the existing clean test directory to that exact HEAD and run static + focused P3 runtime acceptance. No merge.
