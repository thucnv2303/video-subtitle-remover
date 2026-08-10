# Current Task

## Task ID
PIPELINE2-RUNTIME-REVISION-001

## Name
Pipeline 2 Runtime Hardening After Owner UI Test

## Status
CODE_REVIEW_PASS — OWNER_RETEST_AUTHORIZED

## Parent task
`PIPELINE2-APPROVED-UI-001 — Pipeline 2 Approved UI`

Owner has accepted the P2 UI/layout. The current task only addresses processing/runtime defects found during the first real-app test.

## Stacked base / review
- Base branch: `review/BUG-005-P1-FULL-CHAIN`
- Base SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`
- Review branch: `review/PIPELINE2-APPROVED-UI-001`
- Draft PR: #42
- Runtime source checkpoint: `b17d64fa94b7a8bafd8cb6eb396856a619f0df6c`
- Runtime spec: `.ai/task_specs/PIPELINE2-RUNTIME-REVISION-001.md`

## Owner runtime evidence
First P2 runtime test:
- UI/layout: PASS by Owner.
- Processing: FAIL.
- Job remained at 0% while UI exposed `error: backend not available`.
- Result preview was not realtime.
- Console accumulated repeated status polling lines.
- GPU did not visibly load because the actual subtitle-removal backend had not imported.

## Verified root cause
`api/server.py` depends on ignored local `video-subtitle-remover-ref`. In a clean linked Owner-test worktree that directory is absent, so API health can PASS while `HAS_BACKEND=False`.

## Runtime revision source
Authorized files:
- `src/main/python-bridge.js`
- `src/main/preload.js`
- `src/renderer/js/pipeline2-runtime.js`

Existing approved UI remains in:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

No P1/P3/AI/TTS/final-render logic is added to P2.

## Implemented revision
- Linked-worktree backend reference discovery through Git common directory and `PYTHONPATH`.
- Explicit startup log when backend reference is found/missing; no automatic clone/download.
- Frontend status watchdog converts backend `error:*` into P2 Error and stops endless polling/timer state.
- Throttled `/api/preview` draws real backend preview into result canvas while processing.
- One live P2 progress row updates in place; repetitive Uvicorn status/preview access lines and inpaint heartbeats are removed from the visible Console during P2 processing.
- CUDA/GPU info is logged as preflight/expected device only; actual STTN GPU use still requires runtime proof.

## Verification / review
Exact Git blob identity + `node --check` PASS:
- python bridge `01014a592391d315895feb7001fe6bb81ea642c2`
- preload `74784c2f5190d804ee8efad95b063a11b4484c13`
- P2 runtime `9f8d1ad46c07521f9dcd4bf1664054e54bad636d`

Linked-worktree backend-discovery simulation: PASS.
GitHub compare from failed Owner head to the runtime source checkpoint contains only authorized runtime source plus documentation. No unresolved review threads. GitHub CI/status checks are absent.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for current runtime revision evidence; no CI configured.
- Code review: PASS for fresh Owner retest.
- Owner manual app verification: UI PASS / previous processing FAIL; fresh retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS at current review checkpoint.
- Merge permission: BLOCKED.

## Owner retest
Use the same short video and verify backend reference import, STTN progress, live result preview, one-row progress/log behavior, GPU observation, final clean-video output and P3 unlock after successful P2 only.

## Merge rule
Do not merge until fresh Owner runtime verification PASS is recorded, documentation is synchronized again, and explicit Project Manager approval is given.
