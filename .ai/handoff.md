# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
OWNER CORE RUNTIME PASS / CLONE REFERENCE-TRANSCRIPT CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.
- No Anti/external executor.

## Verified real-app evidence
Owner verified Voice Render mount/navigation, voice preview, sequential long-text rendering, 3/3 chunks, final WAV merge/playback and global status/log UI.

Latest runtime FAIL:
- completed rendered speech can omit roughly the first 3–5 target words from the actual spoken WAV content.

## Corrected investigation
- renderer splitting begins at source character 0;
- prior padding/silence hypothesis was rejected after Owner clarified the words are absent from the rendered speech itself;
- clone requests previously supplied reference audio without exact reference transcript;
- OmniVoice auto-transcribes reference audio when `ref_text` is absent and conditions target generation with reference text + target text;
- upstream OmniVoice issue #246 independently reports worse clone/pronunciation behavior without reference transcript.

## Published correction
- `api/tts_engine.py` restores normal OmniVoice generation defaults and decodes a bounded internal reference-transcript envelope for clone requests;
- decoded reference transcript is passed as OmniVoice `ref_text`; target text is restored exactly before generation;
- `voice-render-reference-fix.js` injects exact reference transcript into clone preview/render calls;
- clone form now requires exact audio-sample transcript;
- old clones missing an explicit transcript show `Thiếu transcript mẫu` + `+ Transcript` and fail closed until corrected;
- legacy generic `note` is not silently trusted as exact transcript;
- preload loads the transcript request guard before the existing Voice Render/profile wrappers.

## Retest sequence
1. Fetch exact final PR #50 HEAD and fully restart VSR.
2. For Adam/selected clone, if `Thiếu transcript mẫu` appears, click `+ Transcript` and enter exactly what the reference audio says.
3. Render a short Vietnamese sentence with unmistakable first 5–8 words at least 3 times with that clone.
4. Every completed WAV must contain the complete beginning.
5. Reconfirm one medium render/merge and distinct slow/fast profile duration behavior.
6. Confirm P1/P2/P3 state remains unchanged.

## Static verification
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-reference-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS — correction source published.
- Automated/static verification: WAITING.
- Code review: WAITING on final exact head.
- Owner runtime: PARTIAL PASS; clone leading-word retention RETEST WAITING.
- Documentation synchronization: PASS once PR metadata points to final exact head.
- Merge permission: BLOCKED.
