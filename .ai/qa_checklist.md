# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Source/integration verification
- [x] Dedicated branch and Draft PR #44.
- [x] Latest reviewed source `4f8b6737337abf488e49c58853b5ad3715fdeb7d`.
- [x] Latest Owner-tested head `5bfe88fa...` recorded.
- [x] Incremental compare from Owner-tested head is limited to active task spec + P1 vision IPC + preload + spinner phase adapter + P1 run-UX CSS.
- [x] Vision output budget is bounded by keyframe count; 8 keyframes => 2000 tokens, maximum 2200.
- [x] Vision prompt requests concise schema-complete output.
- [x] IPC error normalization avoids embedding phase/model twice in returned error text.
- [x] Spinner phase adapter changes only presentation state and does not mutate Job state.
- [x] Spinner phase is applied to canonical `status-processing` nodes and consumed through CSS negative animation delay.
- [x] Spinner adapter is loaded from real preload boot path.
- [x] Prior Electron file-path compatibility remains present.
- [x] Prior OmniVoice idle release remains present.
- [x] PM incremental source review PASS `4903882317`.
- [x] No unresolved inline PR review threads.
- [ ] GitHub CI/status checks — none configured.
- [ ] Exact final-revision executable JS/Python/static suite — PM runtime evidence unavailable; automated/static remains PARTIAL.

## Owner evidence already PASS
- [x] Multi-job failure isolation.
- [x] Failed Job popup opens.
- [x] Absolute path resolution: latest run reads `F:\test3.mp4`; metadata/frames/ASR succeed.
- [x] First Job completes vision + qwen reasoning + TTS in latest sequence.
- [x] OmniVoice release log appears after clone-TTS burst.

## Fresh Owner retest — BLOCKING
- [ ] Processing card stays steady.
- [ ] Spinner rotation is visually continuous with no periodic restart/jump while Job UI updates.
- [ ] For the same 8-keyframe `test3.mp4`, vision log reports `output_limit=2000 token`.
- [ ] `test3.mp4` progresses past the prior fixed-1200 vision truncation point.
- [ ] If vision still fails, failure is bounded/explicit and does not retry indefinitely.
- [ ] Error popup displays phase/model once, not duplicated.
- [ ] After vision succeeds, `test3.mp4` reaches qwen reasoning.
- [ ] qwen reasoning completes or fails within the existing finite timeout with readable exact detail.
- [ ] Popup `↻ Chạy lại` remains usable.
- [ ] Retry while another Job is active remains queued and non-preemptive.
- [ ] Stop/Cancel does not revive explicitly stopped Jobs.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner PARTIAL PASS / RETEST REQUIRED; documentation sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.
