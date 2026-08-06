# QA Checklist

## Owner Manual App Verification (RECOVERY-007-OWNER-VERIFY-001)
PAUSED - BLOCKED BY BUG-008/BUG-009

- [ ] Owner launches existing application using normal known launch procedure.
- [ ] No dependencies, packages or environment components installed or upgraded.
- [ ] Owner imports a representative Chinese product-review source video.
- [ ] Owner starts Pipeline 1 only.
- [ ] Pipeline 1 uses the selected original video.
- [ ] Pipeline 1 ASR returns SRT/text.
- [ ] The returned result is associated with the correct job.
- [ ] The Step 1 editor displays the returned text/SRT.
- [ ] No Pipeline 2 subtitle-removal or inpaint operation starts during Pipeline 1.
- [ ] No unintended *_ocr_tmp.mp4 file is generated.
- [ ] Pipeline 1 does not time out waiting for OCR/ASR/SRT.
- [ ] Error and progress states are visible and understandable.
- [ ] After Pipeline 1 observation is recorded, owner runs separate Pipeline 2 regression check.
- [ ] Pipeline 2 still produces expected clean-video result.
- [ ] Owner records exact observed PASS/FAIL, error text, visible state and output filenames.

## RECOVERY-007E Owner Verification
Owner retest: NOT STARTED.
Must not start until PM code review on PR #8 passes.

- [ ] Settings page renders without layout regression on home page.
- [ ] DeepSeek provider panel has masked API key input (type=password).
- [ ] Entering a valid DeepSeek key triggers real GET /models via Kiểm tra & Lấy model button.
- [ ] DeepSeek model list populates from API response.
- [ ] Entering an invalid placeholder key shows a controlled auth failure, does not save key.
- [ ] Saved keys remain masked; DOM is not refilled with raw key text.
- [ ] Key count indicator (Da luu X key) reflects actual saved count.
- [ ] Deleting keys removes ciphertext from userData/ai_keys.json.
- [ ] Gemini provider panel has masked API key input.
- [ ] Gemini key saved via safeStorage.
- [ ] Ollama panel does not show or require an API key.
- [ ] Ollama endpoint and model remain functional.
- [ ] Pipeline 1 AI selector displays the active provider/model.
- [ ] Pipeline 1 AI selector updates when Settings provider/model changes.
- [ ] AI rewrite via DeepSeek completes successfully with a valid key.
- [ ] AI rewrite does not log or expose raw key in any visible UI output.
- [ ] Home page three-column layout is correct after fix.
- [ ] Pipeline 2 regression: subtitle removal produces expected clean-video.
- [ ] RECOVERY-007 ASR regression passes.
- [ ] No unintended ai_api_key or ai_api_keys_* values remain in localStorage after session.

## Credential Hardening QA (RECOVERY-007E-AI-SETTINGS-001-SOURCE-REVIEW-FIX-006)
PM NEEDS_REVISION addressed in commit 4ee2f542. Owner retest: NOT STARTED.

- [ ] No mojibake in visible UI text on Home, Settings, or Pipeline 1.
- [ ] No mojibake in renderer DevTools console for normal navigation.
- [ ] Unknown provider IPC returns controlled error; ai_keys.json is not modified.
- [ ] Corrupt ai_keys.json -> app reports controlled error; file is not overwritten.
- [ ] Valid save -> temp file created, atomically renamed, final file has hex ciphertext only.
- [ ] Invalid DeepSeek key returns controlled authentication error, not stored.
- [ ] Invalid Gemini key is not accepted through any fallback or hardcoded model list.
- [ ] Gemini with no compatible models returns controlled noCompatibleModels result.
- [ ] Ollama scan and test remain functional (regression).
- [ ] Pipeline 2 sanitizer remains functional (regression).
- [ ] Voice-clone dialog cancel and preview remain functional (regression).
- [ ] Home layout remains correct (regression).
- [ ] ai:has-provider-keys does not decrypt keys unnecessarily; counts ciphertext entries.
- [ ] Submitted keys are trimmed and deduplicated before validation.
- [ ] Empty key input is rejected before calling provider API.
- [ ] Key count stored does not exceed MAX_KEYS_PER_PROVIDER (10).
- [ ] Provider URLs containing keys are not logged to console.

## HARDENING-CORRECTION-007 QA (commit 7a6157c)
PM NEEDS_REVISION at 781ca260 addressed. Owner retest: NOT STARTED.

