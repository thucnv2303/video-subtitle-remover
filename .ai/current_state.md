# Current State

## Status
VOICE-RENDER-TAB-008 — STANDALONE OMNIVOICE DEMO PUBLISHED / STATIC + OWNER RUNTIME WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/VOICE-RENDER-TAB-008-demo`.
- Starting parent: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Exact task spec: `.ai/task_specs/VOICE-RENDER-TAB-008.md`.
- Latest application-source correction on this branch: `8f50811e6578f41119714ce157eb3987d3b1ce63`.

## Owner request
Add a new Voice Render tab directly below Home and use the existing OmniVoice stack as a standalone utility. This tool must not participate in the main video-processing workflow.

## Published behavior
- Voice Render is dynamically mounted after Home and before Settings.
- The page has a desktop-first two-column layout for text/voice controls and render result/preview.
- User can choose language, OmniVoice default voice, or a saved clone voice from the existing `tts_voices` local store.
- User chooses a WAV destination through the existing Electron save dialog.
- The renderer calls the existing API client `post()` method for `POST /api/tts/generate` with `text`, optional clone `ref_audio_path`, `language`, and explicit `output_path`.
- `voice_name` is intentionally omitted so the existing backend stays on its OmniVoice branch rather than Edge TTS.
- Success displays the generated audio and output path and allows opening the result.
- Render controls are disabled during generation to prevent duplicate submissions.
- Navigation includes an explicit exit handler because legacy `app.js` snapshots the original `.page` NodeList before this dynamically mounted page exists.

## Isolation contract
This demo does not:
- create or mutate P1/P2/P3 Jobs;
- read or write pipeline status/gates;
- attach generated voice to video;
- change any P1/P2/P3 artifacts;
- change `api/server.py`;
- change `api/tts_engine.py`;
- change dependencies.

Application source changed only:
- `src/main/preload.js`;
- `src/renderer/js/voice-render.js`;
- `src/renderer/styles/voice-render.css`.

## Parent P1 state preserved
The parent branch/PR #48 (`PIPELINE1-SEMANTIC-REMIX-007`) remains a separate unfinished review line. Its static verification and Owner Standard/Semantic runtime gates are not satisfied by this Voice Render task and remain BLOCKED/WAITING on the parent task.

## Verification facts
- Source review identified and corrected the dynamic navigation overlap risk before docs sync.
- Backend and OmniVoice source were inspected and already support explicit `output_path` plus optional reference audio.
- GitHub CI/status checks are not configured; absence is not PASS.
- Exact-head Node syntax and `git diff --check` evidence are still required.
- Real app visual/runtime verification is not yet available.

## Gates
- Execution: PASS for source publication on the dedicated review branch.
- Automated/static verification: WAITING.
- Code review: IN PROGRESS pending final exact-head review/static evidence.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS until `task_current.md` and `handoff.md` agree.
- Merge permission: BLOCKED.

## Next permitted action
Finish canonical docs, open a Draft PR against `review/PIPELINE1-SEMANTIC-REMIX-007`, perform exact-head source/diff/static review, then allow Owner real-app testing only if code review has no blocker. Do not merge yet.
