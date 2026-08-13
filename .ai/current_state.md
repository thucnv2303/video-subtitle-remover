# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — RESUMED AFTER VOICE RENDER MERGE / STATIC + OWNER TWO-MODE RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Active Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact task spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Corrective P1 source reviewed at `7b217c7b73e98375bcf5ff2bcb24a92c8fa61796`.
- Voice Render PR #50 merged into this branch at merge commit `3c7d47ca08c1e7a93365223a184d47e29c2175c0`.

## Completed side task
`VOICE-RENDER-SHARED-LIBRARY-009` is complete and merged.
- Owner runtime PASS with Adam at target/default 300: narration reported very good and smooth.
- Static verification PASS from Owner local command set with no errors.
- Final clone-safe default is 300; options 300/450/600 remain.
- Period-only outer chunking, native clone speed, 0.92 headroom and WAV merge behavior are retained.

## Main-flow product decision
Semantic Remix is optional and defaults OFF.
- Standard Script: normal multimodal script generation, no authoritative semantic cut/reorder plan.
- Semantic Remix: explicit opt-in; scene/profile/strategy/beat flow with deterministic validation before authoritative semantic artifacts/TTS.

## Preserved P1 corrective behavior
- Start snapshots `p1_semantic_remix_enabled` into the Job.
- Fresh Start clears cross-mode duration checkpoint state.
- Standard mode uses isolated pre-semantic reasoning under distinct IPC handlers.
- Existing Stop bridge cancels both Standard and Semantic inference.
- Semantic guard rejects known BUG-036 timing/scene/CTA/unsupported-claim failures before accepted artifact persistence/TTS.
- BUG-034 remains: no forced 95-100% source-duration narration occupancy and no extra LLM/TTS pass solely to fill duration.
- P2 remains subtitle-removal only; P3 semantic cut/reorder remains out of scope until Semantic Remix Owner PASS.

## Gates for active P1 task
- Execution: PASS for corrective P1 source publication.
- Automated/static verification: WAITING for current merged PR #48 HEAD.
- Code review: PASS logic/scope for corrective P1 source; must recheck merged-head scope before release.
- Owner Standard mode verification: NOT STARTED.
- Owner Semantic mode verification: NOT STARTED after correction.
- Documentation synchronization: PASS.
- Merge permission for PR #48: BLOCKED.
- P3 semantic cut/reorder progression: BLOCKED.

## Next permitted action
Run exact-head static verification for PR #48, then Owner tests Standard/default OFF and Semantic ON on the same current head. If Semantic passes, inspect fresh v4 artifacts; if it fails closed, capture the exact guard error and confirm downstream remains locked. Do not merge PR #48 until all active P1 gates pass.
