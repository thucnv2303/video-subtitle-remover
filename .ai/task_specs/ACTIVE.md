# Active PM Execution Spec

Status: APPROVED_FOR_PM_DIRECT_EXECUTION

Task: `PIPELINE1-LOG-OBSERVABILITY-009`
Repository: `thucnv2303/video-subtitle-remover`
Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
Expected base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch: `review/PIPELINE1-LOG-OBSERVABILITY-009`

Execution spec:
`.ai/task_specs/PIPELINE1-LOG-OBSERVABILITY-009.md`

## Execution authority
Project Manager direct GitHub implementation. No external executor.

## Revised application scope
Single application file authorized:
- `src/renderer/js/pipeline1-run-ux.js`

`src/renderer/js/app.js` must remain byte-identical to the base/source blob. The first direct contents-API attempt caused whole-file CRLF churn and was neutralized by a non-force corrective commit; final compare must show no `app.js` change.

## Primary objective
- keep useful P1 console history beyond the legacy 100-line truncation;
- remove only routine successful background health/TTS/GPU access-log entries from the P1 console presentation;
- preserve global log and status polling behavior.

## Stop rule
Any unexpected condition, scope mismatch, remote HEAD mismatch, or inability to isolate the final review diff => STOP. No history rewrite or force push.

## Merge
BLOCKED. Owner runtime begins only after PM code review and static verification PASS.