# Current Task

## Task ID
STANDALONE-SUBTITLE-REMOVER-010

## Status
READY_FOR_PM_DIRECT_IMPLEMENTATION_SOURCE_NOT_YET_PUBLISHED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Parent/base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active task spec: `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`.
- Active execution pointer: `.ai/task_specs/ACTIVE.md`.
- Exact live branch HEAD must be re-read from GitHub before source editing.

## User outcome
Add a standalone `Xoa Sub` sidebar entry directly below Voice Render that reuses the existing active Pipeline 2 UI/controller/backend path, allowing burned-in subtitle removal without running P1 or P3.

## Required implementation
1. Reuse existing Step 2 DOM and `src/renderer/js/app.js`; no duplicate P2 DOM/state/backend.
2. Standalone mode shows Step 2 workspace and hides pipeline chrome/P1/P3 while active; leaving the mode restores normal navigation.
3. Manual region list exposes `box`, `tight`, `soft` per region.
4. New regions inherit `job.maskMode || 'box'` by default.
5. Manual execution uses `region.maskMode || job.maskMode || 'box'`.
6. Auto execution keeps current job-level mask behavior.
7. Manual drawing mode shows crosshair only on drawable preview.
8. Successful region creation does not automatically disable drawing; user can draw multiple regions continuously.
9. Preserve current `canvas-inner-orig` source-coordinate mapping.
10. Preserve current `*_no_sub.mp4` output/P3 compatibility.

## Verified pre-implementation state
- PR #59 is Draft/open/unmerged.
- Verified pre-sync HEAD `6ad17f5ba3ec8c8654eb6086045408f821e7b777` contained task-spec/docs only; no application source changes.
- `src/renderer/js/standalone-subtitle-remover.js` was absent at that ref.
- Active `app.js` still uses job-level mask for manual pass and disables drawing after one successful region.

## Source scope
Primary:
- `src/renderer/js/app.js`
- `src/renderer/index.html`
- `src/renderer/styles/main.css`

A tiny helper is allowed only when it has an explicit safe bootstrap and avoids duplicating P2 processing/state.

Forbidden:
- P1 AI/Semantic changes
- Voice Render processing/TTS changes
- P3 changes
- backend/inpaint duplication
- BUG-039/BUG-040
- broad refactor/dependency churn

## Required verification after implementation
- exact branch + HEAD
- changed files/diff review
- `node --check src/renderer/js/app.js`
- `node --check` every additional changed JS file
- `git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD`
- direct GitHub review of full source/diff before Owner runtime

## Gates
- Execution: NOT STARTED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner manual verification: NOT STARTED.
- Documentation synchronization: PASS for pre-implementation state.
- Merge permission: BLOCKED.

## Next action
New chat must verify PR #59 current exact HEAD and re-read ACTIVE/spec/current_state/task_current/handoff/qa from that exact ref. If still docs-only, PM implements directly on the existing task branch. No executor and no merge.
