# Current State

## Status
WAITING_PM_REVIEW — RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032

## Primary Input (OWNER CONFIRMED)
- Chinese product-review videos (Original source cho P1 va P2).

## Current Working Capabilities (OWNER CONFIRMED)
- Voice cloning currently works.
- TTS generation currently works.
- Hard-subtitle removal (Pipeline 2) currently works.

## Documentation and Task State
- INCIDENT-RECOVERY-007E-STAGED-TREE-001: COMPLETED
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED
- RECOVERY-007E-AI-SETTINGS-001: COMPLETED (historical — see archive below)
- RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032: WAITING_PM_REVIEW

## Active Task / PR
- Active task: RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032
- PR: #14
- Branch: review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
- Latest source commit (REV3): 1f5ec183ea9bf536ef70b45fc8b6d4e9d89741a1
- REV3 publication note: An unpushed local commit was amended despite explicit no-amend instruction. Final remote ancestry remains linear: 398ab2cc -> 1f5ec183. No force push occurred. Do not amend again.

## Verification Gates
- Automated verification: PASS (49 PASS / 0 FAIL / 0 NOT TESTED, DOM 35/0)
- Code review: WAITING_PM_REVIEW
- Owner: NOT STARTED
- Documentation: WAITING_PM_REVIEW
- Merge: BLOCKED
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED - PASS WITH GIT-NORMALIZED LF
- RECOVERY-007E-AI-SETTINGS-001: CANDIDATE_FIX — WAITING_PM_REVIEW - OWNER RETEST NOT STARTED

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
- FIX013-CLEAN-RUN-014: e3db5fcb74ec45ed48b949a42d6786adc151ccaa — COMMITTED
  - State machine: most-specific first (E,A,D,B,C,normal)
  - Case E now reachable and confirmed by TC9 (36/36 PASS)
  - windowsSafeRestoreFromBak: moves corrupt to .corrupt before rename
  - Post-write validation rollback: preserves invalid file as .corrupt, restores bak
  - tryUnlink: reports non-ENOENT failures (EPERM confirmed in TC12)
  - NODE_ENV=test guard: exports _credStore for production testability
  - Evidence: .ai/evidence/RECOVERY-007E-AI-SETTINGS-001-FIX013-CLEAN-RUN-014/
  - Electron launch (no --no-sandbox): Page loaded, Window visible, Python 8765
  - Deterministic paths: ai_keys.json, ai_keys.json.tmp, ai_keys.json.bak (no PID)
  - recoverKeyStore(): 5 cases A-E; auto-restore from bak across process restarts
  - saveEncryptedKeys(): fsync + post-write validation + explicit error types
  - validateStoreContent(): pure helper returning {ok,data/error}
  - Matrix test: 36/36 PASS
  - Electron launch (no --no-sandbox): Page loaded, Window visible, Python 8765
- BUG-009: CANDIDATE FIX - OWNER RETEST NOT STARTED
- PR #8: DO NOT MERGE

## Verification gates
- Execution: PASS
- Automated verification: PASS
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: PASS
- Merge permission: BLOCKED

## Current branch
review/RECOVERY-007E-AI-SETTINGS-001-ai-settings

## PR Tracking Facts
- Source commit: e3db5fcb74ec45ed48b949a42d6786adc151ccaa
- Clean-run tested SHA: d2fcb5def5c132cc69e59d001b35e812ab4f3662
- Evidence: .ai/evidence/RECOVERY-007E-AI-SETTINGS-001-FIX013-CLEAN-RUN-014/
- Test result: 36 PASS / 0 FAIL
## UI Regression Fix (017)
- Owner runtime test at eaf6d393...: FAIL.
- Blank Settings and broken Home layout recorded as owner-observed blockers.
- Verified root cause: Stray </div> prematurely closed #step-2-content and <main>, breaking .page flexbox logic.
- Exact regression test result: 36 PASS / 0 FAIL (Recovery) + 12 PASS (DOM tests).
- Anti runtime observation status: PASS (Electron opened, UI loaded successfully, port 8765 active).
- PM review: WAITING.
- Owner retest: NOT STARTED.
- Merge: BLOCKED.

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

## RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032

