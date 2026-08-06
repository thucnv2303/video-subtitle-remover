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
