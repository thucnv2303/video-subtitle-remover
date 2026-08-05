# RECOVERY-007E-REBUILD-001 Preflight Report

## Source Control Summary
- **Local Branch**: rescue/wip-20260803
- **HEAD**: d67a427f1c90a2e98da560977736ead80637db3a
- **Dirty-tree state**: The working tree has modifications to application source (e.g., `api/server.py`, `src/renderer/index.html`, `src/renderer/js/app.js`, `src/renderer/js/components/settings.js`, etc.) which are preserved but unstaged.

## Current Source Map
| Source File | Exact Local Path | Git Status | SHA256 | Relevant Symbols | Responsibility | GitHub Base | Dirty Only | Duplicate Responsibility |
|---|---|---|---|---|---|---|---|---|
| `index.html` | `E:\Project AI\Video-sub-remove\src\renderer\index.html` | Modified | `15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B` | `ai-provider`, `ai-api-key` | AI settings UI HTML | Yes | Yes | No |
| `app.js` | `E:\Project AI\Video-sub-remove\src\renderer\js\app.js` | Modified | `95BAE3351D9437C5B1F8ADE173200996738F6C4785A1DBBE6F6C8563614D0ED4` | `ai_api_key`, `ai_provider` | AI config payload construction; DOM element mapping | Yes | Yes | **Yes (Settings)** |
| `settings.js` | `E:\Project AI\Video-sub-remove\src\renderer\js\components\settings.js` | Modified | `40D845884D896A58A4D9D89EF7A755D53DC8373361D5604F645C7BDCD9DCC130` | `ai-api-key`, `ai_provider` | Settings event binding and persistence | Yes | Yes | **Yes (Settings)** |
| `server.py` | `E:\Project AI\Video-sub-remove\api\server.py` | Modified | `0D3212626B0121E3D316B7128D0345817039128D2781B1017053F5DEB9098287` | `ai_config`, `api_ai_rewrite`, `api_analyze_video` | Backend analysis and rewrite APIs | Yes | Yes | No |
| `pipeline2-remove.js` | `E:\Project AI\Video-sub-remove\src\renderer\js\pipelines\pipeline2-remove.js` | Modified | `0B83DD7748FE800EAFF9E53D49485D5BC0F8776DA5A13747E49C3B7C8AD44850` | None for AI configs | Pipeline 2 execution | Yes | Yes | No |

**Settings Ownership Conclusion**: Ownership of settings persistence and event binding is currently ambiguous and duplicated between `src/renderer/js/app.js` and `src/renderer/js/components/settings.js`. Both files handle `ai_api_key` and `ai_provider` persistence and DOM access. Implementation must resolve this ambiguity (e.g., consolidating in `settings.js`) before proceeding.

## Historical Candidate Matrix
| Exact Path | Source Type | File Size | SHA256 | Tracked/Status | Relevant Symbols Found | Multi-Provider Table? | Ollama Scanner? | API Key Separated? | Pipeline 2 Changed? | ASR Changed? | Reuse Decision | Exact Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `E:\Project AI\Video-sub-remove\src\renderer\index.html` | Active local working tree | ~46KB | `15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B` | Modified | `ai-api-key`, `ai-provider` | NO | NO | NO | NO | NO | NOT APPLICABLE | Current source, needs update |
| `E:\Project AI\_recovery\RECOVERY-007E-before-20260804-212457\index.html` | Safety copy | ~46KB | `15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B` | Untracked | `ai-api-key`, `ai-provider` | NO | NO | NO | NO | NO | UNSAFE | Same as current working tree |
| `E:\Project AI\_recovery\Video-sub-remove-20260803-212834\src\renderer\index.html` | Safety copy | ~46KB | `15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B` | Untracked | `ai-api-key`, `ai-provider` | NO | NO | NO | NO | NO | UNSAFE | Does not contain multi-provider or scanner |
| `.ai/incidents/INCIDENT-RECOVERY-007E-001/index-current.patch` | Forensic patch | 2.5KB | `A85C2D54B11DE483300485BCDEB7CA12A5962C854E1045720DB6D7396B11CC69` | Tracked | `btn-scan-models`, `ai-ollama-model`, `cloud-ai-panel`, `local-ai-panel` | NO | YES | YES | NO | NO | SAFE REFERENCE | The invalid UI patch contained a cloud/local panel split, separate cloud API-key/model fields, Ollama model dropdown and scan button. It may be used only as a design reference after direct review. It must not be restored wholesale. |
| `.ai/incidents/INCIDENT-RECOVERY-007E-001/server-current.patch` | Forensic patch | 5KB | `92A071A891156D05FCB4AA1AA5335AAF46C85ACFC8F244CDB77086B51D8C5EAE` | Tracked | `/api/ai/models`, `api_ai_models` | NO | YES | NO | NO | NO | UNSAFE | The server patch is not automatically reusable because it also changed provider execution paths and previously violated scope. |
| `.ai/incidents/INCIDENT-RECOVERY-007E-001/pipeline2-current.patch` | Forensic patch | 2KB | `68E2926E6BA02C0C6ACC402C5CA8632623EEA415877F4D708822D02EAA0879E9` | Tracked | None for AI | NO | NO | NO | YES | NO | UNSAFE | Pipeline 2 modifications from the invalid attempt remain rejected. |

