# Current Task

## Task ID
VOICE-RENDER-SHARED-LIBRARY-009

## Status
OWNER_CORE_RUNTIME_PASS_CLONE_REFERENCE_TRANSCRIPT_RETEST_WAITING

## Authority
- Single active branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Execution: Project Manager direct GitHub edits only.

## Verified Owner observations
PASS:
- Voice Render mounts/navigation.
- voice preview works.
- `Render toàn bộ` works.
- 3/3 sequential chunks complete.
- final WAV merge succeeds and plays.

Runtime FAIL to close before task completion:
- completed clone/rendered speech can omit roughly the first 3–5 supplied words from the spoken WAV content.

## Verified implementation facts
- `splitLongText()` starts from source character 0; renderer has no intentional prefix removal.
- clone requests previously supplied reference audio without exact reference transcript.
- OmniVoice auto-transcribes the reference audio when `ref_text` is absent and conditions generation using reference text + target text.
- upstream OmniVoice issue #246 reports poorer clone/pronunciation behavior when reference audio is used without reference transcript.

## Published correction
- previous unverified padding/postprocess workaround removed.
- `api/tts_engine.py` decodes a bounded internal reference-transcript envelope and supplies the decoded value as OmniVoice `ref_text` for clone generation.
- target text is restored exactly before `model.generate()`; envelope metadata is never spoken.
- new `src/renderer/js/voice-render-reference-fix.js` injects exact clone transcript into `/api/tts/generate` requests.
- new clone preview/save requires `Transcript chính xác của audio mẫu`.
- existing clone with no explicit transcript is marked `Thiếu transcript mẫu` and receives `+ Transcript`.
- generic old `note` is not automatically trusted as transcript.
- clone generation fails closed when exact transcript is unavailable.
- preload loads this guard before the normal Voice Render/profile wrappers.

## Required static verification
On final PR #50 HEAD:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-reference-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Owner retest
1. Fully close VSR/Electron and launch exact final PR #50 HEAD.
2. For Adam/selected clone, if `Thiếu transcript mẫu` appears, click `+ Transcript` and enter exactly what is spoken in the reference audio.
3. Use a short Vietnamese target whose first 5–8 words are unmistakable.
4. Preview/render the clone at least 3 times; every completed audio must contain the exact beginning.
5. Render a medium target once and confirm merge/playback remains correct.
6. Recheck a slow and faster voice profile still produce different real durations in the expected direction.
7. Confirm no P1/P2/P3 state mutation.

## Gates
- Execution: PASS — source correction published.
- Automated/static: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; clone leading-word retention RETEST WAITING.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
