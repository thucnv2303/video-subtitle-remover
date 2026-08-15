# PIPELINE3-FINAL-COMPOSITION-017 — Runtime Fix Rev4

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Exact starting HEAD: `92deaf8fa72094fbad3f84c75c716967acbc509d`
- Owner runtime evidence: screenshots supplied 2026-08-15.

## Owner-observed blockers
1. P3 inspector/right panel content overflows horizontally and controls/data are clipped.
2. `Xóa giọng gốc` can finish while original vocal remains audible in final output.
3. Export has no selectable destination and no real output-quality choice.

Decision for tested build: `NEEDS_REVISION`.

## Verified root causes
### Inspector
P3 uses fixed/narrow inspector columns and several `width:100%` form controls without a P3-wide border-box/min-width contract. The style library intentionally has horizontal category scrolling, but the inspector itself must never develop hidden horizontal overflow or clip form columns.

### Vocal removal
`/api/remove-vocal` is best-effort: Demucs -> center subtraction -> ffmpeg pan -> original-audio warning fallback. P3 finalizer currently accepts `ok` from weak fallback methods and also accepts warning responses when an `audio_path` exists. Therefore the checkbox can claim vocal removal while a fallback still contains the original vocal.

For P3, the checkbox contract becomes strict: when enabled, final render may only continue with an AI separated `no_vocals` stem (`method_used=demucs`). Any fallback/unknown/original method blocks the render with a clear error instead of silently mixing vocals back in.

### Export destination / quality
P3 final output is hardcoded to `<source>_final.mp4`. Subtitle burn also does not expose explicit codec/CRF/preset, so a quality selector would currently be fake.

Rev4 adds real H.264 quality parameters to the existing backend burn/tempo requests and uses the existing Electron directory picker for destination selection.

## Scope
### A. Inspector overflow
- P3-wide `box-sizing:border-box` for form/layout descendants.
- `min-width:0` on inspector/fold/grid/style-library children.
- no inspector-level horizontal scrollbar.
- category chips may scroll horizontally inside their own row only.
- slightly widen inspector on large desktop widths while preserving center preview priority.
- at narrow supported desktop widths, grids collapse rather than clip.

### B. Strict remove-vocal
- finalizer checks `method_used`.
- only `demucs` is accepted for the `Xóa giọng gốc` promise.
- fallback methods (`librosa_center_sub`, `ffmpeg_pan`, `original`, missing/unknown) stop P3 render and show a clear instruction that AI vocal separation is unavailable/failed.
- never silently mix original vocals when checkbox is enabled.
- log accepted separation method.

### C. Export destination
Per Job:
- `outputDirectory` selected using existing `electronAPI.openDirectory()`.
- `outputFileName` editable, sanitized to `.mp4`.
- default remains `<source-stem>_final.mp4` if user does not choose another destination.
- output summary shows exact final path.
- existing open-output action uses selected final path.

### D. Real export quality
Quality presets:
- `balanced`: H.264 libx264, CRF 20, preset medium.
- `high`: H.264 libx264, CRF 18, preset slow. Default.
- `very_high`: H.264 libx264, CRF 16, preset slow.
- `max`: H.264 libx264, CRF 14, preset slower.

Rules:
- source resolution and FPS are preserved;
- no resize;
- subtitle burn receives real `video_crf` + `video_preset` and explicitly uses libx264;
- video-tempo encode, when required, receives the same quality settings;
- audio remains copied during subtitle burn when compatible;
- no fake codec selector; codec is H.264 for Rev4.

## Allowed application source
- `src/renderer/styles/pipeline3-editor.css`
- `src/renderer/js/pipeline3/editor.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/render-controller.js` if required for final-path handoff
- `src/renderer/js/pipelines/pipeline3-finalize.js`
- `src/renderer/js/api.js`
- `api/server.py`

No P1/P2/TTS/dependency changes.

## Acceptance
1. At Owner screenshot window size, inspector has no hidden horizontal clipping; every field/card is reachable without page-level horizontal scroll.
2. With Remove Vocal ON, P3 never succeeds using `librosa_center_sub`, `ffmpeg_pan`, `original`, or unknown separation method.
3. Demucs success mixes the no-vocals bed and logs `method=demucs`.
4. Export lets Owner choose a folder and filename per Job.
5. Export offers four real quality presets and final summary shows codec/CRF/preset/path.
6. Backend burn and video-tempo requests honor selected CRF/preset.
7. Re-render still starts from P2 clean video and writes to currently selected destination.
8. Subtitle style engine, cover-band, cue edit and voice/video fit remain unchanged.

## Required verification
```text
node --check src/renderer/js/pipeline3/editor.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
node --check src/renderer/js/api.js
python -m py_compile api/server.py
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING after source publication.
- Owner runtime: FAIL on tested build / WAITING after Rev4.
- Documentation synchronization: PARTIAL until Rev4 closeout.
- Merge: BLOCKED.
