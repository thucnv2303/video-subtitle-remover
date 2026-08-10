# AgentOS Handoff Status

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
- Canonical task base: `dd520054b385ae18b8154b7c897eb9baad7eac02`.

## Active task
`BUG-005 — Pipeline 1 Full Processing Chain`

## Status
WAITING_CODE_REVIEW

## Review branch
`review/BUG-005-P1-FULL-CHAIN`

## Verified root cause
The approved P1 UI replaced the legacy enable checkboxes, but Start All still relied on job fields initialized as `aiRewrite=false` and `ttsGenerate=false`. The visible provider/model/prompt/voice settings were never mapped into the job before queueing. In addition, AI/TTS helper errors were swallowed, allowing false P1 completion.

## Candidate
- New `src/renderer/js/pipeline1-run-config.js` snapshots/validates the approved P1 configuration in capture phase before the legacy Start handler queues jobs.
- `src/renderer/js/pipelines/pipeline1-ai.js` now treats enabled AI/TTS failures as fatal stage errors and propagates them to the P1 runner.
- AI is required for the approved P1 Start flow.
- TTS is enabled when a non-`none` voice is selected.
- No source change was made to the approved P1 UI layout, P2, or P3.
- Existing P1→P2 handoff remains the authority for keeping P2 locked on error/cancel and unlocking only after P1 success.

## Verification
- `pipeline1-run-config.js` exact GitHub blob `a26dc1230a91c252ce49139772b2b4afffde7c6f`: hash match + `node --check` PASS.
- `pipeline1-ai.js` exact GitHub blob `12859d4e40d84c716a479820610fef2fe692bd37`: hash match + `node --check` PASS.
- Targeted Node simulation: PASS for config snapshot and strict AI/TTS rejection.
- GitHub compare shows only the two intended product files changed.
- GitHub CI: not configured.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Next action
Review the exact GitHub diff. If code review passes, open/confirm the Draft PR and authorize Owner runtime verification of the full enabled chain: ASR → AI Rewrite → TTS → P1 complete → P2 ready, plus one failure-path check proving P2 stays locked.
