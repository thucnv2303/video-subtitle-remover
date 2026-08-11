# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Source/integration verification
- [x] Dedicated branch and Draft PR #44.
- [x] Latest reviewed source `ecf2a10f7e29cbb2bc2f2c67e51df394c7de22d2`.
- [x] Latest incremental fix limited to `src/renderer/js/pipeline1-run-ux.js`.
- [x] `pipeline1-run-ux.js` is loaded from real boot path through preload.
- [x] run-UX binds actual generated Job status DOM.
- [x] Direct inspection confirms `pipeline-state.js` maps P1 error to `p1Status=error` while legacy `status=idle`.
- [x] Popup/retry now use canonical/effective P1 state.
- [x] Retry control is outside status chip, so pipeline-state chip text sync does not delete it.
- [x] Retry writes both canonical/legacy queued state and does not preempt active Job.
- [x] Observer remains childList/subtree only; no attribute feedback-loop restoration.
- [x] Error dialog remains text-only.
- [x] PM code review PASS `4902799500`.
- [ ] GitHub CI/status checks — none configured.

## Owner retest — REQUIRED
- [ ] Adding video does not freeze renderer.
- [ ] Processing Job receives visible feedback.
- [ ] Failed Job remains visibly `Lỗi`.
- [ ] Clicking failed Job body opens error popup.
- [ ] Popup displays captured error or clear fallback.
- [ ] `↻ Chạy lại` remains visible beside failed status.
- [ ] Retry while another Job is processing becomes queued and active Job continues uninterrupted.
- [ ] Retried Job starts after current Job completes/errors.
- [ ] Retry while idle starts normally.
- [ ] Stop/Cancel does not revive explicitly stopped Jobs.

## Controlled PM metadata incident
- [x] Accidental PR-body `noop` overwrite restored immediately; source/refs/history unaffected.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner manual verification WAITING; documentation sync PASS; merge BLOCKED; Step 3 BLOCKED.
