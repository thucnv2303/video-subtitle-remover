# Bug Ledger

| ID | Hien tuong | Bang chung | Root cause | Status | Phan loai |
|---|---|---|---|---|---|
| BUG-001 | Chua kiem ke toan bo bugs | N/A | Chua ro | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chua wire button btn-export-final vao finalizeVideo | Code inspection | Chua implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chua load video khi job finished | Code inspection | Chua implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching and shared-state concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED - NOT RUNTIME VERIFIED |
| BUG-005 | Pipeline 1 start action executed Pipeline 2 inpainting path and generated OCR tmp MP4 | Runtime baseline | NOT YET VERIFIED | CANDIDATE FIX REVIEWED - OWNER TEST e3db5fcb74ec45ed48b949a42d6786adc151ccaa | RUNTIME VERIFIED |
| BUG-006 | Frontend timed out waiting for OCR/SRT | Runtime baseline | NOT YET VERIFIED | CANDIDATE FIX REVIEWED - OWNER TEST e3db5fcb74ec45ed48b949a42d6786adc151ccaa | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls produced no action during owner testing | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-008 | AI settings ambiguous combined API key/model field and no model scan/select UX | Owner screenshot at abf0ee2 | Combined key/model UI and shared legacy storage | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |
| BUG-009 | Ollama rewrite contract treated model like API key entry | Code inspection | Ollama model inserted into API-key array | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | CODE OBSERVED |
| BUG-010 | DeepSeek API key visible in clear text in Settings UI | Owner screenshot at abf0ee2 | Keys stored in localStorage without encryption | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | SECURITY INCIDENT |
| BUG-011 | Kiểm tra kết nối did not call DeepSeek; only validated local input | Owner test at abf0ee2 | No real provider validation IPC | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |
| BUG-012 | Home page / Pipeline 1 layout visually broken | Owner test at abf0ee2 | Duplicated three-col wrapper in index.html | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |
| BUG-013 | Pipeline 1 AI selector did not offer or synchronize DeepSeek with Settings | Owner test at abf0ee2 | No aiModelChanged event or sync mechanism | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |

## RECOVERY-007E-AI-SETTINGS-001 candidate resolution
- Cloud API keys encrypted via safeStorage; fails closed if unavailable.
- Keys stored as hex ciphertext in userData/ai_keys.json; never in localStorage.
- Renderer never receives raw key after save.
- Python backend never receives raw key.
- DeepSeek GET /models called from main process for validation and model discovery.
- DeepSeek POST /chat/completions called from main process for AI rewrite.
- Renderer aiRewrite payload: { provider, model, prompt, srt_content } only.
- Legacy localStorage credential keys removed on settings mount.
- Home layout regression fixed by removing duplicated three-col wrapper.
- Pipeline 1 AI selector synchronized with Settings via aiModelChanged event.
- Status: CANDIDATE FIX - OWNER RETEST NOT STARTED.

## PM Source Review NEEDS_REVISION at head 70b3db51 - findings and fixes applied in 4ee2f542

BUG-014: Source encoding corruption (mojibake in main.js, settings.js)
- Root cause: Files written through encoding-lossy shell pipeline. Fixed in 4ee2f542.
- All Vietnamese strings, emoji, box-drawing characters restored from parent commit abf0ee2.

BUG-015: Non-atomic ai_keys.json write
- Root cause: Direct writeFileSync without temp-file rename.
- Fixed: serialize -> write tmp_PID -> renameSync -> cleanup on failure. No wildcard delete.

BUG-016: Corrupt key store returned {} silently
- Root cause: loadEncryptedKeys returned {} on any error, masking corruption.
- Fixed: ENOENT returns {}; all other parse/shape errors throw controlled error and do not overwrite.

BUG-017: No provider allowlist - arbitrary string written to ai_keys.json
- Root cause: No validation of provider string before credential access.
- Fixed: assertCloudProvider() helper enforces ALLOWED_CLOUD_PROVIDERS = {deepseek, gemini}.

BUG-018: Gemini validation false positive on invalid JSON / no models
- Root cause: On JSON parse failure, fallback returned hardcoded model list as if validation passed.
- Fixed: Invalid JSON rejects with error. Missing models array rejects. No compatible models returns { verified:true, noCompatibleModels:true, models:[] } - not treated as success.

BUG-019: No response-size limit on DeepSeek/Gemini discovery and rewrite calls
- Root cause: Provider calls used unbounded string concat, memory exhaustion possible.
- Fixed: 2MB limit applied to all provider responses. req.destroy on exceed.

BUG-020: No key sanitization before validation
- Root cause: Keys passed unsanitized to provider APIs.
- Fixed: trim(), dedup, reject empty, cap at MAX_KEYS_PER_PROVIDER (10).

## HARDENING-CORRECTION-007 at head 781ca260 — fixed in 7a6157c

BUG-021: Gemini no-compatible-models counted as valid and stored
- Root cause: fetchGeminiModelsList flattened noCompatibleModels result to [] and save-provider-keys treated empty-but-no-error as valid key.
- Fixed: fetchGeminiModels now rejects with controlled error 'API key được xác thực nhưng không có model generateContent tương thích.' Key not stored as usable.
- fetchGeminiModelsList wrapper removed.

BUG-022: ai:has-provider-keys returned count 0 on corrupt store instead of error
- Root cause: catch block silently returned 0, masking store corruption from UI.
- Fixed: returns {status:'ok',count} on success or {status:'error',error:message} on failure.
- UI: refreshProviderStatus displays controlled error on error status, does not show 'Chưa có key'.

