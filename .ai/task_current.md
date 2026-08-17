# Current Task

## Task ID
P3-PREVIEW-ASS-PARITY-031

## Status
SOURCE_PUBLISHED_OWNER_VISUAL_VERIFY_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/P3-PREVIEW-ASS-PARITY-031`.
- Draft PR: #71.
- Application-source HEAD: `236b05261ecf1a40ad223324b759f84a499f062c`.
- Clean task base: `2f326af98d4344fc2ff460346e1a46cc96d136d5`.

## User outcome
What the user sees in the P3 subtitle editor must correspond to the final rendered subtitle relative to the source video resolution. Preview must not treat logical-video subtitle pixels as unscaled screen CSS pixels.

## Implementation contract
Logical video resolution is the single coordinate space for subtitle geometry. Preview projects that geometry into the fitted video canvas.

Required parity dimensions:
- font size;
- outline/stroke;
- shadow;
- letter spacing;
- padding;
- max-width and line wrapping;
- cover/background dimensions;
- subtitle position relative to the video canvas.

Final ASS remains authoritative for export and continues to use source-video `PlayResX/PlayResY`.

## Acceptance criteria
1. Use the same source Job for Preview and final render.
2. Preview subtitle size is proportional to source video resolution.
3. Final render and Preview have materially matching line count/wrapping.
4. Position is materially matching relative to the video frame.
5. Outline/shadow/background scale is materially matching.
6. P3 audio, Demucs, output path and export IPC behavior remain working.
7. Standalone `Xóa Sub` remains present.

## Required static verification
On the exact checkout:
```text
node --check src/renderer/js/pipeline3/preview-ass-parity.js
node --check src/main/main-entry.js
git diff --check 2f326af98d4344fc2ff460346e1a46cc96d136d5..HEAD
```

## Queued task after PASS
`P1-P2-PER-JOB-EXPORT-NOVOCAL-032`:
- P1 per-Job artifact download;
- P2 per-Job clean-video download;
- P2 optional Demucs-strict no-vocal derivative;
- never overwrite canonical P2 clean video;
- no weak vocal-removal fallback.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: WAITING final exact-head review.
- Owner runtime: WAITING.
- Documentation synchronization: PASS after docs publication.
- Merge: BLOCKED.

## Next action
Owner visual parity test on task 031. Only after Owner PASS may task 032 become active on its own branch. No merge.
