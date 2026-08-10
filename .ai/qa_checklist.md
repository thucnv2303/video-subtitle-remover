# QA Checklist

## Active task
`PIPELINE2-MANUAL-REGION-REVISION-002`

## Previous runtime retest intake — 2026-08-10
- [x] P2 backend no longer remains stuck at 0% with `backend not available`.
- [x] Realtime result preview works by Owner observation.
- [x] Supplied runtime log reaches 440/440 frames.
- [x] Supplied runtime log reports about 38 seconds and 11.38 frame/s for the captured STTN run.
- [x] Runtime reports STTN GPU mode.
- [x] Clean-video output is written.
- [x] Matching P3 job unlocks only after successful P2 completion in the captured run.
- [ ] Manual ROI display geometry matches exact pixels dragged — previous Owner run FAIL; revision 002 published, fresh retest pending.
- [ ] Each manual region persists a different mask mode — previous Owner run FAIL; revision 002 published, fresh retest pending.
- [ ] Visible P2 Console is compact during inpaint — previous Owner run FAIL; revision 002 published, fresh retest pending.

## Revision 002 GitHub/source scope
- [x] Dedicated branch `review/PIPELINE2-MANUAL-REGION-REVISION-002` created from exact parent `39c2ac7254977c44d2cedb79cabd914fe124c3a7`.
- [x] Draft PR #43 targets `review/PIPELINE2-APPROVED-UI-001`.
- [x] GitHub compare parent → source checkpoint `f73c1f13d28d5d1222998399c4e0c20ac00ae815` contains exactly two source files.
- [x] Backend discovery code unchanged.
- [x] `pipeline-state.js` / P1→P2 gate unchanged.
- [x] P1/P3/Settings/dependency source unchanged.
- [x] Existing realtime `/api/preview` drawing path retained in final runtime enhancer.

## Deterministic verification
- [x] Letterboxed portrait ROI coordinate simulation maps pointer→source→rendered position with <=1 CSS-pixel tested error; maximum observed 0.125 px.
- [x] Two manual regions resolve independent masks `box` and `tight`.
- [x] Legacy region without `maskMode` falls back to job mask (`soft` in simulation).
- [x] `/api/frame/...` 200 access line classifies as hidden during active P2.
- [x] Expected early `/api/preview` 404 classifies as hidden.
- [x] `/api/preview` 500 remains visible.
- [x] Completion line remains visible.

## Static checks still waiting
- [ ] Exact published-blob `node --check src/renderer/js/pipeline2-runtime.js` — current ChatGPT container cannot fetch GitHub bytes because outbound DNS to GitHub is unavailable.
- [ ] Exact published-blob `node --check src/renderer/js/pipelines/pipeline2-remove.js` — same environment limitation.
- [ ] `node --check src/renderer/js/app.js` on exact parent/current blob — source is unchanged by revision 002; no independent local checkout available in this environment.
- [ ] `git diff --check` — no local Git checkout of this remote branch in the current environment.
- [ ] GitHub CI/checks — none configured.

## Fresh Owner runtime verification
- [ ] Draw ROI around hard subtitles at center/bottom/side positions; overlay remains exactly under drag rectangle.
- [ ] Change timeline/frame and resize window; ROI stays aligned to same video pixels.
- [ ] Create at least two regions and select different mask modes; selections remain independent.
- [ ] Run manual multi-pass and confirm each region uses selected mask mode.
- [ ] Realtime result preview remains working.
- [ ] Console no longer floods `/api/frame` success lines or expected preview 404s.
- [ ] Fatal/backend errors remain visible.
- [ ] Processing performance is not materially regressed relative to current working checkpoint.
- [ ] Clean-video output remains timeline compatible.
- [ ] P3 unlock remains success-only.

## Gate status
- Execution: PASS for direct-PM source publication.
- Automated/static verification: PARTIAL PASS / WAITING exact syntax + diff check; no CI configured.
- Code review: IN PROGRESS.
- Owner manual app verification: previous retest PARTIAL PASS / NEEDS_REVISION; fresh retest NOT STARTED.
- Documentation synchronization: PASS at source-publication checkpoint.
- Merge permission: BLOCKED.