**ORIGINAL MULTI-PROVIDER TABLE**: NOT FOUND IN SEARCHED SOURCES
Searched scope: Active local tree, `E:\Project AI\_recovery\RECOVERY-007E-before-20260804-212457`, `E:\Project AI\_recovery\Video-sub-remove-20260803-212834`, and all forensic patches in `.ai/incidents/INCIDENT-RECOVERY-007E-001`.

## Supported Provider List
Derived directly from `index.html`:
- `gemini`: Google Gemini
- `deepseek`: DeepSeek
- `ollama`: Local (Ollama)

## Canonical Provider Contract
**Payload Schema (`ai_config`)**:
```json
{
  "provider": "selected provider ID",
  "api_key": "only the selected paid provider’s key; empty for Ollama",
  "model": "selected model",
  "endpoint": "normalized base endpoint for local provider; empty/default for paid provider",
  "prompt": "existing prompt value when required"
}
```

**Storage Requirements**:
- One separate API-key storage key per paid provider
- One optional model storage key per provider
- Separate Ollama endpoint key
- Separate Ollama selected-model key
- No Ollama API-key key
- Legacy `ai_api_key` compatibility behavior must be explicitly documented (e.g., loaded once for Gemini if `ai_api_key_gemini` is empty).
- Only the selected provider’s key may be placed in a request payload.
- No API key may be printed or logged.

**Exact Proposed Storage-Key Names**:
- `ai_provider` (stores selected provider)
- `ai_api_key_gemini`
- `ai_model_gemini`
- `ai_api_key_deepseek`
- `ai_model_deepseek`
- `ai_endpoint_ollama`
- `ai_model_ollama`

## Endpoint Normalization
Expected normalized behavior for endpoints:
- `http://localhost:11434` -> `http://localhost:11434`
- `http://localhost:11434/` -> `http://localhost:11434`
- `http://localhost:11434/api/chat` -> `http://localhost:11434`
- `http://localhost:11434/api/tags` -> `http://localhost:11434`
- Model discovery must call `<normalized>/api/tags`.
- Chat requests must call `<normalized>/api/chat`.
- Do not create duplicate suffixes.

## Automated Test Plan (20 Tests)
*Note: Tests marked (A) can be automated in CLI/scripts; tests marked (O) require owner runtime verification but are checked systematically.*
1. (A) Python syntax (`python -m py_compile api/server.py`) returns exit 0.
2. (A) JavaScript syntax (`node --check src/renderer/js/*.js`) returns exit 0.
3. (O) Required DOM IDs exist and bind successfully without console errors.
4. (O) Event binding fires properly on provider change.
5. (O) Provider panel switching shows correct fields and hides others.
6. (O) Provider-specific persistence correctly saves keys independently in `localStorage`.
7. (O) Payload includes only selected provider key.
8. (O) Ollama payload has empty/no API key.
9. (O) Model discovery success returns list and populates dropdown.
10. (O) Empty model list handles gracefully.
11. (O) Malformed response handles gracefully.
12. (O) Unreachable Ollama shows appropriate error.
13. (O) Scan failure preserves previous selection.
14. (O) Endpoint normalization strips trailing slashes and API suffixes.
15. (O) AI analysis payload contract complies with schema.
16. (O) AI rewrite payload contract complies with schema.
17. (O) No API-key logging in Python or Node server console.
18. (A) Pipeline 2 file hash unchanged (e.g., `src/renderer/js/pipelines/pipeline2-remove.js`).
19. (A) Pipeline 2 diff absent (no changes tracked).
20. (A) RECOVERY-007 ASR symbols unchanged (`api_p1_extract_text` behavior not modified).

## Owner Test Plan (15 Cases)
- [ ] Each paid provider row is independently editable.
- [ ] Changing provider does not overwrite another provider’s key.
- [ ] Saved keys remain masked.
- [ ] Ollama does not show or require an API key.
- [ ] Scan loading state displays correctly.
- [ ] Scan success state displays correctly.
- [ ] Empty state displays correctly.
- [ ] Error state displays correctly.
- [ ] Previous model retained after scan failure.
- [ ] Selected Ollama model persists after reopening settings.
- [ ] Pipeline 1 AI analysis uses the selected model.
- [ ] AI rewrite uses the same selected provider contract.
- [ ] API key is absent from visible logs.
- [ ] Pipeline 2 regression passes.
- [ ] RECOVERY-007 ASR regression passes.

## Defects Causing BUG-008 and BUG-009
- **BUG-008**: The HTML input `ai-api-key` is used for both provider API keys and Ollama model names. There is no UI to scan or select models explicitly.
- **BUG-009**: The backend loosely reads `model` or `api_key` depending on the provider, treating the Ollama model name effectively as an API key entry.

## Proposed Minimal Changed-File List
- `src/renderer/index.html`
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js`
- `src/renderer/js/app.js`
- `api/server.py`

**Explicit untouched-file list**:
- `src/renderer/js/pipelines/pipeline2-remove.js`
- `api/tts_engine.py`

## Risks and Unresolved Evidence Gaps
- None.

## Recommendation
NEEDS_MORE_EVIDENCE
