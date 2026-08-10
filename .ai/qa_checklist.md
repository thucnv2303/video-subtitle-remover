# QA Checklist

## Active task
`PIPELINE2-MANUAL-REGION-REVISION-002`

## Previous Owner runtime baseline
- [x] Backend/STTN processing runs.
- [x] Realtime result preview works.
- [x] Clean-video output is generated.
- [x] P3 unlock occurs after successful P2 completion.
- [ ] Manual ROI alignment — previous Owner run FAIL; revision published, fresh detailed itemization not yet recorded.
- [ ] Per-region mask independence — previous Owner run FAIL; revision published, fresh detailed itemization not yet recorded.
- [ ] Compact P2 Console — previous Owner run FAIL; revision published, fresh detailed itemization not yet recorded.

## Source/scope verification
- [x] Dedicated review branch from exact parent `39c2ac7254977c44d2cedb79cabd914fe124c3a7`.
- [x] Draft PR #43 targets `review/PIPELINE2-APPROVED-UI-001`.
- [x] Final application-source scope is only `src/renderer/js/pipeline2-runtime.js` and `src/renderer/js/pipelines/pipeline2-remove.js`.
- [x] Backend/P1/P3/Settings/dependencies/pipeline-state unchanged.
- [x] Current source commit: `0e20fc0c6300240276da8e4bef16f67186a08889`.

## Automated/static evidence
- [x] Exact published runtime blob `f2b39abb2a948eb14e21665f6e0f234a1bef6ae1` matches locally tested hash; `node --check` PASS.
- [x] Exact published `pipeline2-remove.js` blob `67340ba29825ced3b4e5e5c583b591cba0ed2510` matches locally tested hash; `node --check` PASS.
- [x] Exact unchanged `src/renderer/js/app.js` blob `99c2cafa509ba2038b98f135156b34271da58c70` reconstructed byte-identical; `node --check` PASS.
- [x] Exact changed-file parent→current reconstruction: `git diff --check` PASS.
- [x] ROI portrait-letterbox simulation <=1 CSS px; latest max error 0.25 px.
- [x] Two-region masks remain independent: `box`, `tight`.
- [x] Legacy region missing `maskMode` falls back to job mask `soft` in simulation.
- [x] `/api/frame/...` 200 and expected active `/api/preview` 404 are filtered.
- [x] `/api/preview` 500 and completion remain visible.
- [x] Realtime preview path remains present.
- [ ] GitHub CI/checks — none configured.

## Controlled publication incident
- [x] Accidental probe commit recorded: `78252c198e6790722e92877c17bfee62312877a0`.
- [x] Probe removed normally in `cec184210ab9a622c5c62163712ff0f44a9ffe5c`; no force/history rewrite.
- [x] Compare `d84d809...` → `cec1842...` shows zero final file differences.
- [x] Final PR changed-file set contains no probe file.

## Fresh Owner runtime verification — PARTIAL PASS
Owner report received 2026-08-10:
- [x] One Pipeline 2 job completed successfully.
- [x] Owner reports the observed single-job behavior was generally correct and no new defect was reported.
- [ ] Multi-job/batch execution — NOT TESTED.

Detailed items below were not individually enumerated in the Owner report, so they are not silently converted to PASS:
- [ ] Draw ROI at center/bottom/side positions; overlay remains under exact drag rectangle.
- [ ] Resize/change frame; ROI stays aligned to the same video pixels.
- [ ] Create at least two regions with different masks; selections remain independent.
- [ ] Run manual multi-pass and verify each region uses its selected mask.
- [ ] Realtime preview remains working in a multi-job/batch regression.
- [ ] Console no longer floods frame success/expected preview-404 lines under multi-job/batch load.
- [ ] Fatal/backend errors remain visible.
- [ ] Performance does not materially regress under multi-job/batch execution.
- [ ] Clean-video timeline compatibility remains intact across multiple jobs.
- [ ] P3 unlock remains success-only across multiple jobs.

## Gates
- Execution: PASS.
- Automated verification: PASS.
- Code review: PASS.
- Owner manual app verification: PARTIAL PASS — SINGLE-JOB PASS; MULTI-JOB NOT TESTED.
- Documentation synchronization: PASS for current Owner-result intake.
- Merge permission: BLOCKED.
