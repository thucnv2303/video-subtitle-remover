# Active PM Execution Spec

Status: READY_FOR_ANTI_EXECUTION

Task:
`PIPELINE2-MANUAL-REGION-REVISION-002`

Parent task:
`PIPELINE2-RUNTIME-REVISION-001` — Owner retest completed with runtime improvements verified, but manual-region correctness and Console compactness require revision.

Repository:
`thucnv2303/video-subtitle-remover`

Authority branch / current P2 checkpoint:
- Branch: `review/PIPELINE2-APPROVED-UI-001`
- Draft PR: #42
- Stacked base under PR #42: `review/BUG-005-P1-FULL-CHAIN` at `97d5a13e77b6919931c251c74fab4c191fa04cec`
- PM review basis before this task publication: `186c9726d88a99f4438b77002b1487077c0ce712`

New review branch required:
`review/PIPELINE2-MANUAL-REGION-REVISION-002`

Execution / acceptance spec:
`.ai/task_specs/PIPELINE2-MANUAL-REGION-REVISION-002.md`

Owner retest findings recorded on 2026-08-10:
- backend/runtime no longer stuck at 0%; STTN processed the video;
- realtime result preview: PASS by Owner observation;
- performance materially improved; captured run processed 440 frames in about 38 seconds and reported 11.38 frame/s;
- engine output reported STTN GPU mode and produced the clean-video output;
- P2 completion unlocked the matching P3 job;
- manual ROI overlay appears displaced from the pixels the Owner drew;
- per-region mask selection is missing; current implementation uses a job-level mask;
- visible inpaint Console remains noisy with repeated successful `/api/frame/...` requests and expected early `/api/preview` 404 lines.

Execution rule:
Anti must `git fetch origin`, read this ACTIVE file and the referenced spec from `origin/review/PIPELINE2-APPROVED-UI-001`, and confirm the exact remote HEAD named in the PM dispatch prompt before editing. Local task-spec copies are not authority.

Owner app verification:
Current retest: PARTIAL PASS / NEEDS_REVISION.
Fresh verification of the new revision: NOT STARTED.

Merge permission:
BLOCKED.
