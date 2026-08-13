# AgentOS Handoff Status

## Active task
`VOICE-RENDER-SHARED-LIBRARY-009 — Voice Render Shared Library + Long Text`

## Status
AUDIO QUALITY CORRECTION PUBLISHED / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Single active Voice Render branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`.
- Single active Voice Render Draft PR: #50.
- Base: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`.
- PR #49: CLOSED/OBSOLETE.
- Owner-test worktree: `E:\Project AI\Video-sub-remove-owner-test-P1`.

## Verified evidence
Previously working: Voice Render mount/navigation, shared voice list, preview, sequential long-text render, final WAV merge/playback, status/log UI.

Current quality incident:
- Owner supplied a generated clone WAV containing locally distorted/incorrect-sounding sections.
- waveform inspection found repeated near-full-scale/clipping clusters inside rendered speech.
- issue is not explained by final concat alone.

## Published correction
- OmniVoice clone speed is applied natively inside `model.generate(speed=...)`.
- no renderer-path FFmpeg time-stretch is applied to completed WAV chunks; preload keeps a no-op compatibility function only.
- OmniVoice WAV output is scaled to 0.92 peak before PCM16 write.
- synthetic legacy clone speed migration is neutralized to 1.00x unless a speed is explicitly user-created.
- outer Voice Render chunk choices are 300/450/600 chars, default 450; existing sentence/paragraph-aware splitter remains authoritative.
- transcript/ref_text conditioning stays removed.

## Retest sequence
1. Fetch final exact PR #50 HEAD and fully restart VSR.
2. Confirm Adam does not require transcript.
3. Confirm chunk options 300/450/600, default 450.
4. Render known medium text using Adam and listen through the full result.
5. Verify correct content/timbre and absence of obvious distorted/crackling syllables.
6. Verify whether the earlier first-3–5-word omission still reproduces.
7. Reconfirm final merge/playback.

## Static verification
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/renderer/js/voice-render.js`
- `node --check src/renderer/js/voice-render-owner-fixes.js`
- `node --check src/renderer/js/voice-render-quality-fix.js`
- `python -m py_compile api/tts_engine.py`
- `git diff --check 0b3ee3a63f06d17334b2c295491c50039326febb..HEAD`

## Gates
- Execution: PASS.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner runtime: RETEST WAITING.
- Documentation synchronization: PASS once PR metadata points at the final docs head.
- Merge permission: BLOCKED.
