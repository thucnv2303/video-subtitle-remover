# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER CORE RUNTIME PASS / CLONE REF-TEXT REGRESSION ROLLED BACK / RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified Owner runtime evidence
PASS before latest regression:
- Voice Render mounts/navigation.
- shared voice list and preview work.
- `Render toàn bộ` works end-to-end.
- sequential long-text chunks + final WAV merge/playback work.
- global status/log UI works.
- distinct voice speed/prosody behavior was accepted by Owner.

Latest Owner FAIL:
- after reference-transcript conditioning was introduced, a generated clone result no longer matched the requested content and the voice sounded materially different/wrong compared with the previously working clone behavior.
- Owner supplied `voice-render-2026-08-13.wav`; file-level inspection showed normal WAV onset, so this is treated as generation/conditioning regression rather than player seek/cutoff.

## Root-cause decision
The `ref_text` correction is invalid for existing clone records unless the stored transcript is guaranteed to match the exact reference audio. Applying a generic/shared transcript to a legacy reference audio can create a mismatched `ref_audio`/`ref_text` pair and change generated content/timbre.

Therefore the reference-transcript experiment is rolled back instead of being merged.

## Published rollback
- `api/tts_engine.py` restored to the previously working OmniVoice clone contract: target `text` + optional `ref_audio`; no internal transcript envelope and no forced `ref_text`.
- `src/main/preload.js` no longer injects `voice-render-reference-fix.js`.
- `src/renderer/js/voice-render-reference-fix.js` removed.
- Voice Render long-text queue, WAV merge, shared library, system status, logs and per-voice speed/prosody remain intact.

## Remaining defect
The earlier Owner observation that some clone outputs can omit ~3–5 first target words is still UNRESOLVED. It must be investigated without corrupting the previously working clone conditioning path.

## Gates
- Execution: PASS for rollback source publication.
- Automated/static verification: WAITING on final exact HEAD.
- Code review: WAITING on final exact HEAD.
- Owner runtime: RETEST WAITING — first verify clone content/timbre returns to prior behavior.
- Documentation synchronization: PASS after task/handoff/PR metadata reach the same head.
- Merge permission: BLOCKED.

## Next permitted action
Owner retests one short Adam preview/render on the final exact PR #50 HEAD. First acceptance criterion is restoration: spoken content and Adam timbre must match the pre-transcript behavior. Do not test or require transcript. If restoration passes, investigate the occasional leading-word omission separately with controlled first-chunk evidence.