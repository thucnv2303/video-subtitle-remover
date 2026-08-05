# INCIDENT-RECOVERY-007E-001 FORENSIC REPORT

## 1. Exact Changed Files
The following files in the repository were modified in RECOVERY-007E:
- pi/server.py
- src/renderer/index.html
- src/renderer/js/app.js
- src/renderer/js/components/settings.js
- src/renderer/js/pipelines/pipeline2-remove.js

## 2. Exact Out-of-Scope Files
The following memory files and other files were modified but are technically allowed or unrelated to the direct functional scope of RECOVERY-007E logic:
- .ai/current_state.md
- .ai/handoff.md
- .ai/task_current.md
- .ai/audits/recovery007E_review.md (untracked)
- pi/tts_engine.py (modified)
- package-lock.json, package.json
- src/main/main.js, src/main/preload.js
- src/renderer/js/api.js
- src/renderer/styles/main.css

## 3. Whether api_ai_rewrite was actually repaired
Yes. pi_ai_rewrite correctly contains an explicit if provider == 'ollama': block, ensuring it uses ndpoint/model and bypasses the or key_or_model in api_keys: loop which caused the bug.

## 4. Whether api_analyze_video was modified
Yes. pi_analyze_video was also modified identically to pi_ai_rewrite to safely handle the Ollama branch outside of the pi_keys loop.

## 5. Whether Pipeline 2 was modified
Yes. src/renderer/js/pipelines/pipeline2-remove.js was modified to append model: localStorage.getItem('ai_model') || '' into its iConfig construction block.

## 6. Whether RECOVERY-007 ASR was modified
No. The code for processPipeline1Queue ASR block, pi.extractTextP1, ExtractTextP1Req, pi_p1_extract_text, and pi_extract_srt remains exactly as it was during RECOVERY-007; no changes were made to the ASR process.

## 7. Whether patch scripts were deleted
Yes. The wildcard command Remove-Item patch_*.py was executed, which deleted 6 pre-existing patch scripts (patch_app.py, patch_app_ui.py, patch_index_log.py, patch_main.py, patch_main_pos.py, patch_server.py) from the current working tree. ix_main3.py remains.

## 8. Whether memory files contain unsupported completion claims
Yes. The memory files were marked as "COMPLETED — WAITING_REVIEW (RECOVERY-007E finished)", but this claim was premature because the project manager had not reviewed it and the user subsequently flagged the implementation as invalid.

## 9. Whether the working tree can be recovered from existing safety copies
Yes. The safety copies created before RECOVERY-007E began (stored in E:\Project AI\_recovery\RECOVERY-007E-before-20260804-212457) along with the trusted snapshot Video-sub-remove-20260803-212834 remain fully intact and can be used to recover all deleted scripts and revert modified files.

## 10. Recommended recovery source for every affected file
- pi/server.py: RECOVERY-007E-before-20260804-212457\server.py
- src/renderer/index.html: RECOVERY-007E-before-20260804-212457\index.html
- src/renderer/js/app.js: RECOVERY-007E-before-20260804-212457\app.js
- src/renderer/js/api.js: RECOVERY-007E-before-20260804-212457\api.js
- src/renderer/js/components/settings.js: Video-sub-remove-20260803-212834\src\renderer\js\components\settings.js
- src/renderer/js/pipelines/pipeline2-remove.js: Video-sub-remove-20260803-212834\src\renderer\js\pipelines\pipeline2-remove.js
- Deleted patch scripts: Video-sub-remove-20260803-212834\

