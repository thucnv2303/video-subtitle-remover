# PIPELINE1-LOG-OBSERVABILITY-009

Status: APPROVED FOR PM DIRECT EXECUTION — RUNTIME REVISION 3

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Expected base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
- Runtime-revision-3 starting HEAD: `a7e05b1cd2fe2a4d78b74d7b7b3b59a7c9f08ba7`
- Bug: `BUG-039`

## Owner runtime evidence — revision 3
Owner reports that Pipeline 1 log information is also appearing in the Pipeline 2 log panel even though Pipeline 2 has not run. Direct source review confirms `app.js::addLog()` appends every log entry to `#log-output` first and then clones the same entry into `#step1-log-output`; `#log-output` is rendered inside the Step 2 pane. This means P1-marked activity can leak into the P2-visible history by design.

A second Owner finding concerns Prompt Manager deletion persistence. That issue is `BUG-040` and is explicitly OUT OF SCOPE for this PR; it remains a separate follow-up.

## Revised user outcome
Log presentation must respect pipeline ownership:
- P1 operational entries remain visible in the P1 console;
- P1 operational entries must not remain in the P2 log panel, including while P2 has never started;
- existing P1 retention/heartbeat cleanup remains intact;
- existing P2 routine-access cleanup and one-line frame progress remain intact;
- warnings/errors stay visible in their owning pipeline console;
- no polling frequency, backend processing, AI/TTS processing, Prompt Manager, Settings, or P3 behavior changes.

## Verified code basis
1. `src/renderer/js/app.js::addLog()` appends the original entry to `#log-output`, then synchronously clones it into `#step1-log-output`.
2. `src/renderer/index.html` places `#step1-log-output` in Step 1 and `#log-output` in Step 2.
3. `src/renderer/js/pipeline1-run-ux.js` already owns P1 console observability/retention and is LF-normalized, so a narrow observer there can remove P1-owned entries from the Step 2 container after the P1 clone has already been created.
4. P1 source uses explicit markers including `[P1]`; legacy P1 activity also uses `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, and `[VoiceSub]` markers.
5. `src/renderer/js/pipeline2-runtime.js` already owns routine access-log suppression and P2 live frame coalescing from runtime revision 2 and should remain unchanged unless review proves necessary.

## Authorized application source
Exactly:
- `src/renderer/js/pipeline1-run-ux.js` for P1-to-P2 log isolation;
- `src/renderer/js/pipeline2-runtime.js` only if a regression in existing revision-2 filtering is discovered during review.

`src/renderer/js/app.js` remains no-net-change; do not re-edit it because its CRLF format previously caused broad formatting churn through contents-API replacement.

## Required implementation
1. Preserve P1 log retention at 2000 and P1 routine heartbeat suppression.
2. Install a narrow P1 log-isolation observer on `#log-output`.
3. Remove only entries that are explicitly identifiable as P1-owned operational logs by their rendered marker, including `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, and `[VoiceSub]` after the timestamp prefix.
4. The removal must occur after normal `addLog()` execution so the synchronous P1 clone in `#step1-log-output` remains available.
5. Do not suppress generic system entries or P2 `[Inpaint]` / `[Py]` entries merely because P1 is active.
6. Preserve warning/error styling and visibility inside the P1 console.
7. Preserve Pipeline 2 revision-2 routine access-log cleanup and single live frame-progress row.
8. Preserve Copy/Clear behavior in both consoles.
9. Do not change polling/timers/backend processing or cross-pipeline state transitions.

## Forbidden changes
- no `api/*`
- no `src/main/*`
- no `src/renderer/js/app.js`
- no Prompt Manager / `components/prompt-manager.js`
- no Settings changes
- no Voice Render polling/timer changes
- no P1 AI/Vision/reasoning/TTS processing changes
- no Pipeline 3 changes
- no dependency changes
- no unrelated formatting/refactor
- no force push/history rewrite

## Verification
Required source review:
- revision-3 app-source diff limited to `pipeline1-run-ux.js` unless an explicitly justified P2 regression is found;
- P1 marker matcher is narrow and timestamp-aware;
- P1 entry is removed from `#log-output` but remains in `#step1-log-output`;
- generic system/P2 entries are not consumed by the P1 isolation observer;
- revision-2 P2 access-noise/frame-coalescing logic remains unchanged;
- no backend/timer/Prompt Manager/P3 changes.

Required executable checks when an exact checkout is available:
```text
node --check src/renderer/js/pipeline1-run-ux.js
node --check src/renderer/js/pipeline2-runtime.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner runtime acceptance
On the latest PR #52 HEAD:
1. Start/restart app and run P1 without starting P2: P1 operational logs remain in the P1 console and do not accumulate in the P2 log panel.
2. Leave idle >=30 seconds: routine successful health/TTS/GPU rows do not accumulate in the visible P2 log.
3. Backend/TTS/GPU status still refreshes normally.
4. Run P2: frame progress remains one live updating row, not hundreds of appended raw frame rows.
5. Trigger/observe a P1 warning/error: it remains visible in P1 and does not leak into P2.
6. Copy/Clear in both consoles remain functional.

## Separate follow-up — BUG-040
Prompt Manager deletion persistence is confirmed source-defective but must not be mixed into PR #52. After BUG-039 runtime PASS, open a separate task/branch so an explicitly saved empty prompt list remains empty after restart and active-prompt keys are reconciled correctly.

## Gates
Owner runtime evidence invalidates revision-2 closeout for pipeline log isolation. Revision 3 is authorized. Merge remains BLOCKED.