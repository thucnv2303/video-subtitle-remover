# Current Task

## Task ID
VOICE-RENDER-TAB-008

## Name
Standalone OmniVoice Voice Render Tab Demo

## Status
SOURCE_PUBLISHED_STATIC_AND_OWNER_RUNTIME_WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/VOICE-RENDER-TAB-008-demo`.
- Starting parent: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Exact spec: `.ai/task_specs/VOICE-RENDER-TAB-008.md`.
- Latest application-source correction: `8f50811e6578f41119714ce157eb3987d3b1ce63`.

## User outcome
Provide an independent Voice Render workspace directly below Home. The user can type text, choose OmniVoice/default or an existing clone voice, choose language and output WAV path, render, preview and open the file without entering any video-processing pipeline.

## Implemented
1. Added isolated renderer module `src/renderer/js/voice-render.js`.
2. Added isolated stylesheet `src/renderer/styles/voice-render.css`.
3. `src/main/preload.js` loads the new tool without changing `index.html` or legacy `app.js`.
4. The new sidebar item is inserted after Home and before Settings.
5. The page is mounted dynamically and owns only local render state.
6. Saved clone voices are read from existing `localStorage.tts_voices`; clone management remains in Settings.
7. Render uses existing `window.api.post('/api/tts/generate', ...)` and sends explicit `output_path` plus optional `ref_audio_path`.
8. `voice_name` is not sent so backend routing remains OmniVoice-only for this utility.
9. Existing Electron `saveFile` and `openPath` bridges are reused.
10. Idle/rendering/success/error states and duplicate-submit protection are implemented.
11. A navigation isolation fix removes the dynamic Voice Render page when an existing Home/Settings item is activated, avoiding dual-active pages caused by the legacy static NodeList snapshot.

## Explicitly unchanged
- no `api/server.py` change;
- no `api/tts_engine.py` change;
- no P1 source change;
- no P2 source change;
- no P3 source change;
- no shared Job/state change;
- no dependency change.

## Verification required
Static/source on exact final head:
- `node --check src/main/preload.js`;
- `node --check src/renderer/js/voice-render.js`;
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`;
- inspect exact changed-file scope and full source/diff.

Owner runtime after code review:
1. Sidebar order is Home → Voice Render → Settings.
2. Voice Render → Home/Settings navigation leaves exactly one active page.
3. Default OmniVoice renders a short Vietnamese sample to the chosen WAV location.
4. Audio player plays the generated output and Open file works.
5. If a saved clone voice exists, select it and confirm clone voice output.
6. P1/P2/P3 job/status state is unchanged before/after standalone render.
7. Error path remains retryable and does not alter pipeline state.

## Parent task relationship
`PIPELINE1-SEMANTIC-REMIX-007` / PR #48 remains separate upstream work. This demo does not satisfy or change its static, Owner Standard, Owner Semantic, P3, or merge gates.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: WAITING.
- Code review: IN PROGRESS.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS until handoff sync completes.
- Merge permission: BLOCKED.
