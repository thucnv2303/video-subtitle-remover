# VOICE-RENDER-SHARED-LIBRARY-009

## Goal
Upgrade the current Voice Render demo into an app-native Voice Render workspace that matches the approved current UI language, shares one voice library with the main workflow, supports clone-voice management and reliable long-text TTS, and exposes persistent app/system status in the global sidebar.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/VOICE-RENDER-TAB-008-demo`.
- Draft PR: #49.
- Starting exact HEAD for this revision: `b0bcacc4595403bd7b2ea108922ef9a9608316a2`.
- Parent P1 review remains `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb` and is independently unverified.
- Execution authority: Project Manager direct GitHub implementation. No Anti/external executor.

## Owner-approved product decisions
1. Voice Render must use the same dark navy/blue visual language as the current application, not a separate design system.
2. Voice Render remains a separate workspace from P1/P2/P3 Job execution, but its voice library is shared with the main workflow.
3. Clone voices created in Voice Render must immediately become available to Settings/Pipeline voice selectors through the existing shared `tts_voices` store.
4. The app/system status panel is global UI: move it into the left sidebar and keep it visible on every tab.
5. The freed lower-right Voice Render area becomes a `Log` card.
6. Voice selection uses a vertically scrollable list. Every voice can be previewed before selection; preview must not silently change the selected voice.
7. Long text must be processed as a bounded sequential chunk queue and merged into one final audio file rather than sending thousands of words in one TTS request.

## User outcome
From `Voice Render`, the user can:
- enter short or very long text;
- see character/word estimates, predicted chunk count and estimated duration;
- choose language, speed/tone UI and a shared voice;
- preview any voice without selecting it;
- create a clone voice from reference audio and save it into the shared library;
- render long text as a visible sequential chunk queue;
- stop after the current chunk without corrupting completed work;
- merge successful chunk WAV files into one final WAV;
- play/open the final audio;
- inspect Voice Render logs;
- always see real app/backend/TTS/GPU/CPU/RAM status in the left sidebar.

## Existing source facts to preserve
- `POST /api/tts/generate` already accepts `text`, `ref_audio_path`, `language`, `output_path`, and `voice_name`.
- OmniVoice clone routing already uses `ref_audio_path`.
- Existing Settings clone storage is `localStorage.tts_voices`.
- Existing Settings dropdown synchronization already targets `#tts-voice`, `#job-tts-voice`, and `#step1-tts-voice`.
- Existing `window.api.testTTS()` / `generateTTS()` can render voice previews.
- Existing `window.addLog()` remains the app-wide log sink.
- Backend already depends on FFmpeg for other audio/video operations; no new dependency is required for audio concatenation.

## Approved source scope
Application/backend source may change only in these areas unless a new PM review decision expands scope:
- `src/main/preload.js`
  - expose read-only local system metrics needed by the persistent sidebar card (CPU model/load snapshot, RAM total/free, platform); no filesystem mutation.
- `src/renderer/js/voice-render.js`
  - app-native Voice Render UI/state;
  - persistent sidebar status card mount/update;
  - shared voice picker + preview;
  - clone-voice creation/storage sync;
  - long-text splitter/queue/render/stop/merge orchestration;
  - Voice Render log card.
- `src/renderer/styles/voice-render.css`
  - styling aligned to the current navy/blue app visual system;
  - global sidebar status card styles;
  - scrollable voice list, queue, result and log states.
- `src/renderer/js/components/settings.js`
  - narrow shared-library synchronization only: respond to a same-window `tts-voices-updated` event by re-rendering saved voices and refreshing known voice selectors.
- `api/server.py`
  - one narrow TTS audio merge contract for ordered successful WAV chunks; no change to P1/P2/P3 processing.

## Forbidden source scope
- no P1 reasoning/semantic/artifact logic changes;
- no P2 inpaint/subtitle-removal changes;
- no P3 final-composition changes;
- no shared video Job/state/gate changes;
- no TTS model rewrite in `api/tts_engine.py`;
- no dependency/package churn;
- no broad app.js/index.html redesign unless later PM review proves the dynamic integration cannot meet the approved UI safely.

## UI contract
### Global sidebar
Persistent on every page:
- Backend/app status;
- TTS engine status;
- GPU identity/status from existing `/api/gpu-info`;
- CPU and RAM from read-only Electron/preload system metrics;
- unavailable values render `—` / `Không khả dụng`; never fake green success or invented percentages.

### Voice Render page
Use the current application’s dark navy cards, blue borders/highlights and purple primary CTA language.

Three-column desktop layout:
1. `Cấu hình render`
   - title/name;
   - language;
   - speed/tone controls;
   - long-text editor;
   - word/character/duration/chunk estimates;
   - long-text controls;
   - preview + render CTAs.
2. `Hàng đợi & Tiến trình`
   - one row per chunk;
   - states: waiting, rendering, success, error, stopped;
   - current progress and completed count;
   - stop button.
3. Right stack
   - output/result card;
   - scrollable shared voice list;
   - Voice Render log card.

### Shared voice list
Each row contains:
- voice name;
- type (`Mặc định`, system/neural, or `Clone`);
- language/tone metadata when available;
- `Nghe thử` action;
- explicit radio/check selection control.

Rules:
- preview audio never changes selected voice;
- duplicate preview clicks are blocked while a preview request is active;
- selected voice is used only when Render starts;
- shared clone changes update Settings/Pipeline selectors without app restart.

### Clone Voice
Voice Render may expose a compact management subview/modal containing:
- clone name;
- language;
- reference audio picker;
- optional reference transcript/notes for metadata only in this MVP;
- `Phân tích/Nghe thử` using existing TTS generation;
- `Lưu vào thư viện chung` only after a valid audio path and successful preview/sample generation.

