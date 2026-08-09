# Current State

## Status
WAITING_REVIEW — PIPELINE1-APPROVED-UI-001

## Canonical baseline
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`.
- Settings V1 PR #38: MERGED / Owner PASS.
- Post-Settings canonical source HEAD: `e578e48c22a79c69005f2d3373599addfc412ecf`.

## Active task
- Task: `PIPELINE1-APPROVED-UI-001`.
- Branch: `review/PIPELINE1-APPROVED-UI-001`.
- Visual authority: Owner-approved Pipeline 1 demo dated 2026-08-09, including explicit `Nghe thử giọng` control.
- Product source scope: `src/renderer/js/pipeline.js` and `src/renderer/styles/pipeline1-approved.css` only.

## Implementation state
- Pipeline 1 UI is rebuilt into six functional zones: AI & Prompt, Giọng đọc & Voice, Job Queue, selected Job detail, actions, and Console/Log.
- The approved UI mounts synchronously before `app.js` captures DOM references, preserving legacy event wiring.
- Selected voice preview uses the existing TTS API wrapper; no new backend endpoint.
- Selected Job detail actions are rebound safely through existing Pipeline 1 ASR/AI/TTS/file-dialog contracts.
- Settings source is unchanged after merge.
- Pipeline 2 and Pipeline 3 source are unchanged.

## Verification
- GitHub compare from `e578e48...` shows exactly two product source files changed.
- Exact GitHub `pipeline.js` blob: `913cbb3312545f0c6f3176451a8a094f56a5a61c`.
- Local verification copy hash matches that exact GitHub blob.
- `node --check` on the exact blob: PASS.
- Required Pipeline 1 runtime IDs: PASS, exactly once in the mounted template.
- No Pipeline 2/inpaint implementation added to the new Pipeline 1 UI layer.
- Runtime visual/function verification: NOT STARTED.

## Gates
- Execution: PASS for current implementation publication.
- Automated/static verification: PASS for available checks.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT YET AUTHORIZED.
- Documentation synchronization: PASS for review state.
- Merge permission: BLOCKED.
