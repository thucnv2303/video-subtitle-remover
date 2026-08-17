# Current State

## Status
P3-PREVIEW-ASS-PARITY-031 — SOURCE PUBLISHED / PR #71 DRAFT / CODE REVIEW IN PROGRESS / OWNER VISUAL PARITY WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/P3-PREVIEW-ASS-PARITY-031`.
- Active Draft PR: #71.
- Exact application-source HEAD before this docs sync: `236b05261ecf1a40ad223324b759f84a499f062c`.
- Clean base: `review/P3-OUTPUT-ROOT-030-CLEAN@2f326af98d4344fc2ff460346e1a46cc96d136d5`.

## Verified runtime state before task 031
Owner runtime has already established:
- absolute video path / preview / ASR path flow: working;
- Demucs vocal separation: working;
- P3 export IPC bridge: working after main-process IPC migration;
- P3 output to drive-root path: working after root-directory guard;
- P3 final render reaches subtitle burn and produces output;
- standalone `Xóa Sub` integration must remain present in the test stack.

## Active defect
P3 subtitle Preview and final ASS render did not visually match. Final output used logical video pixels through ASS `PlayResX/PlayResY`, while Preview treated the same values too directly as CSS pixels and wrapped text differently.

## Task 031 source contract
Subtitle geometry is defined in logical video space (`videoWidth` / `videoHeight`). Preview is only a projection of that space using the fitted video canvas scale.

The Preview parity layer now derives from the same logical values used by final ASS for:
- font size;
- outline/stroke;
- shadow;
- letter spacing;
- padding;
- max width / wrap calculation;
- cover width/height;
- cue text wrapping.

Final ASS/export/audio/Demucs behavior is not intentionally changed by task 031.

## Owner acceptance still required
Use the same source video and compare Preview against the rendered MP4 for:
1. subtitle relative size versus video resolution;
2. X/Y placement;
3. line count / wrapping;
4. outline/shadow visual scale;
5. cover/background geometry when enabled.

Small rasterization differences between browser text and libass may be acceptable; large geometry or wrapping differences are not.

## Queued task 032 — not active yet
Owner approved the next product task after 031 passes:
- P1: per-Job artifact download actions;
- P2: per-Job `clean_video.mp4` download action;
- P2: optional Demucs-strict derivative `clean_video_no_vocal.mp4`;
- P2 no-vocal derivative must not overwrite canonical `clean_video.mp4` or change P3 input authority;
- no librosa fallback for the no-vocal derivative.

Task 032 must use a dedicated branch after task 031 Owner visual verification and state synchronization.

## Gates
- Execution: PASS for task 031 source publication.
- Automated/static verification: WAITING exact local checkout evidence.
- Code review: WAITING final review on current exact HEAD.
- Owner manual visual verification: WAITING.
- Documentation synchronization: PASS after this docs commit completes.
- Merge permission: BLOCKED.

## Local safety
Reuse only `E:\Project AI\Video-sub-remove-owner-test-LONG012`. Before switching, `git status --short` must be empty. Dirty => STOP. Do not reset/restore/clean over uncommitted Owner work.

## Next permitted action
Owner tests exact task-031 head for Preview ↔ final visual parity. If PASS, record Owner result, complete static/code-review gates, then activate task 032 on a dedicated review branch. No merge yet.