- [ ] Gemini authenticated key with no compatible models: controlled error shown; key not saved; status not 'online'.
- [ ] Gemini invalid key: authentication error; key not saved.
- [ ] ai:has-provider-keys returns {status:'ok',count:N} for valid store.
- [ ] ai:has-provider-keys returns {status:'error',error:...} for corrupt store.
- [ ] Status chip shows controlled error message (not 'Chưa có key') on corrupt store.
- [ ] ai:delete-provider-keys returns {status:'ok'} on success; UI clears and toasts success.
- [ ] ai:delete-provider-keys returns {status:'error',...} on failure; UI does not show 'Đã xóa keys'.
- [ ] First save creates ai_keys.json with valid hex ciphertext only.
- [ ] Second save on Windows: ai_keys.json updated; no stale .tmp or .bak files remain.
- [ ] Simulated replacement failure: prior ai_keys.json preserved or restored.
- [ ] Store with odd-length ciphertext: controlled error; file not overwritten.
- [ ] Store with non-hex ciphertext: controlled error; file not overwritten.
- [ ] Store with unknown provider key: controlled error; file not overwritten.
- [ ] Stale .tmp_PID and .bak_PID from prior interrupted save cleaned on next saveEncryptedKeys call.
- [ ] Electron launched: page loaded, window visible, no crash.
- [ ] Home layout correct (regression).
- [ ] Pipeline 1 DeepSeek selector present (regression).
- [ ] Ollama scan/test functional (regression).
- [ ] Pipeline 2 sanitizer intact (regression).
- [ ] Voice-clone cancel produces no error (regression).

## CRASH-RECOVERY-FIX-008 QA (commit 0be3180)
Source: src/main/main.js only. Owner retest: NOT STARTED.

- [x] Recovery matrix test: 40/40 PASS (verify_crash_recovery.js).
- [x] Electron launch: npx electron . (no --no-sandbox) -> Page loaded, Window visible, Python 8765.
- [x] Case B: keys missing + valid bak -> bak auto-restored to keys across process restart.
- [x] Case A: corrupt keys + valid bak -> restored from bak; bak removed.
- [x] Case A: valid keys + corrupt bak -> keys used; corrupt bak removed.
- [x] Case B: keys missing + corrupt bak -> STORE_CORRUPT; bak preserved for forensics.
- [x] Case D: keys valid + stale tmp -> stale tmp removed; keys preserved.
- [x] Case C: keys missing + only tmp -> RECOVERY_REQUIRED; tmp preserved.
- [x] Case E: all three, keys valid -> stale tmp and bak removed.
- [x] First save (ENOENT): creates keys; no tmp or bak remain.
- [x] Second save (Windows): keys updated; no tmp or bak remain.
- [x] ENOENT + no artifacts: returns {} (clean install).
- [x] Error messages do not contain raw ciphertext.
- [ ] Owner: Settings renders Vietnamese text correctly.
- [ ] Owner: Controlled error visible when store is corrupt (not 'Chưa có key').
- [ ] Owner: Delete-key failure shows error toast, not success.
- [ ] Owner: Gemini no-compatible-models shows correct Vietnamese error message.
- [ ] Owner: Home layout correct.
- [ ] Owner: Pipeline 1 DeepSeek selector present.
- [ ] Owner: Ollama scan/test functional.
- [ ] Owner: Pipeline 2 sanitizer intact.
- [ ] Owner: Voice-clone cancel produces no error.

## CRASH-RECOVERY-CORRECTION-009 QA (commit d76fcda)
Source: src/main/main.js only. Owner retest: NOT STARTED.
*Note: Supersedes the 40/40 PASS claims from FIX-008 which had unreachable states.*

- [x] Production recovery matrix test: 65/65 PASS.
- [x] Case E reachable (keys+tmp+bak): Confirmed via TC9.
- [x] Windows-safe restore: TC5 and TC14 confirm corrupt primary is moved before bak restore.
- [x] Post-write validation rollback: simulated TC13 confirms fallback to bak if written data is invalid.
- [x] Cleanup failure: TC12 confirms tryUnlink directory returns {ok:false, code:EPERM} and is not swallowed.
- [x] Electron launch: npx electron . (no --no-sandbox) -> Page loaded, Window visible, Python 8765.
- [ ] Owner: UI tests remain identical to FIX-008.
