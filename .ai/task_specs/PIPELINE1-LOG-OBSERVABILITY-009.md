# PIPELINE1-LOG-OBSERVABILITY-009

Status: APPROVED FOR PM DIRECT EXECUTION — RUNTIME REVISION 4 / OWNER-ROUTED LOGGING

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
- Revision-4 starting HEAD: `0dc2723fde10c0b002af3efe52da94bc93978b6a`
- Bug: `BUG-039`

## Owner runtime evidence — revision 4
Owner screenshot at 2026-08-14 11:19 +07 shows Pipeline 2 Console/Log containing P1 Ollama analysis lines such as `[Ollama] Reasoning model`, `[Ollama] Vision model`, `[Ollama] Adaptive vision plan`, and `[Ollama] Vision chunk` while P2 has no job.

Current source confirms why revision 3 fails:
1. `pipeline1-analysis.js` formats P1 vision progress as `[Ollama] ...`.
2. Revision-3 P1 isolation only recognizes `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, `[VoiceSub]`; it omits `[Ollama]`.
3. `pipeline1-run-ux.js::updateP1ProgressLog()` explicitly writes progress rows to BOTH `#log-output` and `#step1-log-output`, so P1 progress is architecturally dual-sinked.

The prior strategy of writing P1 to the shared/P2 DOM then removing it with an observer is therefore insufficient and is superseded.

## Revised user outcome
- P1 operational logs and progress are written to the P1 console as their primary/only UI sink.
- P1 does not write operational/progress rows into Pipeline 2 Console/Log.
- Existing P2 access-noise suppression and one-line frame progress remain unchanged.
- P1 warning/error remains visible in P1.
- Generic application/system logs may still use the legacy global logger; this task only reroutes explicitly P1-owned messages.

## Implementation design
Introduce a small P1 owner-routing module loaded after `pipeline1-run-ux.js`:
- `src/renderer/js/pipeline1-log-router.js` — new, owns P1 message routing/presentation only.
- `src/renderer/js/pipeline1-run-config.js` — one import only, to load the router after `pipeline1-run-ux.js`.

Router requirements:
1. Wrap existing `window.addLog` without changing its implementation.
2. Explicit P1-owned message markers: `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, `[VoiceSub]`, `[Ollama]`, `[Gemini]`.
3. For owned messages, append directly to `#step1-log-output`; do NOT call legacy global `addLog` when the P1 container is available.
4. Preserve `log-entry log-<type>` classes, timestamp, scroll behavior, and existing 2000-entry retention layer.
5. Override `window.updateP1ProgressLog` so keyed P1 progress rows are created/updated ONLY in `#step1-log-output`.
6. On install, clean any already-rendered explicitly P1-owned rows from `#log-output` as a migration safeguard.
7. If P1 DOM is unavailable, safely fall back to original logger instead of dropping the message.
8. Do not alter P1 processing, AI calls, backend, polling, P2 processing, or P3.

## Authorized application source
Exactly:
- create `src/renderer/js/pipeline1-log-router.js`;
- modify `src/renderer/js/pipeline1-run-config.js` only to import the router after `pipeline1-run-ux.js`.

No changes authorized to:
- `src/renderer/js/app.js`
- `src/renderer/js/pipeline2-runtime.js`
- `src/renderer/js/pipeline1-analysis.js`
- `api/*`
- `src/main/*`
- Prompt Manager / Settings / P3 / dependencies.

## Verification
Required source review:
- revision-4 source diff contains only the new router and one import in `pipeline1-run-config.js`;
- no polling/backend/P2 engine changes;
- `[Ollama]` is classified as P1-owned;
- owned `window.addLog` calls do not enter `#log-output` when P1 DOM exists;
- keyed `window.updateP1ProgressLog` updates only the P1 container;
- unknown/generic messages fall through to legacy logger;
- warning/error type class is preserved.

Executable checks on exact checkout:
```text
node --check src/renderer/js/pipeline1-log-router.js
node --check src/renderer/js/pipeline1-run-config.js
node --check src/renderer/js/pipeline1-run-ux.js
node --check src/renderer/js/pipeline2-runtime.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner runtime acceptance
1. Run P1 while P2 has no job: `[P1]` and `[Ollama]` activity stays in P1; P2 Console/Log remains free of P1 operational rows.
2. P1 progress rows update normally and warning/error remains visible in P1.
3. Idle >=30s: routine successful health/TTS/GPU polling does not accumulate in P2.
4. Run P2: frame progress remains one updating live row.
5. Copy/Clear works in both consoles.

## Separate task — BUG-040 Prompt Manager V2
Owner screenshot and source confirm Prompt Manager requires a separate state/UI redesign. Do not mix it into PR #52. The next task will replace the split hard-coded/dynamic prompt UI with one prompt store and explicit create/edit/delete/active states.

## Gates
- Revision 3: NEEDS_REVISION / superseded by verified current-source gap.
- Revision 4: authorized for PM direct execution.
- Merge: BLOCKED.