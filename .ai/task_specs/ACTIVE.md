# Active PM Execution Spec

Status: P3_PREVIEW_ASS_PARITY_031_OWNER_VISUAL_VERIFY_WAITING

Task: `P3-PREVIEW-ASS-PARITY-031`
Repository: `thucnv2303/video-subtitle-remover`
Branch: `review/P3-PREVIEW-ASS-PARITY-031`
Draft PR: #71
Application-source HEAD: `236b05261ecf1a40ad223324b759f84a499f062c`
Clean base: `2f326af98d4344fc2ff460346e1a46cc96d136d5`

## Purpose
Make P3 subtitle Preview and final ASS render use one geometry contract based on the real source-video resolution.

## Product contract
Subtitle settings are logical-video values. The browser Preview is only a scaled projection into the fitted video canvas. Final ASS remains the export authority using source-video `PlayResX/PlayResY`.

## Scope
- Preview typography scale.
- Preview stroke/shadow/spacing/padding scale.
- Preview max-width and ASS-like line wrapping.
- Preview cover geometry scale.
- No intended P3 audio/Demucs/export behavior change.
- No P1/P2 behavior change.

## Acceptance
Owner compares the same Job in Preview and final MP4. Large differences in size, wrap, placement or cover geometry are FAIL. Small browser/libass rasterization differences are acceptable.

## Static verification
```text
node --check src/renderer/js/pipeline3/preview-ass-parity.js
node --check src/main/main-entry.js
git diff --check 2f326af98d4344fc2ff460346e1a46cc96d136d5..HEAD
```

## Follow-up queued, not active
`P1-P2-PER-JOB-EXPORT-NOVOCAL-032` after Owner PASS:
- per-Job P1 artifact download;
- per-Job P2 clean-video download;
- optional Demucs-only P2 no-vocal derivative;
- canonical P2 clean video remains untouched and remains P3 authority.

## Gates
Execution PASS; static WAITING; code review WAITING final exact-head review; Owner WAITING; docs sync PASS after publication; merge BLOCKED.

## Next action
Owner visual parity test only. Do not start task 032 or merge until the task-031 Owner result is recorded.
