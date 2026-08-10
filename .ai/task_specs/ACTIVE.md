# Active PM Execution Spec

Status: WAITING_FINAL_CODE_REVIEW

Task:
`PIPELINE2-RUNTIME-REVISION-001`

Parent task:
`PIPELINE2-APPROVED-UI-001` — Owner UI/layout PASS; processing runtime requires revision.

Repository:
`thucnv2303/video-subtitle-remover`

Stacked base:
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Base SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`
- Draft PR #41 remains unmerged and preserved as the P1 checkpoint.

Review branch / PR:
- `review/PIPELINE2-APPROVED-UI-001`
- Draft PR #42

Execution / acceptance spec:
`.ai/task_specs/PIPELINE2-RUNTIME-REVISION-001.md`

Runtime source scope:
- `src/main/python-bridge.js`
- `src/main/preload.js`
- `src/renderer/js/pipeline2-runtime.js`

Parent UI source remains:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

Verification facts:
- Exact Git blob + `node --check` PASS for the three runtime-revision JS files.
- Linked-worktree backend discovery simulation PASS.
- Existing P1→P2 gate remains unchanged.
- No automatic backend download/clone.
- CUDA telemetry is preflight only until Owner runtime proves actual STTN processing.
- GitHub CI is not configured.

Code review:
WAITING final current-head review.

Owner app verification:
Previous: UI PASS / processing FAIL.
Fresh retest: BLOCKED until code review PASS.

Merge permission:
BLOCKED.
