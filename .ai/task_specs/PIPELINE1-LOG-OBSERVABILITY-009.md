# PIPELINE1-LOG-OBSERVABILITY-009

Status: APPROVED FOR PM DIRECT EXECUTION — AMENDED

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Expected base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch: `review/PIPELINE1-LOG-OBSERVABILITY-009`
- Bug: `BUG-039`

## User outcome
Pipeline 1 Console Log must preserve useful run history and must not look active when the app is only performing routine background health/status polling.

## Verified root cause
1. Legacy `app.js::addLog` clones every global log entry into `#step1-log-output`.
2. That legacy clone path removes the oldest node after 100 entries.
3. Python stdout is forwarded into the same global logger.
4. Voice Render/global status legitimately polls `/api/health`, `/api/tts/status`, and `/api/gpu-info` in the background.

## Amendment / implementation location
The first PM contents-API attempt against CRLF `app.js` produced whole-file line-ending churn. PM immediately rejected that diff and neutralized it without force push. Final review compare must contain no `app.js` change.

Authorized application source is now exactly:
- `src/renderer/js/pipeline1-run-ux.js`

Rationale: this file already owns Pipeline 1 runtime UX and can observe only `#step1-log-output`, removing P1 presentation noise and enforcing retention without changing the global logger, Python forwarding, backend polling, Voice Render, or other pipelines.

## Required implementation
1. Install one idempotent `MutationObserver` on `#step1-log-output`.
2. On existing entries at install time and newly added entries, remove only entries whose displayed text is a Python/Uvicorn-style successful `GET` access line for one of these exact endpoints:
   - `/api/health`
   - `/api/tts/status`
   - `/api/gpu-info`
3. Match must be narrow and require HTTP `200 OK`. Preserve non-200 lines, errors, unrelated backend logs, and all normal P1 logs.
4. Enforce bounded P1 console retention of **2000 `.log-entry` elements** by removing oldest entries only when the bound is exceeded.
5. Do not modify the global/main log. Heartbeat lines may remain there.
6. Do not remove, slow, or redesign background polling.
7. Preserve P1 Copy and Clear behavior.
8. Observer installation must be idempotent and not create a feedback loop.

## Forbidden application changes
- `src/renderer/js/app.js` must remain unchanged in final diff
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

## Verification
Required:
```text
node --check src/renderer/js/pipeline1-run-ux.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```
Direct GitHub compare must prove final application diff is only `src/renderer/js/pipeline1-run-ux.js`.

Deterministic behavior inspection must prove:
- each exact heartbeat endpoint with `200 OK` is recognized for P1 removal;
- same endpoint with non-200 is retained;
- normal P1 log is retained;
- retention bound is 2000;
- global log/polling code is untouched.

## Owner runtime acceptance
After PM review/static PASS:
1. Idle app for at least 30 seconds: P1 console does not accumulate routine 200 heartbeat access lines.
2. Global Backend/TTS/GPU status still refreshes.
3. Run one Standard P1 Job: meaningful early-to-completion logs remain available beyond 100 entries.
4. Copy Log contains retained P1 history.
5. Clear Log still clears P1 console.

## Publication / gates
- source commit separate from docs/state commits;
- Draft PR #52 remains based on `review/PIPELINE1-STANDARD-CJK-GUARD-008`;
- Owner runtime: NOT STARTED until PM review/static PASS;
- merge: BLOCKED.