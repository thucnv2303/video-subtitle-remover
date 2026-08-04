# Pipeline 1 Baseline Characterization (Runtime Evidence)

## Test Environment
- **Task:** RECOVERY-006
- **Branch:** rescue/wip-20260803
- **HEAD:** 5b87037

## 1. SAMPLE IDENTITY
- **Source path:** F:\test3.mp4
- **Filename:** test3.mp4
- **File size:** NOT RECORDED — OWNER INPUT REQUIRED
- **Duration:** NOT RECORDED — OWNER INPUT REQUIRED
- **FPS:** NOT RECORDED — OWNER INPUT REQUIRED
- **Resolution:** NOT RECORDED — OWNER INPUT REQUIRED
- **Container and video/audio codecs:** NOT RECORDED — OWNER INPUT REQUIRED
- **Test date and local time:** 2026-08-04T13:46:00+07:00 (approximate from logs)

## 2. RUNTIME RESULT TABLE

| Check | Owner Action | Expected Result | Actual Result | Status | Runtime Evidence | Generated Output |
|---|---|---|---|---|---|---|
| Video import | Upload via `#btn-upload-step1` | Video added to P1 queue | Video added to both P1 and P2 queues | PASS | UI rendering observed | None |
| Job creation | Select video in P1 queue | Job selected for P1 | Job selected globally in legacy `app.js` | PASS | UI rendering observed | None |
| OCR | Click `#btn-start-all` in Step 1 | Extract subtitles using local AI/P1 logic | Triggered Pipeline 2 inpainting logic | FAIL | Python logs `Subtitle Removing: 100%` | `F:\test3_ocr_tmp.mp4` |
| ASR | Click `#btn-start-all` in Step 1 | Extract audio speech | ASR execution was not independently observed because the tested chain failed while waiting for OCR/SRT. | BLOCKED | Frontend log `⏱ Timeout chờ OCR.` | None |
| WebSocket SRT delivery | Wait for processing | Receive SRT via WS | No WS SRT event observed; timeout | FAIL | Frontend log `⚠️ Không trích xuất được phụ đề` | None |
| AI rewrite | Enter text and click `#btn-retry-ai` | Rewrite text via local model | No action triggered | FAIL | No UI reaction | None |
| Existing-voice TTS | Click `#btn-retry-tts` | Generate audio | No action triggered | BLOCKED | No UI reaction | None |
| Reference-audio selection | Click `#btn-upload-ref-audio` | File dialog opens, selects audio | Owner clicked the control and no action occurred. | FAIL | No file dialog or UI reaction observed | None |
| Clone sample generation | Click `#btn-clone-voice` | Generates clone sample | Not tested | NOT TESTED | No evidence provided | None |
| Cloned-voice TTS | Select clone, click `#btn-retry-tts` | Generates audio with clone | Not tested | BLOCKED | No UI reaction | None |
| Timed SRT | Auto chain from TTS | Generate SRT matched to audio | Auto chain failed at OCR | BLOCKED | No SRT generated | None |
| Replacement-audio upload | Click `#step1-btn-import-audio` | File dialog opens | Owner clicked the control and no action occurred. | FAIL | No file dialog or UI reaction observed | None |
| Cancellation | Click stop/cancel | Halts job | Not tested | NOT TESTED | No evidence provided | None |

## 3. BUG CLASSIFICATION

**BUG-004:** Global SubtitleRemover monkey-patching and shared-state concurrency risk
- Status: ARCHITECTURAL RISK
- Classification: CODE OBSERVED — NOT RUNTIME VERIFIED

**BUG-005:** Pipeline 1 start action executed the Pipeline 2 inpainting/rendering path and generated an OCR temporary MP4 instead of completing the expected P1 text extraction flow.
- Classification: RUNTIME VERIFIED
- Root cause: NOT YET VERIFIED

**BUG-006:** Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during the test.
- Classification: RUNTIME VERIFIED
- Root cause: NOT YET VERIFIED

**BUG-007:** Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during owner testing.
- Classification: RUNTIME VERIFIED
- Static evidence: corresponding bindings were not found in RECOVERY-005.

## 4. TTS AND VOICE CLONE
- **Existing-voice TTS:** BLOCKED — retry control produced no action.
- **Reference-audio selection:** NOT TESTED.
- **Voice clone sample generation:** NOT TESTED.
- **Cloned-voice TTS:** BLOCKED.
- **Timed SRT:** BLOCKED.

*Note: Current owner-confirmed TTS/clone capabilities were not disproved. They were simply not reachable through the tested Pipeline 1 UI path.*

## 5. GENERATED OUTPUT INVENTORY

For `test3_ocr_tmp.mp4`:
- **Full path:** F:\test3_ocr_tmp.mp4
- **Extension:** .mp4
- **Size:** NOT RECORDED
- **Duration:** NOT RECORDED
- **Producer:** Pipeline 2 Inpainting (Subtitle Removing) path
- **Creation timestamp:** 2026-08-04T13:46:06
- **Whether it still exists:** NOT RECORDED
- **Whether it is expected or unintended:** UNINTENDED

This was the only output observed and recorded during this baseline run.
