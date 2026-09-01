# Active PM Execution Spec

Status: OWNER_RUNTIME_WAITING

Task: `TALKING-PORTRAIT-ECHOMIMICV3-036`
Repository: `thucnv2303/video-subtitle-remover`
Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`
Draft PR: #76
Base: `review/TALKING-PORTRAIT-JOYVASA-035`
Base SHA: `1b1b8ba4b82078534b7fa24582be7e44688319bd`

## Active purpose
Benchmark a materially more realistic local AI Avatar renderer. Keep JoyVASA as Fast/Preview and route the existing Quality option to EchoMimicV3 Flash.

## Source contract
- EchoMimicV3 runtime is isolated at `C:\VSR-EchoMimicV3`.
- Upstream pinned commit: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Flash profile: 8 steps, 768x768, 25 FPS, TeaCache.
- Existing image + voice workflow and render log remain the user flow.
- No P1/P2/P3, Voice Render, standalone Xoa Sub, or task-034 changes.

## Owner acceptance
Run setup, confirm CUDA/READY, launch app, select the same portrait and Vietnamese voice used for the JoyVASA baseline, keep `Chất lượng cao`, render, then compare mouth sync, eye/blink activity, facial expression, head motion, stability, and realism against JoyVASA.

## Gates
Execution implemented on Draft PR #76. Automated/static verification WAITING. Code review WAITING. Owner runtime NOT STARTED. Documentation synchronization PARTIAL. Merge BLOCKED.

## Next action
Owner setup/runtime benchmark only. Do not merge.