- Task: RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032-REV1
- Status: NEEDS_REVISION
- PR: #14
- Branch: review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
- Source SHA: 5b9e6da0c21d523d4040295bbb20f79f65d504ab
- AI model contract: PASS (UI writes job.aiModel -> execution reads job.aiModel)
- TTS voice contract: PASS (UI writes job.ttsVoice -> execution reads job.ttsVoice)
- TTS speed contract: NEEDS_REVISION (edge_tts supports rate parameter; wiring required)
- Automated verification: INCOMPLETE (5 NOT TESTED assertions in runtime test)
- Owner retest: NOT STARTED
- Merge: BLOCKED


## RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032-REV1 Update

- Status: WAITING_PM_REVIEW
- PR: #14
- Branch: review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
- Canonical docs restored from d7770c22.
- AI model contract: PASS (UI writes job.aiModel -> execution reads job.aiModel)
- TTS voice contract: PASS (UI writes job.ttsVoice -> execution reads job.ttsVoice)
- TTS speed contract: PASS (edge_tts.Communicate rate= wired; UI slider -> job.ttsSpeed -> tts_speed payload -> rate computation in backend)
- Automated verification: 29 PASS / 0 FAIL / 2 NOT TESTED (triggerAutoAiRewrite and ai-cloud-model not available synchronously in test context)
- DOM regression: 35 PASS / 0 FAIL
- app.js node --check: PASS
- pipeline1-ai.js node --check: PASS
- npm start: PASS (Window is now visible, Page loaded successfully, Python backend started)
- Owner retest: NOT STARTED
- Merge: BLOCKED


## RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032-REV2

Active task: RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032-REV2
PR: #14
Branch: review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
Previous head (REV1): 17b8d135ef62d5426e497acd0d637d81d70fcf48
New head (REV2): 398ab2cc97df97c64a67e79e285168fa590bc1e1

TTS speed contract:
- UI slider: min=50, max=200, value=100, step=5 (100=1.0x)
- Renderer: speedMultiplier = Number(job.ttsSpeed ?? 100) / 100
- Backend: clamps 0.5-2.0, computes rate_str = f'{(speed-1)*100:+d}%'
- Mapping: 0.5->-50%, 1.0->+0%, 1.5->+50%, 2.0->+100% PASS
- UI 100 -> backend 1.0 -> +0%: PASS
- UI 150 -> backend 1.5 -> +50%: PASS
- Range validation clamp: PASS

Per-job:
- Job A/B card selection: PASS
- AI model persistence: PASS
- TTS voice persistence: PASS
- TTS speed persistence: PASS

Execution:
- job.aiModel -> AI payload (provider, model, srt_content AWAITED): PASS
- job.ttsVoice -> TTS payload: PASS
- job.ttsSpeed -> converted TTS payload (1.5 for slider 150): PASS

Automated verification:
- runtime: 41 PASS / 0 FAIL / 0 NOT TESTED (exit 0)
- DOM: 35 PASS / 0 FAIL (exit 0)
- backend speed mapping: 7 PASS / 0 FAIL (Python, exit 0)
- npm start: PASS (Window visible, Page loaded, Python 8765)

Canonical docs: synchronized (active task updated, history preserved)
Code review: WAITING_PM_REVIEW
Owner: NOT STARTED
Merge: BLOCKED


## RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032-REV3

Active task: RECOVERY-007E-PIPELINE1-RUNTIME-CLEAN-FIX-032
PR: #14
Previous head (REV2): 398ab2cc97df97c64a67e79e285168fa590bc1e1

Voice contract:
- step1-tts-voice options fixed with value= attributes matching Settings contract
- production value=none: PASS
- production value=vi-VN-HoaiMyNeural: PASS
- production value=vi-VN-NamMinhNeural: PASS
- job.ttsVoice -> payload exact voice ID: PASS

Clone speed truthfulness:
- speed slider disabled when clone: voice selected: PASS
- label shows N/A -- clone voice: PASS
- slider re-enabled when switching to Edge TTS: PASS
- renderJobDetail1 also applies disable/enable on job restore: PASS

Automated verification:
- runtime: 49 PASS / 0 FAIL / 0 NOT TESTED (exit 0)
- DOM: 35 PASS / 0 FAIL (exit 0)
- npm start: PASS (Window visible, Page loaded, Python 8765)

Canonical docs:
- task_current.md Task ID updated to PIPELINE1
- handoff.md Active Task updated to PIPELINE1
- current_state.md Status and Active Task/PR updated
- <PENDING COMMIT> replaced with 398ab2cc (REV2) throughout

Code review: WAITING_PM_REVIEW
Owner: NOT STARTED
Merge: BLOCKED
