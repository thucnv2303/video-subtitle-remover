# Current Task

## Task ID
PIPELINE1-HANDOFF-001

## Name
Pipeline 1 → Pipeline 2 State/Handoff Gate

## Status
WAITING_CODE_REVIEW

## Base
`2324d922de4874af1eb33f5dec2ea2d63a2bb968`

## Review branch
`review/PIPELINE1-HANDOFF-001`

## Problem
A video added to Pipeline 1 currently appears immediately in Pipeline 2 because both views render the same shared `state.jobs` and legacy `job.status` is reused across pipelines.

## Required behavior
- Upload creates a P1 job only.
- P2 remains locked/hidden for that job while P1 is idle, queued, processing, cancelled, or error.
- P1 success performs the handoff and makes that exact job ready in P2.
- P2 still processes the original source video; P1 does not render or modify video.
- P2 must not run while any P1 job remains queued/processing because the legacy P2 runner selects shared `status === queued` jobs.
- P2 success opens P3; P1 success alone must not expose P3.

## Current implementation
- New compatibility controller: `src/renderer/js/pipeline-state.js`.
- Separate `p1Status/p1Progress`, `p2Status/p2Progress`, and `p3Status` fields.
- P2 list is filtered by P1 completion gate.
- P2 start button is guarded by P1 completion and P1 queue inactivity.
- P1 and P2 legacy statuses are mapped into pipeline-specific status fields.
- `pipeline1-ai.js` loads the state gate and corrects the obsolete direct-P1-to-P3 completion message.

## Non-goals
- Do not implement scene/keyframe/multimodal analysis in this task.
- Do not redesign the approved Pipeline 1 UI.
- Do not rewrite Pipeline 2 inpainting logic.
- Do not merge until runtime handoff behavior is Owner verified.

## Gates
- Execution: PASS for current candidate publication.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
