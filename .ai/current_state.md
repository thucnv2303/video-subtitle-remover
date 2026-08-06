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

## Tracking
- Active task: RECOVERY-007E-AI-SETTINGS-001
- Source commit: PENDING (publication in progress)
- Docs commit: PENDING (publication in progress)
- BUG-008: CANDIDATE FIX - OWNER RETEST PENDING
- BUG-009: CANDIDATE FIX - OWNER RETEST PENDING
- PR #8: DO NOT MERGE

## Verification gates
- Execution: PASS (static checks pass)
- Automated verification: PASS
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: PASS
- Merge permission: BLOCKED

## Current branch
review/RECOVERY-007E-AI-SETTINGS-001-ai-settings
