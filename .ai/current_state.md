# Current State

## Status
WAITING_OWNER_TEST — BUG-005 PIPELINE 1 FULL CHAIN

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Canonical base for this task
`dd520054b385ae18b8154b7c897eb9baad7eac02`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
  - Merge commit: `bf166660807423ec5d97ed365e9735940b2804e3`.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
  - Merge commit: `9a0b301171d047ccb0280eabe917f1bcd9ea85c2`.
- BUG-008 P1→P2 premature handoff defect: RESOLVED / Owner PASS.

## Active task
- Task: `BUG-005 — Pipeline 1 Full Processing Chain`.
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.
- Goal: `ASR → AI Rewrite → TTS → P1 COMPLETE → P2 READY`.

## Verified root cause
- The approved Pipeline 1 UI removed the old AI/TTS enable checkboxes.
- Legacy `createJob()` still initializes `aiRewrite=false` and `ttsGenerate=false`.
- Legacy Start All only queues idle jobs and did not snapshot the approved provider/model/prompt/voice controls into each job.
- Therefore runtime could complete ASR then always log AI Rewrite/TTS as skipped.
- In addition, `pipeline1-ai.js` previously logged AI/TTS failures and returned normally, allowing `app.js` to mark P1 complete even when an enabled stage had failed.

## Reviewed candidate
- Added `src/renderer/js/pipeline1-run-config.js`.
  - Runs in capture phase on the approved `btn-start-all`.
  - Validates selected provider/model/prompt and cloud API-key presence.
  - Snapshots approved UI configuration into every idle P1 job before the legacy queue handler runs.
  - AI Rewrite is enabled for the approved P1 flow.
  - TTS is enabled when a voice other than `none` is selected.
  - No global `ai_api_key` is created or used as new authority.
- Updated `src/renderer/js/pipelines/pipeline1-ai.js`.
  - Uses the per-job provider/model/prompt snapshot.
  - Enabled AI Rewrite failures now reject/throw.
  - Enabled TTS failures now reject/throw.
  - AI failure no longer falls back to TTS and then reports success.
  - TTS failure no longer returns as if the stage completed.
  - Existing `app.js` catch path therefore marks P1 error, allowing the accepted handoff gate to keep P2 locked.

## Verification completed
- `pipeline1-run-config.js` blob `a26dc1230a91c252ce49139772b2b4afffde7c6f`: exact hash match + `node --check` PASS.
- `pipeline1-ai.js` blob `12859d4e40d84c716a479820610fef2fe692bd37`: exact hash match + `node --check` PASS.
- Targeted simulation PASS for valid config snapshot, strict AI failure rejection and strict TTS failure rejection.
- GitHub PR #41 base/head verified; net product diff is exactly the two intended P1 files.
- Approved P1 UI source is unchanged.
- P2/P3 product source is unchanged.
- GitHub CI: not configured.
- PR #41 review comments: none unresolved.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for Owner runtime test.
- Owner manual app verification: NOT STARTED / AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED pending Owner runtime PASS and explicit merge approval.
