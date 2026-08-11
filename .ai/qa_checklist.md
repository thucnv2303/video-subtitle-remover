# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Source/scope
- [x] Dedicated review branch and Draft PR #44.
- [x] Latest source commit `eb9eaf11e0a2c7b1b66c779dd5e55fc74d902fcf`.
- [x] New runtime-wiring source change limited to `src/main/preload.js` and `src/renderer/js/pipeline1-run-ux.js`.
- [x] No P2/P3/STTN/Settings/backend algorithm changes.

## Integration checks
- [x] Prior revision invalidated because `pipeline1-run-ux.js` was not loaded by the app.
- [x] Preload now injects `js/pipeline1-run-ux.js` on DOMContentLoaded.
- [x] Prior `.p1-job-state` selector did not exist in real Job markup.
- [x] run-UX now targets `.tk-job-card-header > div > span` and assigns `.p1-job-state`.
- [x] Observer fix remains childList/subtree only.
- [x] Failed-card click handler still uses capture phase.
- [x] Failed Job retry still transitions only that Job to queued.
- [x] Active Job is not cancelled/replaced by retry.

## Final review — REQUIRED BEFORE OWNER RETEST
- [ ] Exact current preload/run-UX syntax/static verification.
- [ ] Final GitHub diff/scope review.
- [ ] Confirm PR head and canonical docs are synchronized.

## Owner retest — BLOCKED UNTIL FINAL REVIEW PASS
- [ ] Adding video does not freeze renderer.
- [ ] Processing Job receives glow/spinner.
- [ ] Clicking failed Job body opens error popup.
- [ ] Popup displays captured error or clear fallback.
- [ ] `↻ Chạy lại` appears on failed Job.
- [ ] Retry while another Job is processing stays queued.
- [ ] Retry starts after current Job ends.
- [ ] Retry while idle starts normally.
- [ ] Stop/Cancel does not revive explicitly stopped Jobs.

## Gates
Execution PASS; automated/static WAITING; code review WAITING; Owner FAIL on prior head / RETEST BLOCKED; documentation sync PASS for current intake; merge BLOCKED; Step 3 BLOCKED.
