# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER CORE RUNTIME PASS / CLONE REFERENCE-TRANSCRIPT CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE; never use for Owner testing.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified Owner runtime evidence
PASS:
- Voice Render tab/page mounts.
- Shared voice list and voice preview work.
- `Render toàn bộ` works end-to-end.
- Long text split into 3 sequential chunks; all completed.
- Final WAV merge completed and output is playable.
- Log/global status corrections are visible.

Latest Owner runtime FAIL:
- completed rendered speech can begin after roughly the first 3–5 supplied words; the missing words are absent from the spoken WAV content, not merely hidden by player seek/UI.

## Corrected investigation
The renderer `splitLongText()` starts at source character 0 and has no intentional prefix drop.

The prior onset-padding hypothesis was not supported by the clarified Owner observation and has been removed. The more relevant clone contract is:
- Voice Render previously sent clone `ref_audio_path` but no exact reference transcript.
- OmniVoice then auto-transcribes the reference audio when `ref_text` is absent.
- OmniVoice combines reference text + target text for conditioning before target audio generation.
- Upstream OmniVoice issue #246 independently reports materially worse cloning/pronunciation accuracy when reference audio is supplied without its transcript, while simple cases improve when both reference audio and transcript are supplied.

This evidence supports making exact reference transcript part of the app voice-clone contract. It does not prove OmniVoice has no other generation defects; Owner retest remains required.

## Published correction
- `api/tts_engine.py` accepts a bounded internal Voice Render reference-text envelope, strips it before synthesis and passes decoded text as OmniVoice `ref_text` when clone audio is used.
- The previous `postprocess_output=False` / padding / forced internal chunk settings were removed; OmniVoice normal generation defaults are restored.
- `src/renderer/js/voice-render-reference-fix.js` wraps clone TTS requests before the normal Voice Render profile wrapper and sends the exact saved reference transcript with the target text.
- New clone form now treats `Transcript chính xác của audio mẫu` as required for preview/save.
- Existing clone records with explicit `transcript/referenceText` migrate to `referenceTranscript`.
- Old clone records without explicit transcript are marked `Thiếu transcript mẫu` and receive a `+ Transcript` action; generic legacy `note` is NOT silently treated as exact transcript.
- Clone preview/render fails closed if a matching reference transcript is unavailable.
- `src/main/preload.js` loads the transcript guard before Voice Render so the existing speed/profile wrapper continues to see the original target text and remains functional.

## Distinct voice-profile correction retained
- every Voice Render voice has prosody/intonation + speedFactor metadata;
- selected speed changes real preview/chunk audio before merge;
- duration estimator remains per voice/language and can learn from real output;
- the shared clone store remains `localStorage.tts_voices`.

## Scope boundary
No P1 reasoning, P2 subtitle removal, P3 composition, video Job/gate or package/dependency change is included. The shared OmniVoice wrapper change is limited to reference-text conditioning for clone generation.

## Gates
- Execution: PASS — correction source published.
- Automated/static verification: WAITING on final exact HEAD (`node --check` + `python -m py_compile` + `git diff --check`).
- Code review: WAITING on final exact HEAD.
- Owner runtime: PARTIAL PASS — core Voice Render/render/merge PASS; clone leading-word retention RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task_current/handoff/PR metadata are updated to the same exact head.
- Merge permission: BLOCKED.

## Next permitted action
After documentation sync, Owner fetches the final exact PR #50 HEAD. For an existing clone such as Adam, if the UI shows `Thiếu transcript mẫu`, use `+ Transcript` and enter the exact words spoken in its reference audio. Then render a short unmistakable sentence repeatedly and verify the completed WAV contains every first word. Also recheck the distinct speed profile behavior. Do not merge until runtime + static + review gates pass.
