# VOICE-RENDER-SHARED-LIBRARY-009

## Goal
Upgrade Voice Render into an app-native workspace that matches the current navy/blue UI, shares one voice library with the main workflow, supports clone voices, and safely renders long text through sequential chunks.

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Draft PR: #50.
- Base: `review/VOICE-RENDER-TAB-008-demo@3164b6f625e06d4d8f4d88009fb9dea5c335198f`.
- Latest reviewed application-source commit: `066a7cc9b369abf992dd0840c336ad0edb17022a`.
- Execution authority: Project Manager direct GitHub implementation; no Anti/external executor.

## Owner-approved product contract
1. Use the same dark navy/blue visual system as the current app.
2. Voice Render remains outside P1/P2/P3 video Job execution, but uses the same voice library as the main workflow.
3. Clone voices created here are stored in existing `localStorage.tts_voices` and synchronized to Settings/Pipeline selectors.
4. Global App/Backend/TTS/GPU/CPU/RAM status is moved into the left sidebar and remains visible across tabs.
5. Voice Render lower-right area is a dedicated Log card.
6. Shared voice selection is a vertically scrollable list with an independent `Nghe thử` action; preview does not alter selection.
7. Long text is never sent as one unbounded request. It is split into bounded ordered chunks, rendered sequentially, then merged into one WAV.

## Published source scope
Only:
- `src/main/preload.js`
  - read-only local CPU/RAM/app/Electron information;
  - narrow `mergeWavFiles()` bridge using existing FFmpeg;
  - merge accepts only `.part-###.wav` files in the same directory and matching the selected final WAV stem;
  - successful merge performs only that constrained chunk cleanup.
- `src/renderer/js/voice-render.js`
  - app-native UI/state;
  - persistent sidebar status;
  - shared voice picker and independent preview;
  - clone creation into existing shared store;
  - deterministic long-text splitter, sequential queue, stop-after-current behavior, merge orchestration and result state;
  - Voice Render log card.
- `src/renderer/styles/voice-render.css`
  - current-app navy/blue design language;
  - expanded global sidebar suitable for persistent status;
  - three-column Voice Render layout;
  - scrollable voice list, queue, result, log and clone modal states.

No source change to `api/server.py`, `api/tts_engine.py`, P1/P2/P3 implementation, shared video Job/gates or dependencies.

## Shared voice contract
- Canonical clone store remains `localStorage.tts_voices`.
- Existing schema remains compatible: `name`, `language`, `audioPath`, optional `audioFile`, `samplePath`, `note`, `date`.
- Saving a clone refreshes known selectors: `#tts-voice`, `#job-tts-voice`, `#step1-tts-voice`, and existing Settings saved-voice rendering when available.
- Voice preview freezes no selection state and cannot silently select a voice.
- Selected voice is read only when a render run begins.

## Long-text contract
### Split
Configurable target: 1,200 / 1,800 / 2,500 / 3,500 characters.

When `Giữ đoạn văn` is enabled, split priority is:
1. paragraph boundary;
2. sentence boundary;
3. newline;
4. whitespace;
5. hard split only when no safe boundary is available.

When it is disabled, paragraph/newline preference is skipped but sentence/whitespace/hard fallback remains.

`Tự chia chunk` may be disabled only when input length is within the selected chunk ceiling. Larger text is rejected before run start.

### Queue
- exactly one chunk request at a time;
- same frozen voice/language for the whole run;
- each chunk uses existing `POST /api/tts/generate` and writes `<final-stem>.part-###.wav`;
- one chunk failure stops the queue and prevents final success;
- `Dừng` sets a stop request: the current synchronous TTS request may finish, but no later chunk starts;
- a new run clears the previous result state so old output cannot be presented as the new run result.

### Merge
Renderer calls preload `mergeWavFiles(orderedChunkPaths, finalOutputPath)`.

The bridge:
- accepts only final `.wav` output;
- requires every chunk path to exist;
- requires each input to be in the same directory and match `<final-stem>.part-###.wav`;
- merges in supplied order using FFmpeg concat -> PCM WAV;
- fails closed on missing/unsafe chunk or FFmpeg error;
- cleans only validated owned chunk files after successful merge;
- returns final `output_path`; cleanup warnings do not invalidate an already successful final WAV.

## Status / logging contract
Global sidebar values must be real or explicitly unavailable; never fake metrics.

Voice Render Log keeps a bounded recent list and supports filter/copy/clear. It logs run/chunk/stop/merge/preview/clone events but never raw full long-text payloads or secrets.

## Acceptance criteria
1. UI matches current app navy/blue design language.
2. Global status card remains visible on Home, Voice Render, Pipeline/Settings pages.
3. Voice Render shows result + scrollable voice list + Log card.
4. Every voice can be previewed before selection; preview does not alter selected voice.
5. Clone saved here appears in the existing shared voice selectors without app restart.
6. Several-thousand-word text becomes multiple bounded sequential chunks.
7. No later chunk starts after Stop is requested and current request returns.
8. Missing/failed chunk prevents merge success.
9. Successful merge preserves supplied order and returns one final WAV.
10. Starting a new run clears stale prior result state.
11. Voice Render never creates/mutates video Jobs, P1/P2/P3 gates or pipeline artifacts.
12. No unrelated source/dependency change.

## Required exact-head static verification
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `git diff --check 3164b6f625e06d4d8f4d88009fb9dea5c335198f..HEAD`
- verify PR changed-file list is exactly the 3 approved application files plus canonical `.ai/` documentation updates.

PM verification environment cannot currently resolve GitHub over direct git/curl, so exact local command output remains WAITING until run from the Owner-test worktree or CI.

## Owner runtime test
Use `E:\Project AI\Video-sub-remove-owner-test-P1` on the exact final PR #50 HEAD.

Verify:
1. global status remains visible switching Home -> Voice Render -> Settings/Pipeline;
2. Voice Render visually matches current app;
3. scroll voice list, preview at least two voices, verify selection remains unchanged until explicit choose;
4. create one clone and verify it appears in Voice Render plus Settings/Pipeline selectors without restart;
5. short Vietnamese render succeeds;
6. long Vietnamese text of several thousand words renders as sequential chunks and merges into one WAV;
7. Stop prevents subsequent chunks after current request returns;
8. Log reflects progress without dumping raw full text;
9. P1/P2/P3 Job/status/gates remain unchanged.

## Gates
- Execution: PASS for published source scope.
- Automated/static verification: WAITING.
- Code review: PASS logic/scope on application source through `066a7cc9b369abf992dd0840c336ad0edb17022a`.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS until dynamic files and PR body are updated.
- Merge permission: BLOCKED.