Stored voice remains compatible with the existing schema (`name`, `language`, `audioPath`, optional sample/date metadata). No second private Voice Render store is allowed.

## Long-text architecture
### Splitting
Do not send the full multi-thousand-word text as one TTS request.

Renderer creates deterministic ordered chunks using this priority:
1. paragraph boundaries;
2. sentence boundaries;
3. whitespace boundaries;
4. hard split only for a single pathological span that exceeds the configured maximum.

Default target is a bounded character budget suitable for stable TTS requests; UI may expose preset sizes. The split must preserve original order and must not drop or duplicate non-whitespace text.

### Queue execution
- render sequentially, one chunk at a time, to avoid concurrent OmniVoice/GPU contention;
- use the same frozen voice/language/settings snapshot for all chunks in one run;
- write chunk files to a dedicated temporary/run folder beside or under the chosen output location;
- completed chunks are immutable within that run;
- one chunk failure stops the queue and keeps completed evidence/logs;
- `Dừng` sets `stopRequested`; the current synchronous TTS request may finish, then no later chunk starts;
- no claim of mid-request cancellation unless a real backend cancellation contract is later added.

### Merge
Add narrow `POST /api/tts/merge` (or equivalent exact path selected during implementation review):
- input: ordered existing chunk WAV paths + final output WAV path;
- validate non-empty list and path existence;
- merge in the supplied order using existing FFmpeg availability;
- fail closed if merge fails;
- never silently skip a failed/missing chunk;
- return final `audio_path` on success.

The final result is accepted only if every intended chunk succeeded and merge succeeded.

### Estimates
UI estimates are telemetry, not guarantees:
- word/character count is exact;
- chunk count is exact after splitting;
- duration estimate uses a documented heuristic and is labeled `ước tính`;
- real final audio duration is read from the generated result when available, not inferred as truth from the estimate.

## Logging contract
Voice Render log card records bounded recent entries for:
- run start/config snapshot without sensitive paths beyond user-visible output path;
- chunk start/success/failure;
- stop request;
- merge start/success/failure;
- voice preview/clone save outcome.

Controls:
- filter all/info/success/warn/error;
- copy;
- clear.

Do not log raw full long-text payloads or secrets.

## Runtime states
- Idle: editable controls, queue empty/result optional previous success.
- Previewing voice: only preview action locked; selected voice unchanged.
- Rendering: run configuration frozen; duplicate render blocked.
- Stopping: current chunk may finish; no new chunk starts.
- Failed: failed chunk visible, completed chunks preserved, no final success result claimed.
- Success: all chunks + merge success; audio/result actions enabled.

## Acceptance criteria
1. Voice Render visually matches the current navy/blue application design.
2. Global system/app status card is in the left sidebar and remains visible on Home, Voice Render and Settings/Pipeline pages.
3. Global status shows only real/available values; unavailable metrics are explicit.
4. Voice Render lower-right area contains a functional Log card instead of the former page-local system-status card.
5. Voice list is vertically scrollable and can show more voices without expanding page height.
6. Every voice has an independent preview action; preview does not alter selection.
7. Clone voice saved from Voice Render appears in the existing Settings/Pipeline voice selectors without restart.
8. Deleting/updating shared voices through existing Settings remains reflected when Voice Render refreshes/receives the shared-library event.
9. Text of several thousand words is split deterministically into multiple bounded chunks with no dropped/duplicated content.
10. Only one TTS chunk runs at a time.
11. Stop prevents later chunks from starting and does not claim cancellation of an already-running synchronous request.
12. Final output is produced only after all intended chunks succeed and ordered merge succeeds.
13. A failed/missing chunk prevents final success/merge acceptance.
14. Empty text and invalid output path are rejected before queue start.
15. Voice Render does not create/mutate video Jobs or P1/P2/P3 gates/artifacts.
16. No unrelated backend/Pipeline/source/dependency changes.

## Required static verification
On final exact HEAD:
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/components/settings.js`
- `python -m py_compile api/server.py`
- `git diff --check b0bcacc4595403bd7b2ea108922ef9a9608316a2..HEAD`
- inspect final changed-file list, PR diff and full changed source files.

Deterministic logic verification must cover:
- paragraph/sentence/whitespace split ordering;
- pathological overlong span fallback;
- exact text preservation modulo normalized boundary whitespace;
- 1 chunk, many chunks and empty input;
- stop-after-current behavior;
- failed chunk blocks merge;
- merge preserves supplied chunk order;
- preview does not change selected voice.

## Owner runtime test
1. Open the exact final PR head in `E:\Project AI\Video-sub-remove-owner-test-P1`.
2. Verify global status sidebar remains visible while switching Home → Voice Render → Settings → Home.
3. Verify Voice Render layout/colors match the current app language.
4. Scroll through the shared voice list; preview at least two voices and verify selection does not change until explicitly chosen.
5. Create one clone voice, save it, then verify it appears in Voice Render and Settings/Pipeline voice selectors without app restart.
6. Render short Vietnamese text successfully.
7. Render a long Vietnamese text of several thousand words; verify multiple sequential chunks, visible queue/log progression and one merged final WAV.
8. Trigger Stop during a multi-chunk run; verify no later chunk starts after the current request returns.
9. Confirm Voice Render does not create/change video Jobs, P1/P2/P3 status/gates or artifacts.

## Gates
- Execution: NOT STARTED for task 009 source revision.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS until ACTIVE/current_state/task_current/handoff are updated.
- Merge permission: BLOCKED.
