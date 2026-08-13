# Current State

## Status
VOICE-RENDER-SHARED-LIBRARY-009 — OWNER CORE RUNTIME PASS / LEADING-WORD TTS CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

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

Latest Owner runtime defect:
- some rendered speech intermittently loses roughly the first 2–5 words of the supplied text.

## Leading-word investigation
The Voice Render renderer splitter itself starts at source character 0 and does not intentionally discard the first words. The remaining risk is inside generated-audio onset/post-processing rather than the renderer text queue.

The installed OmniVoice generation contract supports:
- `postprocess_output` (default true; removes long silences),
- `pad_duration`,
- `fade_duration`,
- internal long-form `audio_chunk_duration` / `audio_chunk_threshold`.

There is not yet Owner evidence proving exactly which OmniVoice stage caused the missing words, so this is treated as a targeted corrective hypothesis, not a confirmed root-cause claim.

## Published onset guard
Owner explicitly requested this small correction before closing task 009. Scope therefore expands narrowly to `api/tts_engine.py`.

`generate_speech()` now:
- preserves generated onset with `postprocess_output=False`;
- retains 250 ms edge padding;
- uses a short 20 ms fade rather than aggressive edge removal;
- lowers OmniVoice internal long-form chunk target/threshold to 12s/18s so large renderer chunks are synthesized as smaller internal spans.

No input text words are prepended, removed, duplicated or rewritten by this guard.

## Distinct voice-profile correction retained
Every Voice Render voice has at least:
- `prosody` / intonation label;
- `speedFactor`.

Built-in profiles are distinct. Existing legacy clone voices missing profile fields are migrated to distinct profile combinations. New clone creation requires a non-duplicate name and non-duplicate `prosody + speedFactor` profile.

Voice Render applies selected profile speed to generated preview/chunk audio before final merge, so profile speed changes real output duration, not only displayed estimate.

## Shared-library rule
- `localStorage.tts_voices` remains the single clone-voice store.
- Settings/Pipeline selectors continue reading that store.
- New clone creation from Settings routes to Voice Render so records contain complete profile metadata.

## Important limitation
The app can enforce distinct profile metadata and speed behavior. It cannot mathematically guarantee acoustic uniqueness when the same/similar source speaker is supplied.

## Gates
- Execution: PASS — onset guard source published.
- Automated/static verification: WAITING on final exact HEAD, including Python compile for `api/tts_engine.py`.
- Code review: WAITING on onset-guard exact HEAD.
- Owner runtime: PARTIAL PASS — core render/merge PASS; leading-word retention + distinct profile behavior RETEST WAITING.
- Documentation synchronization: IN PROGRESS until task_current/handoff/PR metadata match this exact correction.
- Merge permission: BLOCKED.

## Next permitted action
Owner tests the final exact PR #50 HEAD with a short sentence whose first 5–8 words are easy to recognize, then repeats several renders with OmniVoice/default and at least one clone. The beginning of every output must preserve the supplied first words. Also recheck two distinct speed profiles still produce real duration differences. If those pass and static checks pass, task 009 may be closed and control returns to the main pipeline work. Do not merge before that evidence.
