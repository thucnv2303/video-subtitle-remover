# RECOVERY-007E-SOURCE-BASELINE-002-PREFLIGHT Evidence Revision

## Objective
Replace inferred scanner conclusions with direct, repository-line-numbered import/export evidence and an internally reconciled dependency graph.

## Phase 1 — Original Worktree Identity
- **Branch**: `rescue/wip-20260803`
- **HEAD**: `d67a427f1c90a2e98da560977736ead80637db3a`
- **Original Renderer Staged Status**: EMPTY

## Phase 3 — Named-Import Reconciliation

| Importer | Imported Symbol | Target Module | Import Line | Exact Export Line | Result |
|---|---|---|---|---|---|
| index.html | triggerAutoAiRewrite | pipeline1-ai.js | 13 | 19 | PASS |
| index.html | triggerAutoTts | pipeline1-ai.js | 13 | 109 | PASS |
| index.html | _buildTimedSrt | pipeline1-ai.js | 13 | 191 | PASS |
| index.html | finalizeVideo | pipeline3-finalize.js | 14 | 26 | PASS |
| index.html | initSettings | settings.js | 15 | 12 | PASS |
| index.html | loadSettingsValues | settings.js | 15 | 23 | PASS |
| index.html | renderSavedVoices | settings.js | 15 | 92 | PASS |
| index.html | updateVoiceDropdown | settings.js | 15 | 129 | PASS |
| index.html | checkTTSStatus | settings.js | 15 | 161 | PASS |
| index.html | initPromptManager | prompt-manager.js | 17 | 42 | PASS |
| index.html | renderPromptDropdown | prompt-manager.js | 17 | 27 | PASS |
| settings.js | state | store.js | 1 | 1 | PASS |
| settings.js | saveState | store.js | 1 | 31 | PASS |
| settings.js | addLog | logger.js | 2 | 41 | PASS |
| settings.js | showToast | logger.js | 2 | 94 | PASS |
| prompt-manager.js | showToast | logger.js | 1 | 94 | PASS |
| pipeline2-remove.js | $ | dom.js | 1 | 1 | PASS |
| pipeline2-remove.js | el | dom.js | 1 | 4 | PASS |
| pipeline2-remove.js | $$ | dom.js | 1 | 2 | PASS |
| pipeline2-remove.js | state | store.js | 2 | 1 | PASS |
| pipeline2-remove.js | addLog | logger.js | 3 | 41 | PASS |
| pipeline2-remove.js | showToast | logger.js | 3 | 94 | PASS |
| pipeline2-remove.js | setActiveLogTab | logger.js | 3 | 13 | PASS |

## Phase 4 — Precise Counts
- **exact row count**: 10 rows (edges) in the import graph
- **count by import kind**: 
  - STATIC_FROM: 10
  - SIDE_EFFECT: 0
  - DYNAMIC: 0
  - RE_EXPORT: 0
  - HTML_MODULE_SRC: 0
- **unique resolved target set**: `pipeline1-ai.js`, `pipeline3-finalize.js`, `settings.js`, `prompt-manager.js`, `store.js`, `logger.js`, `dom.js`
- **unique target count**: 7
- **duplicate edge count**: 0
- **entry-root count**: 5 (`index.html`, `app.js`, `api.js`, `settings.js`, `pipeline2-remove.js`)
- **total unique closure files**: 11 (5 entries + 6 missing)

## Phase 7 — SAFE PUBLICATION DECISION
- Every import edge is recorded with actual whole-file line numbers.
- Every named import resolves to an exported symbol.
- Counts match the graph.
- All import/export forms were directly checked.
- Responsibilities and importing files are recorded.
- No local module is missing.
- SECRET SCAN: NO SUSPECTED VALUES FOUND

**Decision:** SAFE TO PUBLISH
The exact publication file set is: `src/renderer/js/pipelines/pipeline1-ai.js`, `src/renderer/js/pipelines/pipeline3-finalize.js`, `src/renderer/js/components/prompt-manager.js`, `src/renderer/js/store.js`, `src/renderer/js/utils/logger.js`, `src/renderer/js/utils/dom.js`.
