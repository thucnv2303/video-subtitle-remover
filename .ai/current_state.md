# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — REJECTED / DROP / CLEANUP REQUIRED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Rejected experiment branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Rejected Draft PR: #76.
- Experiment base: `1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Drop-record branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036-DROP` created from the clean experiment base so rejected EchoMimic source is not promoted.

## Owner runtime result
Owner completed the final EchoMimicV3 49-frame block-offload benchmark on RTX 5060 Ti 16 GB. The 14.86 s / 372-frame input started at 15:37:21 and completed at 16:46:57, about 69m36s wall-clock. Eight inference chunks were required; full 49-frame chunks spent about 6m17s-6m21s in the 8-step denoise loop, plus phase/offload overhead. This exceeds the declared viability gate (>180 s = DROP) by a very large margin.

The generated video completed successfully, proving functional execution, but Owner judged the visual result not good enough. The experiment therefore fails both product-quality and performance viability for the target local machine.

## Decision
- EchoMimicV3 is rejected for this product path.
- Do not merge PR #76 or any EchoMimicV3 experiment commits into the product line.
- Do not spend further engineering time tuning block-offload/full-GPU/selective-GPU variants for task 036.
- Local EchoMimicV3 runtime/models/runs may be removed after confirming they are isolated under `C:\VSR-EchoMimicV3`.
- Existing unrelated shared model/cache directories must not be deleted as part of this cleanup.

## Gates
- Execution: PASS (end-to-end render completed).
- Automated/static verification: PASS for the tested experiment checkout before runtime.
- Code review: INVALIDATED for merge because the implementation is rejected on viability.
- Owner runtime: FAIL — performance and quality.
- Documentation synchronization: PASS on this drop-record branch after canonical files are updated.
- Merge permission: BLOCKED permanently for task 036 / PR #76.

## Next permitted action
Close PR #76 without merge, clean the isolated local EchoMimicV3 runtime, and return product authority to the pre-EchoMimic base / next explicitly approved avatar direction.