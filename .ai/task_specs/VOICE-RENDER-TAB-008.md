# VOICE-RENDER-TAB-008

## Goal
Add a standalone Voice Render utility under Home that uses the existing local OmniVoice TTS stack without participating in Pipeline 1, Pipeline 2, Pipeline 3, or the shared Job lifecycle.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Starting SHA: `0b3ee3a63f06d17334b2c295491c50039326febb`.
- Review branch: `review/VOICE-RENDER-TAB-008-demo`.
- Parent P1 task/PR #48 remains independently unverified for static + Owner two-mode runtime gates.

## User outcome
From a new sidebar tab directly below Home, the user can:
1. enter arbitrary text;
2. choose language;
3. use OmniVoice default voice or a saved clone voice;
4. choose a `.wav` output path;
5. render the voice;
6. preview/open the generated audio.

The utility must not create a video Job, mutate Pipeline state, unlock downstream gates, attach audio to a video, or change P1/P2/P3 artifacts.

## Existing capability reused
No new TTS backend contract is required.

Existing backend endpoint:
- `POST /api/tts/generate`.

Existing request fields already support:
- `text`;
- `ref_audio_path`;
- `language`;
- `output_path`;
- `voice_name`.

For this utility, `voice_name` is intentionally omitted so generation stays on the existing OmniVoice path. Saved clone voices provide their `audioPath` as `ref_audio_path`.

## Source scope
Allowed application source:
- `src/main/preload.js` — load the isolated renderer tool.
- `src/renderer/js/voice-render.js` — standalone UI/state/render orchestration.
- `src/renderer/styles/voice-render.css` — standalone visual system.

No source change is required or allowed for this demo in:
- `api/server.py`;
- `api/tts_engine.py`;
- P1 analysis/reasoning files;
- P2 runtime/removal files;
- P3 finalize files;
- shared Job state;
- dependencies.

## UI contract
- Sidebar position: directly after Home and before Settings.
- Desktop-first two-column layout:
  - left: text, language, voice choice, render CTA;
  - right: idle/working/error/success state, audio preview, output path/actions.
- One primary action: `Render voice`.
- Saved clone voices are read from the same local `tts_voices` store maintained by Settings.
- Clone management stays in Settings; this utility does not duplicate that workflow.
- UI explicitly communicates that it is independent from the main video workflow.

## Runtime states
### Idle
- text editable;
- voice/language selectable;
- result empty state visible.

### Rendering
- input controls disabled;
- duplicate render blocked;
- status shows `Đang render`.

### Success
- audio player visible;
- generated path visible;
- open file and render-again actions available.

### Error
- status shows error;
- toast/log includes controlled error;
- existing text/settings remain available for retry.

## Acceptance criteria
1. Voice Render appears under Home and before Settings.
2. Entering Voice Render hides Home/Settings; leaving it does not leave multiple pages active.
3. Default mode calls existing `/api/tts/generate` without `voice_name`, preserving OmniVoice routing.
4. Saved clone voice selection sends its `audioPath` as `ref_audio_path`.
5. User chooses output `.wav` path before render and backend receives it as `output_path`.
6. Success displays playable audio and output path.
7. Empty text is rejected before backend call.
8. Duplicate clicks are blocked during render.
9. No Pipeline/Job state is read or written.
10. No P1/P2/P3/backend/TTS-engine/dependency source is changed.

## Required verification
Static/source:
- exact branch HEAD recorded;
- `node --check src/main/preload.js`;
- `node --check src/renderer/js/voice-render.js`;
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`;
- changed-file scope contains only approved source + canonical `.ai/` docs;
- inspect full source and diff after publication.

Owner runtime:
1. Open app and confirm sidebar order Home → Voice Render → Settings.
2. Enter Voice Render, then navigate Home/Settings and verify only one page remains active.
3. Render short Vietnamese text with OmniVoice default to a chosen WAV path.
4. Confirm audio plays and saved file opens.
5. If a saved clone voice exists, render the same text with it and confirm the expected clone voice is used.
6. Confirm existing P1/P2/P3 jobs/status are unchanged before and after rendering.

## Gates
- Execution: source demo published on review branch.
- Automated/static verification: WAITING until exact-head evidence is produced.
- Code review: WAITING final exact-head review.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS until dynamic `.ai/` files are updated.
- Merge permission: BLOCKED.
