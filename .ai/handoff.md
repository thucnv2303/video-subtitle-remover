# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
CLONE REF-TEXT REGRESSION ROLLED BACK / OWNER RESTORATION RETEST WAITING / MERGE BLOCKED

## Authority
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified runtime evidence
Previously working/accepted:
- Voice Render mount/navigation.
- voice preview and long-text sequential render.
- final WAV merge/playback.
- shared voice library.
- global status/log UI.
- distinct per-voice speed/prosody behavior.

Latest regression:
- after adding reference transcript conditioning, generated clone audio could speak content incorrectly and the clone timbre sounded materially different from the previously accepted behavior.
- Owner supplied `voice-render-2026-08-13.wav` as runtime evidence.

## Correction decision
The reference-transcript approach is invalid for legacy clones when exact audio/transcript pairing is not guaranteed. A common transcript cannot be attached to arbitrary historical reference audio.

## Published rollback
- restore OmniVoice generation to target text + optional `ref_audio` only;
- remove transcript-envelope/ref_text handling from `api/tts_engine.py`;
- stop loading the transcript request wrapper from preload;
- delete `voice-render-reference-fix.js`;
- retain Voice Render queue/merge/profile/status/log behavior.

## Remaining defect
The earlier intermittent 3–5 leading-word omission is still open. It must be investigated only after Owner confirms clone content and timbre are restored.

## Retest sequence
1. Fetch final exact PR #50 HEAD and fully restart VSR.
2. Confirm no transcript requirement remains for Adam.
3. Preview/render a short known target with Adam.
4. Confirm correct spoken content and restored Adam timbre.
5. Only after restoration PASS, separately reproduce/check the leading-word omission.

## Static verification
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS rollback published.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: PASS once PR metadata points to final exact docs head.
- Merge permission: BLOCKED.