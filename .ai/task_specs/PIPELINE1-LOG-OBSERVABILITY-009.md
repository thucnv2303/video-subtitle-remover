# PIPELINE1-LOG-OBSERVABILITY-009

Status: APPROVED FOR EXECUTION

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Expected base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch: `review/PIPELINE1-LOG-OBSERVABILITY-009`
- Bug: `BUG-039`

## User outcome
Pipeline 1 Console Log must preserve the useful run history and must not look active when the app is only performing routine background health/status polling.

## Verified root cause
At the expected base SHA:
1. `src/renderer/js/app.js::addLog` clones every global log entry into `#step1-log-output`.
2. The Step 1 clone path removes the oldest node after 100 entries.
3. Python stdout is forwarded to `addLog('[Py] ' + line, 'info')` without P1-specific routing.
4. Voice Render/global status legitimately polls `/api/health`, `/api/tts/status`, and `/api/gpu-info` in the background.

## Exact allowed application file
- `src/renderer/js/app.js`

No other application source file is authorized.

## Allowed knowledge files
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/bugs.md`
- `.ai/qa_checklist.md`
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/PIPELINE1-LOG-OBSERVABILITY-009.md`

## Required implementation
Make the smallest change in `src/renderer/js/app.js` that satisfies all of the following:

1. Increase Step 1 log retention from the current 100-entry cap to a bounded capacity of **2000 entries**. Do not make the DOM history unbounded.
2. Before cloning a global log entry into `#step1-log-output`, suppress only routine successful Python access-log lines for these exact GET endpoints:
   - `/api/health`
   - `/api/tts/status`
   - `/api/gpu-info`
3. Suppression must be narrow: only suppress lines that are Python/Uvicorn-style access logs and clearly end in HTTP `200 OK` for those exact GET endpoints.
4. Do **not** suppress non-200 responses, Python errors, renderer errors, P1 ASR/AI/Vision/guard/TTS/Job logs, or unrelated backend logs.
5. Do not change the global/main log behavior. This task changes only what is mirrored into the Step 1/P1 console and its retention bound.
6. Do not remove, slow, or redesign background health/status polling. The status UI must continue functioning.
7. Keep existing Step 1 Copy and Clear behavior intact.

## Forbidden application changes
- no `api/server.py`
- no `src/main/*`
- no `src/renderer/js/api.js`
- no Voice Render source
- no Settings source
- no P1 reasoning/AI/Vision source
- no TTS source
- no Pipeline 2 or Pipeline 3 source
- no HTML/CSS redesign
- no dependency changes
- no unrelated formatting

## Forbidden operations
- no `git reset`
- no `git restore`
- no `git checkout` to overwrite work
- no `git clean`
- no force push/history rewrite
- no `git add .` or `git add -A`
- no broad patch/rewrite script
- no self-repair outside this spec

ON ANY UNEXPECTED ERROR OR OUT-OF-SPEC CONDITION: STOP IMMEDIATELY. DO NOT INVENT A RECOVERY PATH.

## Preflight
1. `git fetch origin`
2. Read `origin/review/PIPELINE1-LOG-OBSERVABILITY-009:.ai/task_specs/ACTIVE.md`.
3. Read this spec from the same remote ref.
4. Verify `origin/review/PIPELINE1-LOG-OBSERVABILITY-009` exact HEAD equals the spec-basis SHA reported by PM.
5. Verify base ancestry includes `330d756fcce1b71ca8745b3292d7ac655bc32d13`.
6. Capture `git status --short`; if unrelated local changes cannot be safely isolated, STOP.

## Automated verification
Required before push:
```text
node --check src/renderer/js/app.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```
Also provide a small deterministic inspection/test proving:
- routine 200 access lines for the three exact endpoints are rejected from P1 mirroring;
- a non-200 line for the same endpoint is not rejected;
- a normal P1 log is not rejected;
- retention constant/bound is 2000.
Do not create a permanent test framework or dependency for this narrow task.

## Owner runtime acceptance
After PM code review PASS, Owner retests:
1. Idle app for at least 30 seconds: P1 console does not accumulate routine 200 `/api/health`, `/api/tts/status`, `/api/gpu-info` access lines.
2. Global Backend/TTS/GPU status still refreshes normally.
3. Run one Standard P1 Job: meaningful logs remain visible from early run stages through Job completion; early lines are not lost at 100 entries.
4. Copy Log contains the retained P1 history.
5. Clear Log still clears P1 console.

## Publication
- Source commit: `fix(PIPELINE1-LOG-OBSERVABILITY-009): retain P1 logs and filter heartbeat noise`
- Documentation commit: `docs(PIPELINE1-LOG-OBSERVABILITY-009): update project state and QA`
- Push only `review/PIPELINE1-LOG-OBSERVABILITY-009`.
- Draft PR base must be `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Merge remains BLOCKED.

## Final report
Return:
- exact starting remote HEAD;
- source commit SHA;
- docs commit SHA;
- final branch HEAD;
- changed files;
- exact diff summary;
- Node syntax result;
- diff-check result;
- deterministic filter/retention verification result;
- Draft PR URL;
- Owner runtime = NOT STARTED;
- merge = BLOCKED.
