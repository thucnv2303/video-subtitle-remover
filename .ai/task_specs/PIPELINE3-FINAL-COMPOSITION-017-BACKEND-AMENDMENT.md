# PIPELINE3-FINAL-COMPOSITION-017 — Backend Amendment

Status: APPROVED BY PM AFTER SOURCE CAPABILITY REVIEW

## Evidence requiring amendment
Existing `/api/adjust-video-tempo` retimes video with `setpts` but uses `-an`, so its output contains no original audio. That makes `fit_video` / `balanced` incompatible with the Owner-required background/original-audio mix. If P3 later extracts no-vocal background from the original unretimed source, that bed also drifts against a retimed video.

## Narrow allowed backend change
Allow `api/server.py` only for `/api/adjust-video-tempo`:
- when source has audio, retime audio by the same speed factor using FFmpeg `atempo` and encode AAC 192k;
- when source has no audio, keep the current video-only behavior;
- preserve source dimensions/FPS semantics and existing H.264 CRF 18 / preset fast video-retime quality;
- response reports whether source audio was preserved/retimed.

Pipeline 3 finalizer must call remove-vocal on the **actual videoForMix** (derived retimed video when applicable), not on `job.filePath`, so separated background remains synchronized.

No other backend routes may change in this amendment.

## Verification addition
```text
python -m py_compile api/server.py
```
Runtime must cover a fit-video/balanced case with non-zero original/background audio and confirm no missing-audio FFmpeg failure or obvious drift.
