# QA Checklist

## Active task
`PIPELINE2-APPROVED-UI-001`

## Static / GitHub review
- [x] Draft PR #42 exists on `review/PIPELINE2-APPROVED-UI-001`.
- [x] Base is the preserved P1 checkpoint branch `review/BUG-005-P1-FULL-CHAIN` at `97d5a13e77b6919931c251c74fab4c191fa04cec`.
- [x] Application-source diff limited to `src/renderer/js/pipeline.js` and `src/renderer/styles/pipeline2-approved.css`.
- [x] No `app.js`, `pipeline-state.js`, API/backend, P1 engine, P3, Settings or dependency source change in PR #42.
- [x] Direct P2 upload/drop UI remains hidden/blocked.
- [x] Existing P1→P2 eligibility gate remains unchanged and authoritative.
- [x] P2 start contract keeps ASR/AI/TTS disabled.
- [x] Job Queue uses internal vertical scrolling.
- [x] Actions panel is structurally separate from Job Queue rows.
- [x] Console/Log uses internal scrolling.
- [x] Unsupported P2-only delete-selected action is disabled rather than fake-functional.
- [x] Responsive CSS includes a stacked layout at narrower widths.
- [x] Isolated new P2 adapter block parses with `node --check`.
- [ ] Exact full published `src/renderer/js/pipeline.js` blob independently syntax-checked in this review environment.
- [ ] GitHub CI/checks PASS — no CI/checks are configured for this head.

## Owner runtime verification — AUTHORIZED / NOT STARTED
- [ ] P2 visual parity with Owner-approved demo and accepted P1 visual tone.
- [ ] Empty eligible queue state.
- [ ] One eligible job state.
- [ ] 10+ eligible jobs with internal queue scroll and Actions remaining visible.
- [ ] Selecting a job updates metadata and original/result preview panes correctly.
- [ ] No direct file upload/drop path in P2.
- [ ] Only jobs unlocked by successful P1 completion appear in P2.
- [ ] Start executes subtitle-removal-only Pipeline 2.
- [ ] Result preview is not faked before real output exists.
- [ ] Responsive/fullscreen layout fits without bottom controls being obscured.
- [ ] Console is readable and scrolls internally.
- [ ] Hard-subtitle removal still produces timeline-compatible clean video.
- [ ] P2 completion unlocks matching P3 job.

## Gate status
- Execution: PASS.
- Automated/static verification: WAITING for complete exact-blob/runtime evidence; isolated adapter syntax PASS.
- Code review: PASS for Owner runtime verification.
- Owner manual app verification: AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS at current checkpoint.
- Merge permission: BLOCKED.
