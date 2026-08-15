# Active PM Execution Spec

Status: READY_FOR_IMPLEMENTATION

Task: `STANDALONE-SUBTITLE-REMOVER-010`
Repository: `thucnv2303/video-subtitle-remover`
Active review branch: `review/STANDALONE-SUBTITLE-REMOVER-010`
Exact starting SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
Parent review branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
Parent Draft PR: #51

## Execution authority
Implementation is authorized only on `review/STANDALONE-SUBTITLE-REMOVER-010` and only according to `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`.

Before editing source, executor/implementer must:
1. `git fetch origin`.
2. Checkout the exact review branch.
3. Read `origin/review/STANDALONE-SUBTITLE-REMOVER-010:.ai/task_specs/ACTIVE.md`.
4. Read `origin/review/STANDALONE-SUBTITLE-REMOVER-010:.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`.
5. Confirm remote HEAD and ensure task scope has not changed.
6. Stop on unexpected source/state conflicts rather than broadening scope.

## Goal
Add a standalone `Xoa Sub` navigation page below Voice Render that reuses the current working Pipeline 2 subtitle-removal path, including Auto/Manual removal, multi-region/manual masks, progress/result behavior and current clean-video output contract.

Manual region drawing must show a crosshair cursor only over the drawable preview while drawing mode is active, without changing region coordinate mapping.

## Non-goals
- No duplicate inpaint/backend engine.
- No P1 AI/Semantic changes.
- No TTS/Voice Render changes.
- No P3 changes.
- No BUG-039 or BUG-040 fixes.
- No broad renderer refactor.

## Gates
- Execution: AUTHORIZED / NOT YET VERIFIED
- Automated/static verification: WAITING
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING
- Merge permission: BLOCKED
