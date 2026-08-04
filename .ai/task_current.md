# Current Task

## Task ID
RECOVERY-007

## Name
Dedicated Pipeline 1 Text Extraction Path

## Goal
Make Step 1 extract OCR/ASR text and return SRT to the frontend without
executing Pipeline 2 subtitle removal, inpainting or video rendering.

## Status
NOT STARTED — RECOVERY-006 documentation checkpoint must be committed first.

## Single objective

Replace the current Step 1 dependency on the legacy Pipeline 2 processing path
with a dedicated Pipeline 1 text-extraction flow.

## Required behavior

- Step 1 accepts the selected original video.
- Pipeline 1 can run OCR and/or ASR using existing available engines.
- Pipeline 1 must not run subtitle removal or inpainting.
- Pipeline 1 must not create an OCR temporary rendered MP4.
- Pipeline 1 returns extracted SRT/text associated with the correct job.
- Frontend displays the returned text in the Step 1 editor.
- Progress, success and error states are visible.
- Existing Pipeline 2 behavior remains unchanged.
- Existing TTS and voice-clone code must not be refactored in this task.

## Initial allowed source scope

- api/server.py
- src/renderer/js/api.js
- src/renderer/js/app.js
- src/renderer/index.html
- relevant existing Pipeline 1 module only when direct evidence shows it is
  part of the active Step 1 call path
- required .ai memory files

Any additional source file requires project-manager approval before editing.

## Forbidden

- No scene detection.
- No keyframe extraction.
- No AI Vision.
- No multimodal timeline.
- No product/customer insight JSON.
- No edit_plan.json.
- No Pipeline 3 implementation.
- No Pipeline 2 behavior changes.
- No dependency installation.
- No broad frontend state refactor.
- No unrelated UI fixes.
- No cleanup of historical patch scripts.
- No commit, push or merge without approval.

## Acceptance criteria

- Step 1 video import: PASS.
- Step 1 extraction request reaches a dedicated P1 route: PASS.
- OCR or ASR produces text/SRT: PASS.
- Correct job receives the result: PASS.
- Step 1 editor displays the result: PASS.
- No `Subtitle Removing` or inpaint operation during Step 1: PASS.
- No unintended `*_ocr_tmp.mp4` rendered output: PASS.
- No OCR/SRT frontend timeout: PASS.
- Pipeline 2 regression check: PASS.
- Owner manual app verification: PASS.

## Verification gates

- Automated verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: WAITING.
- Merge permission: BLOCKED.
