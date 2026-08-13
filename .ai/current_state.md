# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER CORE RUNTIME PASS / APP-NATIVE TRANSCRIPT EDITOR PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Current source correction commit: `f619418804598aa1ebb1d0d957f68d1d5f328c25`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified Owner runtime evidence
PASS:
- Voice Render mounts/navigation.
- shared voice list and core render/merge work.

Latest Owner UX FAIL:
- the full-width yellow transcript row in Voice Render was not acceptable;
- the injected Settings transcript button broke layout and was not a usable management flow;
- the remediation needed an app-native editor rather than `window.prompt`.

## Published correction
- transcript management is centralized in Voice Render;
- Settings no longer receives a transcript edit button;
- a clone missing transcript reuses the existing right-side action: `Nghe thử` becomes `Transcript`;
- clicking `Transcript` opens an app-native Voice Render modal;
- modal contains clone identity, playable reference audio, exact transcript textarea, Save and Cancel;
- save updates shared `referenceTranscript/transcript` in `localStorage.tts_voices`;
- after save the row returns to normal `Nghe thử`;
- preview/render remains fail-closed until transcript exists.

Reference-transcript TTS conditioning remains active in `api/tts_engine.py`: exact transcript is passed as OmniVoice `ref_text`, while target text is restored unchanged before generation.

## Gates
- Execution: PASS — source UX correction published.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS — transcript editor UX + leading-word retention RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task_current/handoff reach the same state.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches the final exact PR #50 HEAD, confirms Settings has no transcript injection, confirms Adam uses the right-side `Transcript` action in Voice Render, opens the modal, plays the reference audio, saves the exact transcript, then repeats the leading-word render test. Do not merge before runtime + static + review gates pass.