BUG-023: ai:delete-provider-keys returned boolean instead of structured result
- Root cause: returned true/false; UI could not distinguish failure from success.
- Fixed: returns {status:'ok'} or {status:'error',error:message}.
- UI: delete handler inspects result.status; does not show 'Đã xóa keys' on failure.

BUG-024: Windows rename-over-existing file unreliable
- Root cause: renameSync(tmp, keysPath) may fail on Windows when destination exists; no backup strategy.
- Fixed: backup-rename-restore pattern: backup existing -> rename tmp -> cleanup backup; restore on failure.
- Stale tmp/bak from prior interrupted saves cleaned on every entry.

BUG-025: Hex ciphertext validation insufficient
- Root cause: only checked typeof string and non-empty; did not validate hex characters, even length, or max length.
- Fixed: isValidCiphertext() enforces: non-empty, even-length, hex-only chars [0-9a-f], max 8192 bytes.
- loadEncryptedKeys uses isValidCiphertext for all entries.

## CRASH-RECOVERY-FIX-008 at head 6d62a6a — fixed in 0be3180

BUG-026: saveEncryptedKeys deleted bakPath on entry before confirming it was not the only valid copy
- Root cause: stale cleanup ran unconditionally on bakPath regardless of whether it contained valid credentials.
- Fixed: stale cleanup removed. bakPath is only deleted after post-write validation of newly written keysPath succeeds.

BUG-027: Temp and backup filenames contained process.pid — cross-process recovery impossible
- Root cause: ai_keys.json.tmp_PID and ai_keys.json.bak_PID are not detectable by a new Electron process after crash.
- Fixed: deterministic paths ai_keys.json.tmp and ai_keys.json.bak — recoverable across restarts and PID changes.

BUG-028: Backup restoration failure was swallowed in saveEncryptedKeys
- Root cause: try { fs.renameSync(bakPath, keysPath); } catch {} — restore error silently ignored.
- Fixed: restore error captured; if restore fails, RESTORE_FAILED error propagated; if restore succeeds, WRITE_FAILED propagated.
  bak is never silently lost.

BUG-029: loadEncryptedKeys did not run recovery before loading; no cross-restart crash recovery path
- Root cause: loadEncryptedKeys called readFileSync directly without any artifact state check.
- Fixed: recoverKeyStore() called at the start of both loadEncryptedKeys and saveEncryptedKeys.
  recoverKeyStore handles 5 deterministic cases (A-E) and restores from .bak automatically.

## CRASH-RECOVERY-FIX013-CLEAN-RUN-014 at head 9900523 — fixed in e3db5fcb74ec45ed48b949a42d6786adc151ccaa

BUG-030: State machine overlap made Case E unreachable
- Root cause: Case A (keys + bak) was evaluated before Case E (keys + tmp + bak), so Case E could never run.
- Fixed: State machine order changed to evaluate most-specific cases first (E, A, D, B, C, normal). TC9 confirmed execution.

BUG-031: Windows restore over existing primary failed with EPERM
- Root cause: fs.renameSync(bak, keys) fails on Windows if keys exists.
- Fixed: windowsSafeRestoreFromBak helper moves existing corrupt keys to deterministic forensic path (.corrupt) before restoring bak.

BUG-032: Post-write validation failure left corrupt primary active
- Root cause: if the newly written primary failed validation, the code threw an error but left the invalid file as primary.
- Fixed: on validation failure, corrupt primary is moved to .corrupt, and bak is restored to keys and validated.

BUG-033: Unlink failures silently swallowed
- Root cause: try { fs.unlinkSync(bak) } catch {} swallowed permission errors.
- Fixed: tryUnlink helper ignores ENOENT but returns other errors (e.g. EPERM). Callers now inspect the result and throw STORE_CORRUPT or log STORE_WARN appropriately.

- UI Regression (017): Stray </div> closed main container early, collapsing Settings to 0px height and breaking Home grid. Fixed.

## INCIDENT-RECOVERY-007E-REPLACEMENT-PR-021
- PR #8 merged without approval: INCIDENT RECORDED.
- Damaged branch preserved and not canonical.
- Replacement base identified: 7e18c04cf2483403010f237356dfb7f369dae1a8 (recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement)
- Replacement review branch identified: review/RECOVERY-007E-AI-SETTINGS-001-replacement
- Settings owner result: PASS at prior retest.
- Home prior owner result: FAIL.
- FIX018 replacement source SHA: 007e78227e8af0888e4765df034f77e2c0dc4123
- Automated verification result: 35 strict CSS layout and visual assertions PASS / 0 FAIL.
- Code review: WAITING_PM_REVIEW.
- Owner retest: NOT STARTED.
- Documentation synchronization: WAITING_PM_REVIEW.
- Merge permission: BLOCKED.

## [RESOLVED] RECOVERY-007E-PIPELINE1-JOB-MODEL-VOICE-RUNTIME-FIX-024
- Bug: state is not defined unhandledrejection trace bug.
- Bug: Job Queue did not render clear individual job cards.
- Bug: Owner could not select a job and configure that job independently.
- Bug: AI model selector displayed mojibake 'ChÆ°a chá» n'
- Bug: Voice selector did not expose usable TTS voice choices because alue attributes were missing.
- Resolution: UI models synchronized properly and per-job options explicitly stored in job state. Mojibake converted to valid UTF-8. pp.js and main.css adjusted for proper job styling. Tests written in 	est_pipeline1_runtime.js.
