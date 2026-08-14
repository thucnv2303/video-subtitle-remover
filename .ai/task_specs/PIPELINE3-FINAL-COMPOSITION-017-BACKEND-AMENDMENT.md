# PIPELINE3-FINAL-COMPOSITION-017 — Backend Amendment

Status: SUPERSEDED — BACKEND CHANGE NOT REQUIRED FOR REVISION 017

## Original finding
Existing `/api/adjust-video-tempo` retimes video with `setpts` and uses `-an`, so its derived video contains no original audio. A naive `fit_video` / `balanced` implementation would therefore lose or desynchronize requested background/original audio.

## Verified safer solution using existing contracts
No `api/server.py` change is needed in Revision 017.

Current source already exposes `window.electronAPI.applyVoiceTempo`, backed by FFmpeg `atempo`. Revision 017 therefore uses these rules:
- if video is retimed and background volume is `0`, derived video may remain video-only before TTS is attached;
- if video is retimed and `Remove original vocal` is ON, P3 separates the background bed from the unretimed clean source, then applies the **same video speed factor** to that derived background audio before mixing it with the retimed video;
- if video is retimed, background/original volume is >0, and `Remove original vocal` is OFF, P3 blocks that explicit plan because the current engine has no safe generic original-audio extraction/retime contract;
- `auto` falls back to safe voice-only fit when that avoids this conflict.

This preserves the narrow-source rule and avoids changing a large backend file without necessity.

## Result
- `api/server.py`: unchanged.
- no additional backend verification command is required for Revision 017.
- Owner runtime must still test one video-retime case with `Remove original vocal` ON and non-zero background volume, and one blocked original-audio/video-retime combination.
