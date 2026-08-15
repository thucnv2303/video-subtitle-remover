# PIPELINE3-FINAL-COMPOSITION-017 — Runtime Fix Rev4

Status: SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RE-VERIFY WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Exact starting HEAD: `92deaf8fa72094fbad3f84c75c716967acbc509d`
- Reviewed Rev4 application-source HEAD: `d5aae15c5471f0e23f35ac3ae7cc205fc47b0fe3`
- Owner runtime evidence: screenshots supplied 2026-08-15.

## Owner-observed blockers
1. P3 inspector/right panel content overflows horizontally and controls/data are clipped.
2. `Xóa giọng gốc` can finish while original vocal remains audible in final output.
3. Export has no selectable destination and no real output-quality choice.

Decision for the Owner-tested pre-Rev4 build: `NEEDS_REVISION`.

## Verified root causes
### Inspector
P3 used a narrow inspector plus nested grid/form/style-library elements without one reliable border-box/min-width contract. Category navigation also consumed horizontal width and exposed a scrollbar.

### Vocal removal
`/api/remove-vocal` is best-effort: Demucs -> center subtraction -> ffmpeg pan -> original-audio warning fallback. The previous P3 finalizer accepted weak fallback methods and warning responses whenever an `audio_path` existed. Therefore the checkbox did not guarantee that the mixed background was actually a no-vocals stem.

### Export destination / quality
P3 previously hardcoded `<source>_final.mp4`; quality was not user-selectable. The Python subtitle-burn endpoint does not expose CRF/preset, so adding UI controls directly to that route would have been fake without a source change.

## Reviewed implementation
### A. Inspector overflow
`src/renderer/js/pipeline3/runtime-fix-rev4.js` applies a P3-scoped layout guard:
- border-box sizing;
- `min-width:0` / max-width containment for inspector/folds/grids/style cards;
- inspector horizontal overflow hidden;
- style category chips wrap instead of using the visible native horizontal scrollbar;
- right inspector is wider on large desktop widths;
- grids collapse progressively at narrower supported widths.

### B. Strict remove-vocal
`pipeline3-finalize.js` now treats the checkbox as a strict contract:
- when background volume > 0 and Remove Vocal is enabled, only `method_used=demucs` is accepted;
- `librosa_center_sub`, `ffmpeg_pan`, `original`, missing/unknown methods block final render;
- accepted separation logs `method=demucs`;
- if background volume is 0, original audio is replaced by TTS so no separation is required.

This deliberately fails closed instead of claiming success with audible original vocal.

### C. Export destination
Per Job configuration now includes:
- `outputDirectory`;
- `outputFileName`;
- `exportQuality`.

The existing Electron directory picker selects the folder. Filename is sanitized to MP4. Default remains `<source-stem>_final.mp4`. Finalizer rejects a final path that would overwrite the source or P2 clean video.

### D. Real export quality
Presets:
- `balanced`: H.264 libx264, CRF 20, preset medium;
- `high`: H.264 libx264, CRF 18, preset slow — default;
- `very_high`: H.264 libx264, CRF 16, preset slow;
- `max`: H.264 libx264, CRF 14, preset slower.

Instead of broadening `api/server.py`, Rev4 uses a narrow Electron/preload FFmpeg bridge owned by P3 final assembly:
- new `src/main/p3-export-bridge.js`;
- `src/main/preload.js` exposes `burnP3SubtitleHq` and `retimeP3Video`;
- subtitle burn uses the selected real libx264 CRF/preset and preserves source resolution/FPS without resize;
- video tempo, when needed, uses the same selected quality;
- audio-only mix stages still copy video;
- final subtitle burn fails closed instead of reporting success when burn failed.

### E. Timing parity correction during PM review
The older render-controller timing bridge patched `api.burnSubtitlePositioned`. Rev4 final burn no longer calls that API, so PM review identified a potential regression: voice-retimed SRT could bypass ASS timing rebuild.

Finalizer now explicitly rebuilds derived ASS from the exact final SRT before the HQ burn. If timing changed, original karaoke preservation is disabled for that render to prevent subtitle drift.

## Actual Rev4 application-source scope
From `92deaf8fa72094fbad3f84c75c716967acbc509d`:
- new `src/main/p3-export-bridge.js`;
- `src/main/preload.js` — narrow bridge exposure;
- `src/renderer/js/pipeline1-run-config.js` — one import-only Rev4 bootstrap line;
- `src/renderer/js/pipeline3/editor-store.js`;
- new `src/renderer/js/pipeline3/runtime-fix-rev4.js`;
- `src/renderer/js/pipelines/pipeline3-finalize.js`.

No `api/server.py`, `src/renderer/js/api.js`, P1 execution, P2, TTS or dependency change in Rev4.

## Acceptance
1. At the Owner screenshot window size, inspector has no hidden horizontal clipping; every setting remains reachable without page-level horizontal scroll.
2. With Remove Vocal ON + background > 0, P3 never succeeds using a non-Demucs fallback.
3. Demucs success mixes the no-vocals bed and log identifies `method=demucs`.
4. Export lets Owner select folder and filename per Job.
5. Export offers four real H.264 quality presets and shows codec/CRF/preset/exact path.
6. Final burn and any required video retime honor selected CRF/preset.
7. Re-render starts from P2 clean video and writes to the currently selected destination.
8. Voice timing changes rebuild final ASS from final SRT.
9. Subtitle style engine, cover-band, cue edit and voice/video fit remain functional.

## Required exact-checkout verification
```text
node --check src/main/p3-export-bridge.js
node --check src/main/preload.js
node --check src/renderer/js/pipeline3/runtime-fix-rev4.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

PM sandbox attempted direct raw-download syntax verification, but outbound DNS to `raw.githubusercontent.com` is unavailable in this environment. This is not a code failure; exact-checkout static verification therefore remains WAITING for the existing Owner test directory.

## Owner runtime verification
- reuse only `E:\Project AI\Video-sub-remove-owner-test-LONG012` when clean;
- verify inspector at the same window size as the failing screenshot;
- choose a custom output folder + filename;
- render `high` or `very_high` and verify output path/log quality;
- with Remove Vocal ON and background > 0, confirm either Demucs succeeds and original vocal is materially removed, or render visibly blocks with a Demucs-required error;
- recheck subtitle preview/final timing and style.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: FAIL on tested pre-Rev4 build / WAITING for Rev4 re-verification.
- Documentation synchronization: PARTIAL until dynamic docs/PR sync.
- Merge: BLOCKED.
