# Current State

## Status
PIPELINE2-MANUAL-REGION-REVISION-002 — SOURCE PUBLISHED / PM REVIEW CHECKPOINT

## Canonical product foundation
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`.
- Canonical merged task base before stacked P1 work: `dd520054b385ae18b8154b7c897eb9baad7eac02`.
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.

## Preserved Pipeline 1 checkpoint
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.
- P2 stacked base SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`.
- PR #41 remains unmerged and preserved as the current functional checkpoint.

## Parent Pipeline 2 checkpoint
- Branch: `review/PIPELINE2-APPROVED-UI-001`.
- Draft PR: #42.
- Exact parent head used for revision 002: `39c2ac7254977c44d2cedb79cabd914fe124c3a7`.
- Owner UI/layout: PASS.
- Previous runtime retest: backend/STTN/realtime preview/output/P3 unlock materially improved; overall PARTIAL PASS / NEEDS_REVISION because ROI, region mask and Console defects remained.

## Active direct-PM source revision
Task: `PIPELINE2-MANUAL-REGION-REVISION-002`.
Review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`.
Draft PR: #43, base `review/PIPELINE2-APPROVED-UI-001`.

Source publication:
- `f2928efb59459e45c6c9a78fdfc6b0a27004d010` — initial narrow source implementation.
- `f73c1f13d28d5d1222998399c4e0c20ac00ae815` — PM self-review correction/hardening checkpoint.

Changed source relative to exact parent head is limited to:
- `src/renderer/js/pipeline2-runtime.js`;
- `src/renderer/js/pipelines/pipeline2-remove.js`.

No backend, preload/python bridge, `pipeline-state.js`, P1, P3, Settings or dependency source is changed by revision 002.

## Implemented behavior
- Manual ROI mapping uses the actual rendered `canvas-original` rectangle rather than the full preview wrapper.
- Letterbox offset is included when drawing saved overlays.
- New manual regions store their own `maskMode`; existing regions without it fall back to job/default mask.
- Region list exposes independent Box/Tight/Soft selection per region.
- Active manual P2 request payload is adapted to the current region mask while preserving the existing app.js runner.
- Visible P2 Console suppresses successful frame/poll access noise plus expected early `/api/preview` 404 lines only while P2 is active; unexpected errors remain visible.
- Existing realtime result preview, backend discovery, STTN behavior and success-only P3 unlock are intentionally preserved.

## Verification evidence
Deterministic logic simulation:
- 720x960 source rendered as 450x600 centered in an 800px-wide wrapper: tested top-left, center, bottom-right and arbitrary ROI round-trip with maximum edge error 0.125 CSS px — PASS against <=1 px criterion.
- Region masks resolved `box`, `tight`; legacy missing-region-mask case resolved job fallback `soft` — PASS.
- Log classification: frame 200 hidden; preview 404 hidden; preview 500 visible; completion visible — PASS.

GitHub compare `39c2ac7...` → `f73c1f1...`: exactly two source files, +270/-2 total.

Still unavailable in this ChatGPT execution environment:
- exact published-blob `node --check` for the modified JS files;
- repository `git diff --check` against a local checkout.
Container network cannot resolve GitHub and GitHub CI/status checks are not configured. These are not claimed PASS.

## Gates
- Execution: PASS for direct-PM source publication to dedicated review branch/Draft PR.
- Automated/static verification: PARTIAL PASS — deterministic ROI/mask/log simulations PASS; exact-blob JS syntax and `git diff --check` WAITING; no GitHub CI configured.
- Code review: IN PROGRESS / final decision not yet granted at this documentation checkpoint.
- Owner manual app verification: previous retest PARTIAL PASS / NEEDS_REVISION; fresh revision-002 retest NOT STARTED.
- Documentation synchronization: PASS at this source-publication checkpoint.
- Merge permission: BLOCKED.

## Next permitted action
Project Manager completes direct GitHub review of PR #43 current head, including exact diff/full source and scope. Fresh Owner runtime retest remains blocked until code review is explicitly authorized. Do not merge.
