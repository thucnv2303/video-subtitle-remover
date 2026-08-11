# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Source/integration verification
- [x] Dedicated branch and Draft PR #44.
- [x] Latest reviewed source `fc807c9daa38df62fb885f2c4ff7db4fde4623f3`.
- [x] Processing whole-card pulse removed; spinner animation remains.
- [x] `pipeline1-run-ux.js` is loaded from real boot path through preload.
- [x] Popup/error interaction uses canonical/effective P1 state.
- [x] Popup has stable `↻ Chạy lại` action and text-only error detail.
- [x] Queue failure isolation preserved.
- [x] Reasoning output uses concise schema instructions and transcript-sensitive token budget.
- [x] Truncation is explicitly detected instead of falling through only as generic JSON syntax failure.
- [x] At most one reasoning-only repair is allowed for malformed/truncated output.
- [x] Duplicate renderer-level full multimodal retry removed.
- [x] Reasoning timeout remains finite at 360 seconds.
- [x] OmniVoice idle release is debounced; adjacent clone segments can reuse model while idle burst releases cached model/CUDA cache.
- [x] Observer remains childList/subtree only; no attribute feedback-loop restoration.
- [x] PM code review PASS `4902998957`.
- [x] No unresolved inline PR review threads.
- [ ] GitHub CI/status checks — none configured.
- [ ] Executed JS/Python static syntax suite for this exact revision — PM environment evidence not yet available; do not claim PASS.

## Owner evidence already PASS
- [x] Multi-job failure isolation: failed Job did not block next Job.
- [x] Failed Job remains visibly `Lỗi`.
- [x] Clicking failed Job can open popup.

## Fresh Owner retest — REQUIRED
- [ ] Adding/loading video remains stable; no renderer freeze.
- [ ] Processing card/badge stays visually steady.
- [ ] Only the processing spinner rotates.
- [ ] Exact popup error detail remains readable.
- [ ] Popup `↻ Chạy lại` is usable.
- [ ] Retry while another Job is processing becomes queued; active Job continues uninterrupted.
- [ ] Retried Job starts after current Job completes/errors.
- [ ] Retry while idle starts normally.
- [ ] Clone-TTS Job logs `[TTS] OmniVoice released after idle TTS burst.` after its final TTS segment/burst.
- [ ] Running `test3.mp4` after that clone-TTS Job no longer remains near the 360s reasoning timeout under the same conditions.
- [ ] If qwen output is truncated/malformed, log shows at most one `Reasoning/remix retry`; vision analysis is not repeated only for JSON repair.
- [ ] If reasoning cannot finish, failure occurs at finite timeout with explicit phase/model detail and popup remains usable.
- [ ] Stop/Cancel does not revive explicitly stopped Jobs.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner manual PARTIAL PASS / RETEST READY; documentation sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.
