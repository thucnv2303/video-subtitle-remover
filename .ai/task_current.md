# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
REJECTED_DROP_CLEANUP_COMPLETE_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Experiment branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR #76: CLOSED / NOT MERGED.
- Clean experiment base: `1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Drop record: `review/TALKING-PORTRAIT-ECHOMIMICV3-036-DROP`.

## Owner outcome
Final 14.86 s benchmark rendered successfully but required about 69m36s wall-clock on RTX 5060 Ti 16 GB with block-offload V5/V5.1. Declared viability gate was <90 s good, 90-180 s marginal, >180 s DROP. Owner also reported the generated visual quality was not good enough.

## Cleanup result
Owner inspected `C:\VSR-EchoMimicV3` and confirmed only EchoMimic-specific runtime/model/run content was present. No process referenced that root. Owner executed recursive removal and `Test-Path "C:\VSR-EchoMimicV3"` returned `False`. Cleanup is therefore verified COMPLETE. Reported C: free space afterward: 148142972928 bytes (~138 GiB).

## Decision
Task 036 is terminated. No additional EchoMimicV3 optimization is authorized. PR #76 must remain closed and unmerged. No further cleanup outside the isolated EchoMimic root is authorized under this task.

## Gates
- Execution: PASS.
- Automated/static: PASS for tested experiment.
- Code review: INVALIDATED for merge.
- Owner runtime: FAIL.
- Local cleanup: PASS.
- Documentation sync: PASS after current_state/task_current/handoff are consistent on the drop-record branch.
- Merge: BLOCKED permanently.

## Next action
Task 036 requires no further implementation or runtime action. Any replacement talking-portrait engine must use a new task and pass a short viability benchmark before integration.