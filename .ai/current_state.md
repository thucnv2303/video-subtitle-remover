# Current State

## Status
PIPELINE2-RUNTIME-REVISION-001 — CODE REVIEW PASS / OWNER RETEST AUTHORIZED

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
- Owner temporarily closed further P1 refinement; PR #41 remains unmerged.

## Active Pipeline 2 review
- Branch: `review/PIPELINE2-APPROVED-UI-001`.
- Draft PR: #42.
- Runtime revision source checkpoint: `b17d64fa94b7a8bafd8cb6eb396856a619f0df6c`.
- Owner approved the redesigned Pipeline 2 UI/layout during runtime testing.
- The same Owner test exposed a P2 engine/runtime failure; UI acceptance does not equal processing PASS.

## Owner runtime failure — 2026-08-10
Observed directly by Owner:
- selected P2 job displayed `ĐANG XÓA SUB` but stayed at 0% for about 1m41s;
- result pane did not update realtime;
- Console accumulated repeated `/api/status` access lines;
- Action/status area exposed `error: backend not available`;
- no visible GPU load.

Direct source review verified the primary cause: `api/server.py` imports `backend.main.SubtitleRemover` from an ignored local `video-subtitle-remover-ref` directory. A clean linked test worktree does not contain that ignored folder, so the Python API can remain healthy while `HAS_BACKEND=False` and the actual subtitle-removal engine is unavailable.

The source also already exposes `/api/preview` and captures live preview frames, but legacy renderer result preview only loads the output video after completion.

## Owner-authorized runtime revision
Spec: `.ai/task_specs/PIPELINE2-RUNTIME-REVISION-001.md`.

Current runtime revision changes:
- `src/main/python-bridge.js` — discovers an existing backend reference from the linked worktree's Git common root and passes it to Python through `PYTHONPATH` / `VSR_BACKEND_REF`; no network download.
- `src/main/preload.js` — loads the isolated P2 runtime enhancer.
- `src/renderer/js/pipeline2-runtime.js` — status fail-fast watchdog, throttled real `/api/preview`, one-row P2 progress telemetry, repetitive access/heartbeat log suppression, CUDA preflight reporting.

Approved P2 UI files remain:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

Unchanged `pipeline-state.js` remains authoritative for P1→P2 eligibility and subtitle-removal-only start (`extractSrt=false`, `asrFallback=false`, `aiRewrite=false`, `ttsGenerate=false`).

## Verification for runtime revision
Exact locally constructed source matched the published Git blobs and passed `node --check`:
- `src/main/python-bridge.js` = `01014a592391d315895feb7001fe6bb81ea642c2` — PASS.
- `src/main/preload.js` = `74784c2f5190d804ee8efad95b063a11b4484c13` — PASS.
- `src/renderer/js/pipeline2-runtime.js` = `9f8d1ad46c07521f9dcd4bf1664054e54bad636d` — PASS.

Targeted linked-worktree simulation: a clean linked worktree resolved `<main-worktree>/video-subtitle-remover-ref` through `git rev-parse --git-common-dir` — PASS.

GitHub compare from the Owner-failed head `d573a3bb...` to the reviewed revision shows only the three authorized runtime source files plus canonical documentation/spec changes. `app.js`, `pipeline-state.js`, backend Python, P1/P3 source and dependencies are unchanged. No unresolved PR review threads exist. GitHub CI/status checks are not configured.

## Current interpretation of GPU state
Upstream STTN is CUDA-capable and current project config enables hardware acceleration, but the failed Owner run never loaded the real backend. CUDA preflight in the revision proves availability only; actual STTN GPU execution still requires Owner runtime evidence and must not be claimed from preflight alone.

## Gates
- Execution: PASS for current runtime revision publication.
- Automated/static verification: PASS for exact-blob JS syntax/hash + linked-worktree discovery simulation; no GitHub CI configured.
- Code review: PASS for fresh Owner runtime retest.
- Owner manual app verification: prior UI PASS / processing FAIL; fresh runtime retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS at this review checkpoint.
- Merge permission: BLOCKED.

## Next permitted action
Owner retests the same short video from the exact current PR #42 head. Required observations: backend reference import, non-stuck STTN progress, realtime result preview, compact one-row progress logging, accelerator/device behavior, final clean-video output and P3 unlock only after P2 success. Do not merge.
