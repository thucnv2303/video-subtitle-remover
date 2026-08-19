# Active PM Execution Spec

Status: WAN_ANIMATE_BENCHMARK_RTX5060TI_RUNTIME_WAITING

Task: `WAN-ANIMATE-BENCHMARK-037`
Repository: `thucnv2303/video-subtitle-remover`
Branch: `review/WAN-ANIMATE-BENCHMARK-037`
Base SHA: `1b1b8ba4b82078534b7fa24582be7e44688319bd`
Spec: `.ai/task_specs/WAN-ANIMATE-BENCHMARK-037.md`

## Active purpose
Benchmark Wan2.2-Animate-14B Character Replacement on RTX 5060 Ti 16GB using an isolated 3–5 second, 480p-first spike before any AI Video Remix UI work.

## Isolation
- Task 036 / PR #76 is out of scope and must remain untouched.
- No UI or application pipeline source changes.
- Owner runtime worktree: `E:\Project AI\Video-sub-remove-wan-benchmark`.
- Wan dependencies/runtime remain isolated from the app Python environment.

## Gates
Execution PASS for harness publication; automated verification WAITING; code review WAITING; Owner GPU runtime NOT STARTED; docs sync pending exact-head re-read; merge BLOCKED.

## Next action
Review the Draft PR and then run the real RTX 5060 Ti benchmark. Do not merge.
