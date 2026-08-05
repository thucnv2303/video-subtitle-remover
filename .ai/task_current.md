# Current Task

## Task ID
RECOVERY-007E-AI-SETTINGS-001

## Name
REBUILD PROVIDER KEYS AND OLLAMA MODEL DISCOVERY

## Status
NOT STARTED

## Objective
Rebuild the AI Settings screen so paid-provider API keys, provider models, Ollama endpoint and Ollama model discovery are separate and usable by Pipeline 1 AI analysis/rewrite.

## Approved Design Direction
- Gemini has its own masked API-key input and model input.
- DeepSeek has its own masked API-key input and model input.
- Ollama has no API-key input.
- Ollama has a configurable base endpoint.
- Ollama has a Scan Models action.
- Installed Ollama models populate a selectable model list.
- Loading, success, empty and error states are required.
- Scan failure must preserve the previously selected model.
- Only the selected provider’s API key may enter the request payload.
- API keys must not appear in logs.
- Pipeline 1 analysis and rewrite use the selected provider/model contract.
- Pipeline 2 must not read provider, API-key, model or endpoint settings.
- RECOVERY-007 ASR behavior must remain unchanged.

## Historical Facts
- **RECOVERY-007E-SOURCE-BASELINE-001**: COMPLETED
- **Project Manager decision**: PASS — SOURCE BASELINE ACCEPTED WITH KNOWN INHERITED DIFF-HYGIENE DEFECT
- **Immutable reviewed PR head**: 60b04fd21dc023e88fc00907e91d97c15f3de3ed
- **Immutable source commit**: 29d1d6a17ef7ed71041863ab1ca3911aa039f957
- Six baseline source files match the original dirty runtime source byte-for-byte.
- Original dirty worktree was not modified.
- Source commit used `--no-verify` due to hook conflicts; exception must not be repeated.
- AI Settings implementation was not part of the baseline task.
- PR #4 must not be merged.
- **Approved base**: `review/RECOVERY-007E-SOURCE-BASELINE-001-source-baseline` (Latest GitHub head after docs transition)
- **RECOVERY-007 owner verification**: PAUSED
- **RECOVERY-007E implementation**: NOT STARTED
- **BUG-008 and BUG-009**: ACTIVE — BLOCKING AI ANALYSIS
- **AI Settings demo**: APPROVED DESIGN DIRECTION

## Verification gates for RECOVERY-007E-AI-SETTINGS-001
- Execution: NOT STARTED
- Automated verification: WAITING
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED
