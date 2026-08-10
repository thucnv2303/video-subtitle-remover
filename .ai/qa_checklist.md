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
- [ ] Manual ROI display geometry matches the exact pixels dragged by Owner — FAIL / revision required.
- [ ] Each manual region can persist a different mask mode — FAIL / revision required.
- [ ] Visible P2 Console is compact during inpaint — FAIL / revision required.

## Required static verification for revision 002
- [ ] `node --check src/renderer/js/app.js`
- [ ] `node --check src/renderer/js/pipelines/pipeline2-remove.js`
- [ ] `node --check src/renderer/js/pipeline2-runtime.js`
- [ ] `git diff --check`
- [ ] Changed source limited to approved files.
- [ ] ROI coordinate simulation with a letterboxed portrait canvas maps pointer→source→overlay with <=1 CSS-pixel display error at tested edges/center.
- [ ] Two manual regions with different masks produce pass-specific `mask_mode` values.
- [ ] Legacy region object without `maskMode` falls back to job/default mask.
- [ ] Log filter suppresses successful `/api/frame/...` access lines during active P2 processing.
- [ ] Expected early active-job `/api/preview` 404 noise is hidden without hiding unexpected/fatal errors.
- [ ] Existing realtime `/api/preview` drawing path remains intact.
- [ ] Backend discovery code unchanged.
- [ ] `pipeline-state.js` / P1→P2 gate unchanged.
- [ ] P1/P3 source unchanged.
- [ ] GitHub CI/checks — none currently configured; local/static evidence must be published in PR.

## Fresh Owner runtime verification — BLOCKED UNTIL CODE REVIEW PASS
- [ ] Draw ROI around hard subtitles at center/bottom/side positions; overlay remains exactly under the drag rectangle.
- [ ] Change timeline/frame and resize the window; ROI stays aligned to the same video pixels.
- [ ] Create at least two regions and select different mask modes; selections remain independent.
- [ ] Run manual multi-pass and confirm each region uses its selected mask mode.
- [ ] Realtime result preview remains working.
- [ ] Console no longer floods `/api/frame` success lines or expected preview 404s.
- [ ] Fatal/backend errors remain visible.
- [ ] Processing performance is not materially regressed relative to the current working checkpoint.
- [ ] Clean-video output remains timeline compatible.
- [ ] P3 unlock remains success-only.

## Gate status
- Execution: NOT STARTED for revision 002.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: previous retest PARTIAL PASS / NEEDS_REVISION; fresh retest BLOCKED.
- Documentation synchronization: PASS at task-open checkpoint.
- Merge permission: BLOCKED.
