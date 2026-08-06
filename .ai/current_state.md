# Current State

## Status
CANDIDATE_FIX

## Primary Input (OWNER CONFIRMED)
- Chinese product-review videos (Original source cho P1 va P2).

## Current Working Capabilities (OWNER CONFIRMED)
- Voice cloning currently works.
- TTS generation currently works.
- Hard-subtitle removal (Pipeline 2) currently works.

## Documentation and Task State
- INCIDENT-RECOVERY-007E-STAGED-TREE-001: COMPLETED
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED - PASS WITH GIT-NORMALIZED LF
- RECOVERY-007E-AI-SETTINGS-001: CANDIDATE_FIX - OWNER RETEST NOT STARTED

## Security Incident
- Owner test at abf0ee2 was FAIL.
- DeepSeek API key visible in owner screenshot is COMPROMISED. Key must be rotated by owner.
- The compromised key value is not stored, logged, or referenced in this implementation.

## Credential Architecture (IMPLEMENTED - NOT YET OWNER-RETESTED)
- Raw provider credentials (DeepSeek, Gemini) no longer stored in localStorage.
- Encrypted using electron safeStorage (OS-level encryption).
- safeStorage.isEncryptionAvailable() verified before any store/retrieve; fails closed if unavailable.
- Ciphertext persisted only under app.getPath(userData)/ai_keys.json.
- No plaintext fallback. No Base64-as-encryption fallback.
- Raw key does not reach renderer after save.
- Raw key does not reach Python backend.
- Raw key does not reach Pipeline 2.
- DeepSeek GET /models and POST /chat/completions called directly from Electron main process.
- Renderer aiRewrite payload contains only: provider, model, prompt, srt_content.
- Legacy localStorage keys deleted on settings mount (removeItem only, no migration):
  ai_api_key, ai_api_keys_gemini, ai_api_keys_deepseek, ai_api_keys_ollama

## PR Ancestry Facts
- PR #8 base branch: review/RECOVERY-007E-SOURCE-BASELINE-002-module-closure
- PR #8 base SHA: 7e18c04cf2483403010f237356dfb7f369dae1a8
- Publication parent: abf0ee2f3f0d309ed7e371c4a4f3094c20c08651
- COMMIT SEPARATION: NOT SATISFIED - hook-staged documentation into source commit 5be1d2bc.

## Tracking
- Active task: RECOVERY-007E-AI-SETTINGS-001
- Source commit: 5be1d2bc728ab282914b9d99cd050cd98916a2d6 (mixed with hook-staged docs)
- Docs follow-up: d5e40a5ed6816e1304b369013c7bbde481cc1364
- Encoding repair: acdbf602c33fbcd77b9f11d6decbbb7aba5bb31f — COMPLETED
- Encoding closeout: 70b3db51b16af797960b99202ab88b6c922ea56d — COMPLETED
- Credential hardening: 4ee2f542838a4f5f132d7f673f1b89848dc367b2 — COMMITTED (hook staged .ai alongside source)
- PM source review NEEDS_REVISION at 70b3db51: addressed in 4ee2f542
- HARDENING-CORRECTION-007: 7a6157cdea399a219081f01f661da2419196f47a — COMMITTED
  - B1: fetchGeminiModels rejects on no-compatible-models (not stored as usable)
  - B2: ai:has-provider-keys returns {status,count/error}; ai:delete-provider-keys returns {status/error}
  - B3: Windows-safe atomic write with backup+restore
  - HEX: isValidCiphertext validates even-length hex with max length
  - UI: refreshProviderStatus and delete handler handle structured results
  - Electron launch: Page loaded successfully, Window is now visible, Python backend started
  - Node verify: 26/27 PASS (1 test-script error, not production), Windows second-save: 12/12 PASS
- CRASH-RECOVERY-FORENSIC-ROLLBACK-FIX-010: 8ef4f6b3e2a9eb3ad020db15f08ca19ec56eb298 — COMMITTED
  - State machine: most-specific first (E,A,D,B,C,normal)
  - Case E now reachable and confirmed by TC9 (65/65 PASS)
  - windowsSafeRestoreFromBak: moves corrupt to .corrupt before rename
  - Post-write validation rollback: preserves invalid file as .corrupt, restores bak
  - tryUnlink: reports non-ENOENT failures (EPERM confirmed in TC12)
  - NODE_ENV=test guard: exports _credStore for production testability
  - Evidence: .ai/evidence/RECOVERY-007E-AI-SETTINGS-001-CRASH-RECOVERY-FORENSIC-ROLLBACK-FIX-010/
  - Electron launch (no --no-sandbox): Page loaded, Window visible, Python 8765
  - Deterministic paths: ai_keys.json, ai_keys.json.tmp, ai_keys.json.bak (no PID)
  - recoverKeyStore(): 5 cases A-E; auto-restore from bak across process restarts
  - saveEncryptedKeys(): fsync + post-write validation + explicit error types
  - validateStoreContent(): pure helper returning {ok,data/error}
  - Matrix test: 40/40 PASS
  - Electron launch (no --no-sandbox): Page loaded, Window visible, Python 8765
- BUG-009: CANDIDATE FIX - OWNER RETEST NOT STARTED
- PR #8: DO NOT MERGE

## Verification gates
- Execution: PASS (static checks pass)
- Automated verification: PASS
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING_PM_REVIEW
- Merge permission: BLOCKED

## Current branch
review/RECOVERY-007E-AI-SETTINGS-001-ai-settings
