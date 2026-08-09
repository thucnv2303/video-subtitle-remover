# Current Task

## Task ID
PIPELINE1-HANDOFF-001

## Name
Pipeline 1 → Pipeline 2 State/Handoff Gate

## Status
WAITING_OWNER_TEST

## Base
`2324d922de4874af1eb33f5dec2ea2d63a2bb968`

## Review branch / PR
- Branch: `review/PIPELINE1-HANDOFF-001`
- Draft PR: #40
- Reviewed source head: `cda653f37e89b66671abee51c2ec516e338eb522`

## Problem
A video added to Pipeline 1 currently appears immediately in Pipeline 2 because both views render the same shared `state.jobs` and legacy `job.status` is reused across pipelines.

## Required behavior
- Upload creates a P1 job only.
- P2 remains locked/hidden while P1 is idle, queued, processing, cancelled, or error.
- P1 success performs the handoff and makes that exact job ready in P2.
- P2 still processes the ORIGINAL source video; P1 does not render or modify video.
- P2 cannot accept direct upload or drag/drop.
- P2 cannot start while any P1 job remains queued/processing.
- P2 is subtitle-removal only: no ASR, AI rewrite, or TTS chaining.
- P2 success opens P3; P1 success alone does not expose P3.

## Implementation
- Added `src/renderer/js/pipeline-state.js`.
- Added separate `p1Status/p1Progress`, `p2Status/p2Progress`, and `p3Status` fields.
- Added stable P1→P2 handoff state with `p2-ready` legacy sentinel to prevent completed P1 jobs from being requeued by Start All.
- P2 job list and selected preview are gated by P1 completion.
- P2 direct upload/drop is blocked.
- P2 Start is captured and calls the existing P2 runner with P2-only flags.
- `pipeline1-ai.js` loads the state gate and corrects obsolete direct-P1-to-P3 TTS completion wording.

## Verification
- Exact `pipeline-state.js` Git blob `70ed7d86b9e54217c732c0538048f65244a1caf8`: hash match + `node --check` PASS.
- Exact `pipeline1-ai.js` Git blob `bf9f15a1baec9ab8e15146bcd7b2b53b6a6da374`: hash match + `node --check` PASS.
- P1/P2/P3 state transition simulation: PASS.
- Error/cancel remains P2 locked and retryable: PASS.
- P2 guarded start uses subtitle-removal-only flags: PASS.
- P2 remains disabled while any P1 job is queued/processing: PASS.
- GitHub CI: none configured.

## Non-goals
- Scene/keyframe/multimodal analysis is not implemented here.
- Approved Pipeline 1 UI is not redesigned.
- Pipeline 2 inpainting algorithm is not rewritten.
- BUG-005 full Pipeline 1 processing chain is not considered resolved by this task.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for Owner handoff test.
- Owner manual app verification: NOT STARTED / AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Owner test focus
1. Add a new video in P1 and immediately open P2: the job must not appear and stale P1 preview must not remain active in P2.
2. P2 must not offer a usable direct-upload/drop bypass.
3. If P1 fails/cancels, the job stays absent from P2.
4. When P1 finishes, only that job becomes visible in P2 as ready.
5. While another P1 job is queued/processing, P2 Start remains blocked.
6. Starting P2 performs subtitle removal only; it must not trigger ASR/AI/TTS again.
7. P3 must remain locked until P2 finishes.
