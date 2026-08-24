# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
V5.3 PERSISTENT WORKER SOURCE PUBLISHED / STATIC REVIEW PASS / OWNER TWO-JOB RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- V5.3 source commit: `c396b1799d669e44b86770ceeab37d51aa2f1d59`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified checkpoint
- V5.2.5 first 49-frame chunk: `pipeline_seconds=186.672`, `peak_cuda_gb=10.930`, no OOM/exception.
- Previous architecture paid ~248 s cold startup before pipeline inference on each render.
- V5.3 replaces per-render Python inference spawn with one long-lived worker.
- Worker initializes heavy EchoMimic/MMGP state once, then accepts sequential correlated jobs.
- Worker emits `VSR_WORKER_V53` markers for boot, model init, READY, cold/warm job classification, pipeline timing/peak, completion/failure and shutdown.
- Cancellation intentionally kills the whole worker; next render must restart it cleanly.
- Source commit was published and re-read from GitHub; PR #76 head matched it before docs synchronization.
- Local pre-publication syntax checks for Python and Node passed. No GitHub commit status checks exist for the source commit.

## Owner runtime sequence
1. Update the existing Owner worktree to the exact latest PR #76 head.
2. Start the app normally and open AI Avatar.
3. Keep `Chất lượng cao` selected and use the same portrait/voice/settings for both runs.
4. Click `Tạo video` once and wait for the first controlled V5.3 benchmark to finish.
5. Do not close/restart the app. Click `Tạo video` a second time with the same inputs.
6. Copy the complete Render log after job 2 and return it to Project Control.
7. Do not test quality changes yet.

## Evidence required
The log must show:
- exactly one `VSR_WORKER_V53: boot_start` and model-init sequence before both jobs;
- one `VSR_WORKER_V53: READY`;
- first job `warm=false`;
- second job `warm=true`;
- no repeated model-init/MMGP setup before job 2;
- `pipeline_done` with `pipeline_seconds` and `peak_cuda_gb` for each job;
- no OOM/exception.
Cancellation/restart evidence remains a separate runtime gate after warm reuse is proven.

## Gates
- V5.3 source publication: PASS.
- Automated/static syntax: PASS locally before publication; GitHub CI absent.
- Code review: PASS for current source architecture.
- Owner two-job warm reuse: WAITING.
- Owner cancellation/restart: WAITING.
- Documentation synchronization: PASS after this docs commit.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034 or JoyVASA changes.
- No quality/resolution/FPS/step changes during V5.3 benchmark.
- No arbitrary FlashAttention install/build.
- No app restart between job 1 and job 2 because that invalidates warm-worker evidence.
