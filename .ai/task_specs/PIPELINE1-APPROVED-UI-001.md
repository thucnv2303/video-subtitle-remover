# PIPELINE1-APPROVED-UI-001

Status: WAITING_REVIEW
Date: 2026-08-09

## Goal
Rebuild the Pipeline 1 desktop UI to the Owner-approved demo while preserving existing Pipeline 1 business/runtime contracts and Pipeline 1/2/3 responsibility boundaries.

## Canonical base
- Branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Post-Settings merge source basis: `e578e48c22a79c69005f2d3373599addfc412ecf`
- Settings PR #38 is merged and is not part of this task scope.

## Review branch
`review/PIPELINE1-APPROVED-UI-001`

## Owner-approved visual acceptance
The approved 2026-08-09 Pipeline 1 demo is authoritative. Required functional zones:
1. AI & Prompt.
2. Giọng đọc & Voice, including explicit `Nghe thử giọng` action for the currently selected voice.
3. Dominant Job Queue with add/drop area and queue progress.
4. Selected Job detail with content/audio tabs.
5. Action strip.
6. Console / Log.

Keep the approved dark navy / blue visual language established by the accepted Settings UI.

## Functional preservation
- Pipeline 1 remains original-video analysis/extraction/rewrite/TTS only.
- No burned-in subtitle removal in Pipeline 1.
- No final rendering in Pipeline 1.
- Preserve existing job queue, ASR extraction, AI rewrite, TTS, prompt management, upload, log, and state contracts.
- Do not modify Pipeline 2 or Pipeline 3 implementation.
- Do not modify Settings source.

## Implementation scope
Product source is limited to:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline1-approved.css`

The UI mounts synchronously from `pipeline.js` before `app.js` captures DOM references, so existing app event contracts attach to the approved DOM instead of the obsolete Pipeline 1 layout.

## Required runtime IDs
Each must exist exactly once in the mounted Pipeline 1 DOM:
- `step1-ai-provider`
- `step1-ai-model`
- `ai-prompt-select`
- `step1-btn-edit-prompt`
- `step1-tts-voice`
- `step1-btn-preview-voice`
- `btn-upload-step1`
- `step1-job-list`
- `job-count`
- `btn-start-all`
- `btn-stop-all`
- `step1-detail-title`
- `step1-detail-status`
- `step1-detail-text`
- `step1-btn-extract`
- `step1-btn-rewrite`
- `step1-btn-save-text`
- `step1-detail-audio`
- `step1-audio-empty`
- `step1-btn-gen-tts`
- `step1-btn-import-audio`
- `step1-btn-copy-log`
- `step1-btn-clear-log`
- `step1-log-output`

## Voice preview
`Nghe thử giọng` must preview the selected system/clone voice using the existing `window.api.generateTTS(text, refAudioPath, language, voiceName)` contract. No new backend endpoint is authorized.

## Detail actions
The approved UI provides safe bindings for:
- re-extract selected Job text via existing `extractTextP1`;
- AI rewrite through existing `triggerAutoAiRewrite`;
- update selected Job text;
- generate TTS through existing `triggerAutoTts`;
- select an external audio file through existing Electron file dialog.

## Verification before Owner test
- Net product diff contains only the two approved source files.
- JavaScript syntax PASS for the exact GitHub blob.
- Required runtime IDs exactly once.
- No Pipeline 2 / inpaint implementation added to Pipeline 1 UI code.
- Settings source unchanged from merged baseline.
- GitHub code review PASS.

## Owner test focus
- visual parity with approved demo;
- add videos / Job Queue rendering and selection;
- provider/model/prompt controls;
- selected voice + `Nghe thử giọng`;
- selected Job content/audio tabs;
- extract/rewrite/update/TTS/upload actions;
- start/stop queue controls;
- console Copy/Xóa;
- switch between pipeline steps and Settings without shell corruption.

Owner manual verification: NOT STARTED until PM code review PASS.
Merge permission: BLOCKED until Owner PASS, docs sync PASS, and explicit PM/Owner merge approval.
