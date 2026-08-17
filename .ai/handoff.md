# AgentOS Handoff Status

## Active task
`P3-PREVIEW-ASS-PARITY-031`

## Status
SOURCE PUBLISHED / OWNER VISUAL PARITY WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/P3-PREVIEW-ASS-PARITY-031`.
- Draft PR: #71.
- Application-source HEAD: `236b05261ecf1a40ad223324b759f84a499f062c`.
- Clean base: `review/P3-OUTPUT-ROOT-030-CLEAN@2f326af98d4344fc2ff460346e1a46cc96d136d5`.

## Why task 031 exists
Owner showed that P3 Preview subtitle geometry did not match the final rendered MP4. The Preview was visually too large and wrapped differently. The final ASS uses source-video logical pixels, while Preview needed to project those values through the fitted video scale.

## Current implementation
`src/renderer/js/pipeline3/preview-ass-parity.js` projects subtitle styling from logical video resolution to the Preview canvas and mirrors ASS-like wrap calculation.

`src/main/main-entry.js` bootstraps this parity layer without changing P3 export/audio logic.

## Owner test focus
Compare Preview and final MP4 for the same Job:
- relative font size;
- line wrapping;
- X/Y placement;
- outline/shadow;
- cover/background geometry.

Also sanity-check that P3 Demucs/export and the standalone `Xóa Sub` tab remain available.

## Queued task 032
Owner approved a follow-up after 031 PASS:
- P1: download results per Job;
- P2: download clean video per Job;
- P2: optional Demucs-strict no-vocal derivative `clean_video_no_vocal.mp4`;
- derivative must not mutate/replace canonical `clean_video.mp4` used by P3.

Do not start 032 before 031 Owner visual result is recorded.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: WAITING exact-head final review.
- Owner verification: WAITING.
- Documentation sync: PASS after docs publication.
- Merge permission: BLOCKED.

## Next permitted action
Owner runs task-031 visual parity test. If PASS, record evidence and activate task 032 on a new dedicated review branch. No merge.
