# Current State

## Status
VOICE-RENDER-TAB-008 — STANDALONE OMNIVOICE DEMO / PM CODE REVIEW PASS / OWNER RUNTIME READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/VOICE-RENDER-TAB-008-demo`.
- Draft PR: #49.
- Starting parent: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Exact task spec: `.ai/task_specs/VOICE-RENDER-TAB-008.md`.
- Latest application-source commit: `dabac98867fc82c090fc5b3809a083085654b839`.

## Owner request
Add a new Voice Render tab directly below Home and use the existing OmniVoice stack as a standalone utility. This tool must not participate in the main video-processing workflow. Project Manager now performs implementation directly on GitHub; Anti/external executor is not assigned unless Owner later changes that instruction.

## Published behavior
- Voice Render is mounted after Home and before Settings.
- Desktop-first two-column layout separates text/voice controls from render status/audio output.
- User can choose language, OmniVoice default voice, or a saved clone voice from existing `tts_voices` storage.
- User chooses a WAV destination through existing Electron save dialog.
- Renderer calls existing `window.api.post()` -> `POST /api/tts/generate` with `text`, optional `ref_audio_path`, `language`, and `output_path`.
- `voice_name` is intentionally omitted so backend routes this utility through OmniVoice, not Edge TTS.
- Engine badge reads actual `/api/tts/status` availability instead of assuming success.
- Rendering disables inputs/primary action to prevent duplicate submissions.
- Success shows audio preview and output path and can open the generated file.
- Navigation explicitly deactivates the dynamically mounted page when Home/Settings is selected, avoiding dual-active page state from legacy static NodeList capture.

## Isolation contract
Application source changed only:
- `src/main/preload.js`;
- `src/renderer/js/voice-render.js`;
- `src/renderer/styles/voice-render.css`.

No change to:
- `api/server.py`;
- `api/tts_engine.py`;
- P1/P2/P3 implementation;
- shared Job/state lifecycle;
- dependencies.

The standalone utility never creates a video Job, never changes a pipeline gate and never attaches audio to video automatically.

## Parent P1 state preserved
PR #48 / `PIPELINE1-SEMANTIC-REMIX-007` remains a separate unfinished upstream review. Its static and Owner Standard/Semantic gates are not satisfied or changed by Voice Render.

## Verification facts
- Draft PR #49 exists against the intended parent branch.
- Exact source/full-file and PR patch scope reviewed by Project Manager.
- Review found one navigation lifecycle defect; it was corrected before final review.
- Review found misleading static engine-ready presentation; it was corrected to read actual TTS status.
- `node --check src/main/preload.js`: PASS on exact current source content.
- `node --check src/renderer/js/voice-render.js`: PASS on exact current source content.
- Changed application scope contains only the three approved files above.
- PR review threads: none unresolved at latest verification.
- GitHub workflow/status runs: none configured; absence is not PASS.
- Exact repository `git diff --check` could not be executed because the verification container cannot resolve GitHub for a clone. This remains an explicit automated-evidence gap rather than being assumed PASS.
- Real app visual/runtime evidence is NOT STARTED.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING/PARTIAL — Node syntax PASS; exact `git diff --check` evidence unavailable.
- Code review: PASS logic/scope on current application source.
- Owner visual/runtime verification: NOT STARTED — READY TO TEST.
- Documentation synchronization: PASS after final dynamic-file sync.
- Merge permission: BLOCKED.

## Next permitted action
Owner tests PR #49 exact branch in the real app. Verify sidebar/navigation, default OmniVoice render, audio preview/open, optional saved clone render, and that P1/P2/P3 state is unchanged. Report observed PASS/FAIL. Merge is not permitted yet.
