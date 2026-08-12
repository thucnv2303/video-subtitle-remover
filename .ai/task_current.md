# Current Task

## Task ID
VOICE-RENDER-TAB-008

## Name
Standalone OmniVoice Voice Render Tab Demo

## Status
PM_CODE_REVIEW_PASS_OWNER_RUNTIME_READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/VOICE-RENDER-TAB-008-demo`.
- Draft PR: #49.
- Starting parent: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- Exact spec: `.ai/task_specs/VOICE-RENDER-TAB-008.md`.
- Latest application-source commit: `dabac98867fc82c090fc5b3809a083085654b839`.

## User outcome
Provide an independent Voice Render workspace directly below Home. User can type text, choose language, use OmniVoice default or an existing clone voice, choose a WAV output path, render, preview and open the file without entering any video-processing pipeline.

## Implemented
1. Added isolated renderer module `src/renderer/js/voice-render.js`.
2. Added isolated stylesheet `src/renderer/styles/voice-render.css`.
3. `src/main/preload.js` loads the tool without modifying legacy `index.html`/`app.js` routing source.
4. Sidebar item is inserted after Home and before Settings.
5. Page owns local render state only.
6. Saved clone voices reuse existing `localStorage.tts_voices`; clone management remains in Settings.
7. Render uses existing `window.api.post('/api/tts/generate', ...)` with explicit `output_path` and optional clone `ref_audio_path`.
8. `voice_name` is intentionally omitted so this standalone utility remains OmniVoice-only.
9. Existing Electron `saveFile` and `openPath` bridges are reused.
10. Idle/rendering/success/error states and duplicate-submit protection are implemented.
11. Navigation lifecycle correction ensures returning to Home/Settings removes the dynamic Voice Render page from active state.
12. Engine badge now reads real TTS availability via existing `getTTSStatus()`.

## Explicitly unchanged
- no `api/server.py` change;
- no `api/tts_engine.py` change;
- no P1 source change;
- no P2 source change;
- no P3 source change;
- no shared Job/state change;
- no dependency change.

## Review evidence
- PR #49 exact source/full files and source patches reviewed.
- Changed application scope matches exactly the three allowed files.
- `node --check src/main/preload.js`: PASS.
- `node --check src/renderer/js/voice-render.js`: PASS.
- No unresolved PR review threads.
- No GitHub workflow runs/status checks are configured.
- Exact `git diff --check` remains WAITING because the verification container cannot resolve GitHub for a repository clone. Do not reinterpret this missing evidence as PASS.

## Owner runtime scenario — READY
1. Confirm sidebar order Home → Voice Render → Settings.
2. Open Voice Render, then Home/Settings; exactly one page must remain active.
3. Confirm engine badge reflects OmniVoice/backend state rather than permanent green.
4. Render short Vietnamese text with OmniVoice default to a chosen WAV location.
5. Confirm result audio plays and Open file works.
6. If a saved clone exists, render same text with it and confirm expected clone voice.
7. Confirm P1/P2/P3 job/status state is unchanged before and after standalone render.
8. Trigger/recover from a controlled error if convenient; pipeline state must remain unchanged.

## Parent task relationship
`PIPELINE1-SEMANTIC-REMIX-007` / PR #48 remains separate upstream work. This demo does not satisfy or change its static, Owner Standard, Owner Semantic, P3, or merge gates.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING/PARTIAL — Node syntax PASS, exact diff-check evidence missing.
- Code review: PASS logic/scope.
- Owner visual/runtime verification: NOT STARTED — READY.
- Documentation synchronization: PASS after final handoff/ACTIVE sync.
- Merge permission: BLOCKED.
