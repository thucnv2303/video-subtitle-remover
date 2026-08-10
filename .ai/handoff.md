# AgentOS Handoff Status

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
- Canonical task base: `dd520054b385ae18b8154b7c897eb9baad7eac02`.

## Active task
`BUG-005 — Pipeline 1 Full Processing Chain`

## Status
OWNER_RUNTIME_FAIL / NEEDS_REVISION — OLLAMA MULTIMODAL TIMEOUT

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Latest Owner runtime evidence
Owner tested multimodal head `6ce8d3e9eef3170b3639c42c95c59f51356b8efe`.

Runtime reached:
- P1 config snapshot with ASR auto, Ollama `qwen3-coder:30b`, clone voice;
- ASR success;
- 8 keyframes fetched from the 17.6s original video;
- multimodal Stage C start.

Runtime then failed after several minutes with `Ollama quá thời gian phản hồi khi phân tích video.` No required multimodal artifacts/TTS success/P2 unlock acceptance was demonstrated.

## Direct source findings
- Ollama multimodal inference is invoked from Electron main through `net.fetch`; it does not travel through Python `/api/...`, so absence of Python Ollama log lines is expected for the current design.
- The IPC inspects selected-model capabilities, then may choose a separate installed vision model.
- Each `/api/chat` phase uses a fixed 180-second timeout.
- Fallback can involve two sequential model phases: vision model then selected reasoning model.
- Current UI/logging does not reveal capability results, chosen vision model, running model, model load, prompt evaluation, generation progress or per-phase timing.
- Keyframe images are sent as base64 without a dedicated downscale/compression budget.
- Therefore the timeout is proven; actual GPU execution/model residency is not directly proven by current telemetry.

## Separate observation
Python startup logs `Warning: Could not import backend: No module named 'backend'`. Health/video-info/frame/ASR/TTS endpoints used in this test still responded, but this warning is a separate backend packaging/import risk and is not the source of the Electron Ollama timeout.

## Next permitted action
Revise BUG-005 only:
- add Ollama reachability/capability/model-selection/running-model telemetry;
- identify model + phase in timeout/error messages;
- resize/compress keyframes before vision inference;
- use explicit resource-safe keep-alive/unload lifecycle for sequential vision/reasoning models;
- keep P1 fail-closed and P2 locked on incomplete analysis;
- do not merely increase timeout.

Owner retest is NOT AUTHORIZED until revised source passes review.

## Gates
- Execution: NEEDS_REVISION.
- Automated/static verification: WAITING for revised candidate.
- Code review: INVALIDATED / NEEDS_REVISION.
- Owner manual app verification: FAIL.
- Documentation synchronization: PASS for latest failure recording.
- Merge permission: BLOCKED.
