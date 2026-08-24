# TALKING-PORTRAIT-ECHOMIMICV3-036 — V5.3 Persistent Worker

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`
- Draft PR: #76
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`
- Starting HEAD for this spec publication: `886dac39fda843d38863af2618c7631712c6503a`
- Upstream EchoMimicV3 pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`
- Runtime: `C:\VSR-EchoMimicV3`

## User-facing goal
Reduce repeated per-render startup cost by keeping EchoMimicV3/MMGP model state alive across sequential render jobs in one app session. Do not change visual-quality settings in this task.

## Verified problem
V5.2.5 controlled benchmark is stable at 49 frames, 768x768, 25 FPS, Flash 8-step, TeaCache, MMGP LowRAM_HighVRAM 90%:
- first chunk `pipeline_seconds=186.672`
- `peak_cuda_gb=10.930`
- VAE decode `10.856s`
- GPU->CPU frames `0.082s`
- no OOM/exception

But each Electron render currently launches a fresh `infer_flash.py` Python process, so model load/MMGP setup/transformer quantization repeats every render. Owner evidence measured about 248 seconds from render request to `pipeline_start` on the V5.2.5 run.

## Scope
Implement only a controlled V5.3 persistent-worker benchmark path.

### Required architecture
1. One long-lived Python worker process per Electron app/runtime session.
2. Worker initializes heavy EchoMimic state once: Wav2Vec, Wan pipeline, Flash transformer, VAE/T5/CLIP, MMGP profile/quantization/hooks, TeaCache-compatible pipeline state.
3. Worker accepts sequential jobs over a minimal local IPC protocol. JSON Lines over stdin/stdout is preferred unless existing repo conventions provide a safer simpler equivalent.
4. One job at a time. No parallel generation.
5. Worker must emit explicit machine-readable/log markers for:
   - boot start
   - model init start/end
   - worker READY
   - job received with job id
   - cold/warm classification
   - pipeline start/end
   - pipeline_seconds
   - peak CUDA
   - job complete/fail
   - worker shutdown/restart
6. First V5.3 experiment remains a 49-frame controlled benchmark. It does not need to produce the final 14.86s long-audio MP4 yet if doing so would expand scope. The goal is proving warm model reuse and obtaining warm first-chunk timing.
7. Second sequential job in the same worker lifetime must not repeat full model-load/MMGP quantization markers.
8. Preserve cancellation semantics. For this experiment it is acceptable for Cancel to kill the whole worker and require a clean worker restart, provided the Electron busy state clears deterministically and no stale pending promise remains.
9. Worker crash/failure must reject the active job and reset engine state. Do not silently fall back to the old fresh-process-per-render path during V5.3 benchmark because that invalidates the experiment.

## Benchmark settings — MUST NOT CHANGE
- 768x768
- 25 FPS
- 49 frames
- Flash 8-step
- TeaCache enabled
- teacache threshold 0.1
- skip first 5 steps
- MMGP LowRAM_HighVRAM
- 90% detected VRAM budget
- guidance/audio settings currently used by `src/main/echomimicv3-engine.js`
- seed 43
- bfloat16

## Files to read first
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/task_specs/TALKING-PORTRAIT-ECHOMIMICV3-036-V53.md`
- `src/main/echomimicv3-engine.js`
- `scripts/echomimicv3-runtime-transform.py`
- `scripts/echomimicv3-mmgp-v52.py`
- `scripts/echomimicv3-mmgp-v521*`
- `scripts/echomimicv3-mmgp-v522*`
- `scripts/echomimicv3-mmgp-v523*`
- `scripts/echomimicv3-mmgp-v524*`
- `scripts/echomimicv3-mmgp-v525*`
- runtime upstream files under `C:\VSR-EchoMimicV3\repo` needed to understand initialization and one-chunk inference

## Allowed source scope
- `src/main/echomimicv3-engine.js`
- new narrow EchoMimic worker/runtime scripts under `scripts/`
- a narrow upgrader/bootstrap script under `scripts/` if needed
- `.ai/` only after implementation, in a separate docs/state commit

## Forbidden scope
- No changes to P1/P2/P3.
- No changes to Voice Render, standalone Xoa Sub, task 034, JoyVASA.
- No UI redesign.
- No dependency churn unrelated to persistent worker.
- No FlashAttention install/build in this task.
- No change to benchmark quality/settings listed above.
- No reverting to V5.1 custom block streaming.
- No merge.
- No direct push to main/dev/canonical base branches.
- Do not use `git reset`, `git clean`, force push, destructive restore, wildcard deletion, `git add .`, or `git add -A` on a dirty tree.
- Preserve unrelated local changes. If safe isolation is impossible, STOP with `BLOCKED`.

## Implementation requirements
1. Fetch remote and confirm exact branch/head before editing.
2. Inspect runtime initialization symbols directly; do not duplicate or guess model construction if reusable functions/classes already exist.
3. Keep model initialization outside per-job handler.
4. Keep job-specific image/audio preprocessing inside job handler.
5. Make protocol parsing robust to malformed/partial lines; one malformed message must return a job-level error or controlled worker error, not corrupt state silently.
6. Every job result must be correlated by job id.
7. Electron must maintain exactly one pending active job and one worker lifecycle state.
8. Worker stderr/stdout handling must not let normal progress text break the JSON control channel. If JSON Lines uses stdout, progress should use a clearly prefixed protocol or stderr; otherwise use dedicated parsing with unambiguous prefixes.
9. On worker exit, active job promise must resolve/reject exactly once and engine state must return to not-running.
10. `status()` should expose worker state truthfully: not-installed/not-ready/booting/ready/busy as feasible without breaking existing callers.
11. Cancel must not claim success unless termination was actually accepted. After cancellation, subsequent render must be able to start a new worker cleanly.
12. Add static verification that checks worker protocol/lifecycle invariants where practical without requiring GPU.

## Acceptance criteria
### Static/source
- Node syntax PASS for changed JS.
- Python syntax PASS for new/changed Python.
- PowerShell parser/run PASS for upgrader if added.
- `git diff --check` PASS against the task starting commit/spec commit.
- Source review shows no fresh Python inference process spawned for each warm job.

### Runtime
Owner will later verify:
1. Start app and first V5.3 render.
2. Worker initializes once and emits READY.
3. First job runs controlled 49-frame benchmark and reports timing/peak.
4. Submit second job in same app session.
5. Second job is explicitly marked warm.
6. Second job does not repeat full model load/MMGP quantization markers.
7. Second job reports warm `pipeline_seconds` and peak CUDA without OOM/exception.
8. Cancel/restart path works or, if not owner-tested yet, remains WAITING and is not claimed PASS.

## Commit/publication rules
- Application/source/runtime implementation in one source commit.
- `.ai/` state/docs in a separate commit after source publication.
- Push only `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Update existing Draft PR #76; do not open a new PR.
- Do not merge.

## Required executor report
Use exactly:

```text
STATUS: IMPLEMENTATION_COMPLETE/WAITING_EVIDENCE/BLOCKED/IMPLEMENTATION_FAILED
Repository: thucnv2303/video-subtitle-remover
Branch: review/TALKING-PORTRAIT-ECHOMIMICV3-036
Base: review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd
Starting HEAD:
HEAD SHA:
PR: #76
Files read:
Changed files:
Implementation summary:
Worker lifecycle:
IPC protocol:
Cancellation/restart behavior:
Tests with commands and output summary:
Manual verification:
Acceptance criteria with evidence:
Risks:
Blockers:
NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
```

Executor must not use supervisor statuses PASS/NEEDS_REVISION/WAITING/MERGED and must not self-approve.