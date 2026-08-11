# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Source/scope
- [x] Dedicated review branch and Draft PR #44.
- [x] Latest source commit `542ccb44df047d001ebfcbe669ad223b7a5ef840`.
- [x] Latest delta limited to `src/renderer/js/pipeline1-run-ux.js` and `src/renderer/styles/pipeline1-run-ux.css`.
- [x] No P2/P3/STTN/Settings/backend source changes.

## Code review
- [x] Failed-card click handled before legacy card click via capture phase.
- [x] Failed card exposes visible `↻ Chạy lại` action.
- [x] Retry changes only failed Job to `queued` and resets retry/cancel state.
- [x] Existing active P1 Job is not cancelled or replaced by retry.
- [x] If `pipeline1JobId` exists, legacy `processPipeline1Queue()` returns; retried Job remains queued.
- [x] If no active Job exists, existing recovery path can start queued retry.
- [x] Prior freeze fix preserved: MutationObserver does not watch attributes.
- [x] Error popup still uses safe text-only content.

## Owner retest — REQUIRED
- [ ] Clicking failed Job body opens error popup.
- [ ] Popup displays captured error or clear fallback.
- [ ] `↻ Chạy lại` appears only for failed Job.
- [ ] Click `Chạy lại` changes failed Job to queued.
- [ ] With another Job processing, retried Job stays queued and active Job continues uninterrupted.
- [ ] After active Job completes/errors, queued retry starts automatically.
- [ ] With no active Job, retry starts normally.
- [ ] Add-video no longer freezes renderer.
- [ ] Processing glow/spinner still follows actual active Job.
- [ ] Stop/Cancel does not revive explicitly stopped Jobs.

## Gates
Execution PASS; code review PASS; Owner manual verification WAITING; merge BLOCKED; Step 3 BLOCKED.
