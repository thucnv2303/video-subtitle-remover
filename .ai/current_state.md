# Current State

## Status
PIPELINE1-LOG-OBSERVABILITY-009 — RUNTIME REVISION 4 SOURCE PUBLISHED / PM REVIEW PASS / STATIC PARTIAL / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Current pre-resume HEAD: `20f42653806b2ba048b8f598f3ade0d725169cca`.
- Revision-4 source head: `e25792663f9c66cfd54b25c4f60de61b14341e8e`.
- Active bug: `BUG-039`.

## Owner sequencing update — 2026-08-14
Owner has finished the immediate Prompt Manager work and explicitly directed Project Control to resume the Pipeline 2 log issue now.
`PIPELINE1-PROMPT-MANAGER-V2-010` / PR #53 remains a separate Draft PR and is NOT merged into this log branch. The Owner has verified the previously blocked create-prompt path can now add prompts. Full PR #53 closeout/static/merge gates are not silently inferred here.

## Verified BUG-039 history
- Revision 3 failed Owner runtime because P2 Console/Log displayed P1 `[Ollama]` vision/reasoning progress while P2 had no job.
- Source review confirmed `[Ollama]` was omitted from the revision-3 matcher and `updateP1ProgressLog()` dual-wrote keyed P1 progress into P1 and global/P2 containers.

## Revision-4 source state
- `src/renderer/js/pipeline1-log-router.js` routes explicit P1 owners `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, `[VoiceSub]`, `[Ollama]`, `[Gemini]` directly to `#step1-log-output` when P1 DOM is available.
- `window.updateP1ProgressLog` is replaced by a P1-only keyed updater with fallback when P1 DOM is unavailable.
- Already-rendered explicit P1 rows are removed from `#log-output` on router install.
- Existing P2 runtime still suppresses routine successful health/TTS/GPU/preview access rows and coalesces frame heartbeat into one P2 live row.
- `app.js` remains unchanged and its legacy logger is still the generic fallback.

## Verification
- Source isolation: PASS — log router + one import only for revision 4.
- PM source review: PASS.
- GitHub CI/status checks on current head: none present.
- Exact executable Node syntax / diff-check: WAITING.
- Owner runtime revision-4 retest: WAITING.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL.
- Code review: PASS.
- Owner manual app verification: WAITING.
- Documentation synchronization: PARTIAL until runtime closeout updates bug/QA ledgers.
- Merge permission: BLOCKED.

## Next permitted action
Do not make another log source revision without new revision-4 runtime evidence. First run exact static checks on the latest PR #52 head, then Owner retests P1/P2 log ownership. If revision 4 still leaks P1 rows into P2, capture the exact leaked line(s) and revise narrowly from that evidence.
