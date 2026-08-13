# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Name
Voice Render Shared Library + Long Text

## Status
PM_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Draft PR: #50.
- Base SHA: `3164b6f625e06d4d8f4d88009fb9dea5c335198f`.
- Exact spec: `.ai/task_specs/VOICE-RENDER-SHARED-LIBRARY-009.md`.
- Latest reviewed application-source commit: `066a7cc9b369abf992dd0840c336ad0edb17022a`.
- Execution: Project Manager direct GitHub edits; no Anti/external executor.

## Implemented
1. App-native Voice Render three-column workspace in current navy/blue design language.
2. Global sidebar status for Backend/TTS/GPU/CPU/RAM/app version using real APIs/system data or explicit unavailable state.
3. Scrollable shared voice list with explicit selection and independent preview.
4. Clone Voice modal saving into existing `localStorage.tts_voices` and refreshing known Settings/Pipeline voice selectors.
5. Long-text word/character/duration/chunk estimates.
6. Deterministic paragraph/sentence/whitespace/hard-fallback chunk splitting.
7. Sequential one-chunk-at-a-time TTS queue using existing `/api/tts/generate`.
8. Stop-after-current behavior without claiming cancellation of an in-flight synchronous TTS request.
9. Constrained FFmpeg WAV merge bridge in preload; only matching owned `.part-###.wav` chunks may be merged/cleaned.
10. New runs clear previous result state before processing.
11. Dedicated bounded Voice Render Log with filter/copy/clear.

## Explicitly unchanged
- P1 reasoning/artifact source;
- P2 subtitle-removal/inpaint source;
- P3 finalize source;
- shared video Job/status/gates;
- `api/server.py` and `api/tts_engine.py`;
- dependencies/package files.

## PM review findings corrected
- Removed broad arbitrary renderer file deletion.
- Normalized clone language labels for backend requests.
- Prevented long text from bypassing chunking when it exceeds the selected safe ceiling.
- Wired `Giữ đoạn văn` to actual split behavior.
- Reset prior result at every new run.

## Required exact-head static verification
From Owner-test worktree on final PR #50 HEAD:
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `git diff --check 3164b6f625e06d4d8f4d88009fb9dea5c335198f..HEAD`

No PASS may be claimed from missing output. ChatGPT verification container cannot currently resolve GitHub git/raw network.

## Owner runtime — after static PASS
1. Confirm global status card remains visible across Home / Voice Render / Settings or Pipeline navigation.
2. Confirm layout/color language matches current app.
3. Scroll voice list; preview at least two voices; selected voice must not change until explicit selection.
4. Create one clone voice and confirm it appears in shared selectors without restart.
5. Render short Vietnamese text.
6. Render several-thousand-word Vietnamese text; verify multiple sequential chunks and one merged WAV.
7. Press Stop during a multi-chunk run; current request may finish, but no later chunk starts.
8. Verify Log states and no raw full text dump.
9. Confirm video Jobs/P1/P2/P3 state remains unchanged.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING.
- Code review: PASS logic/scope.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
