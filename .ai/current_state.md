# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — REJECTED / DROP / LOCAL CLEANUP COMPLETE / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Rejected experiment branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Rejected Draft PR: #76, CLOSED / NOT MERGED.
- Experiment base: `1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Drop-record branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036-DROP` created from the clean experiment base so rejected EchoMimic source is not promoted.

## Owner runtime result
Owner completed the final EchoMimicV3 49-frame block-offload benchmark on RTX 5060 Ti 16 GB. The 14.86 s / 372-frame input started at 15:37:21 and completed at 16:46:57, about 69m36s wall-clock. Eight inference chunks were required; full 49-frame chunks spent about 6m17s-6m21s in the 8-step denoise loop, plus phase/offload overhead. This exceeds the declared viability gate (>180 s = DROP) by a very large margin.

The generated video completed successfully, proving functional execution, but Owner judged the visual result not good enough. The experiment therefore fails both product-quality and performance viability for the target local machine.

## Local cleanup verified
Owner verified the isolated runtime root contained only EchoMimicV3-specific directories/files (`flash`, `repo`, `runs`, `venv`, `cuda-smoke.py`, `download-assets.py`). Process inspection returned no process whose executable or command line referenced `C:\VSR-EchoMimicV3`.

Owner then removed `C:\VSR-EchoMimicV3` recursively and verified `Test-Path "C:\VSR-EchoMimicV3"` returned `False`. Post-cleanup drive C free space was reported as 148142972928 bytes (~138 GiB). No shared Hugging Face/Torch cache or unrelated model directory was deleted.

## Decision
- EchoMimicV3 is rejected for this product path.
- PR #76 is closed and must remain unmerged.
- Do not spend further engineering time tuning block-offload/full-GPU/selective-GPU variants for task 036.
- Local EchoMimicV3 runtime/models/runs cleanup is COMPLETE.
- Any replacement avatar engine must start as a new task with a strict short viability benchmark before full integration.

## Gates
- Execution: PASS (end-to-end render completed).
- Automated/static verification: PASS for the tested experiment checkout before runtime.
- Code review: INVALIDATED for merge because the implementation is rejected on viability.
- Owner runtime: FAIL — performance and quality.
- Local cleanup: PASS.
- Documentation synchronization: PASS on this drop-record branch after this update.
- Merge permission: BLOCKED permanently for task 036 / PR #76.

## Next permitted action
Return product authority to the pre-EchoMimic base / next explicitly approved avatar direction. Do not reopen or merge PR #76.