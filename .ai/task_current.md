# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
SELECTIVE_GPU_RESIDENCY_V3_PUBLISHED_STATIC_AND_OWNER_BENCHMARK_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as AI Avatar `Chất lượng cao` on RTX 5060 Ti 16 GB at 768x768/25 FPS with complete voice duration and product-acceptable render speed.

## Verified progression
1. Full GPU: FAIL by CUDA OOM at VAE mask latent encode.
2. Sequential CPU offload: memory success but performance FAIL.
3. Long-audio V2: fixes the short-output duration cap using sequential 49-frame chunks.
4. Model CPU offload benchmark: performance FAIL; first chunk did not finish after roughly 44 minutes.
5. PM decision: stop retrying whole-pipeline offload modes and use selective component residency.

## V3 implementation under test
- Preserve 768x768, 25 FPS, Flash 8-step, TeaCache and 49-frame long-audio chunks.
- T5: GPU only for prompt encode.
- VAE: GPU only for latent encode and later decode.
- CLIP image encoder: GPU only for image-context encode.
- Transformer: move to GPU once before denoise and keep resident through all diffusion steps.
- Return inactive components to CPU and clear CUDA cache at phase boundaries.
- Runtime markers must include `VSR_SELECTIVE_GPU_V3` in both patched upstream files.
- Windows Cancel must terminate the whole EchoMimicV3 process tree.

## Acceptance benchmark
For the first 49-frame chunk at 768x768/25 FPS/8-step:
- under 90 s: good;
- 90-180 s: marginal, PM review required;
- over 180 s: performance FAIL for this local default;
- any CUDA OOM/exception: STOP and report exact traceback.

## Required local evidence before benchmark
- exact branch HEAD after fast-forward;
- `node --check src/main/echomimicv3-engine.js` PASS;
- `git diff --check 1b1b8ba4b82078534b7fa24582be7e44688319bd..HEAD` PASS;
- `scripts/upgrade-echomimicv3-selective-v3.ps1` reports `SELECTIVE GPU V3 READY`;
- upgrader `py_compile` succeeds for both `infer_flash.py` and `pipeline_wan_fun_inpaint_audio_2512.py`.

## Owner runtime evidence
Require phase markers in order:
- `phase=text_encoder -> cuda` then CPU;
- `phase=vae_encode -> cuda` then CPU;
- `phase=clip -> cuda` then CPU;
- `phase=transformer -> cuda (resident for denoise loop)`;
- after denoise, transformer CPU;
- `phase=vae_decode -> cuda` then CPU.
Also capture `VSR_LONG_AUDIO_V2: chunk=1` and the time until chunk 1 completes or failure occurs.

## Gates
- Execution: PASS for V3 publication.
- Automated/static: WAITING local evidence.
- Code review: PASS for V3 architecture/scope, runtime unverified.
- Owner runtime: NOT STARTED V3.
- Documentation sync: PASS after V3 state update.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, task 034, or JoyVASA runtime.
- Do not retry arbitrary lower resolution/chunk/settings after a V3 failure.
- Do not return to sequential/model CPU offload as the product path without a new PM decision.
