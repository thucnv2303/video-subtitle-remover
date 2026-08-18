# TALKING-PORTRAIT-ECHOMIMICV3-036

Status: OWNER_RUNTIME_WAITING

## Goal
Upgrade AI Avatar quality beyond JoyVASA by adding EchoMimicV3 Flash as the Quality renderer while preserving JoyVASA as Fast/Preview.

## Product contract
- Input remains one portrait image + one voice file; Vietnamese voice requires no transcript.
- `quality=preview` uses existing JoyVASA path.
- `quality=quality` dispatches to EchoMimicV3 Flash.
- EchoMimicV3 runtime is isolated at `C:\VSR-EchoMimicV3`; it must not mutate the JoyVASA runtime.
- Upstream EchoMimicV3 is pinned to `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Flash test profile follows upstream: 8 inference steps, 768x768, 25 FPS, TeaCache; audio CFG is set to 2.0 for the first owner quality benchmark.
- No changes to P1/P2/P3, Voice Render, standalone Xoa Sub, or export task 034.

## Owner acceptance
1. Setup completes with `[EchoMimicV3] READY` and CUDA available on the RTX 5060 Ti.
2. App Quality render invokes EchoMimicV3 rather than JoyVASA.
3. Same portrait + Vietnamese voice produces an MP4.
4. Compare against the JoyVASA baseline for mouth sync, blinking/eye motion, facial expression, head motion, temporal stability, and perceived realism.
5. Owner must explicitly PASS quality before any merge.

## Current limitations
- First integration is a quality benchmark profile, not a claim of final long-video production readiness.
- Upstream documents 12 GB VRAM for Flash and recommends smaller partial video lengths for VRAM reduction; Windows behavior still requires owner-machine verification.

## Gates
- Execution: IMPLEMENTED ON DRAFT PR
- Automated/static verification: WAITING
- Code review: WAITING
- Owner runtime: NOT STARTED
- Documentation sync: PARTIAL
- Merge: BLOCKED
