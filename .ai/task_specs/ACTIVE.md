# Active PM Execution Spec

Status: READY_FOR_IMPLEMENTATION

Task: `PIPELINE1-STANDARD-SHORT-DURATION-GUARD-019`
Repository: `thucnv2303/video-subtitle-remover`
Active review branch: `review/PIPELINE1-STANDARD-SHORT-DURATION-GUARD-019`
Exact starting SHA: `4af664327155cc646e3a1a96f64d69b951c453b6`
Parent task: `PIPELINE1-ABSOLUTE-FILE-PATH-018`
Spec: `.ai/task_specs/PIPELINE1-STANDARD-SHORT-DURATION-GUARD-019.md`

## Goal
Fix short-video Standard duration recompose non-convergence without involving Semantic Remix or weakening deterministic narration gates.

## Verified runtime trigger
Owner 17.6s Standard Job with Remix OFF: draft 260 chars vs hard target 276-290; recompose 547; retained-candidate retry 481; both rejected by the correct hard length gate before TTS. Absolute path/preview/ASR/Vision succeeded.

## Scope
Prefer a narrow change in `src/main/p1-standard-vision-wrapper.js`: short Standard recompose output budget must be target-aware instead of inheriting the 520-token minimum intended for larger generations. Preserve long-video scaling, hard min/max, ZERO-CJK and repetition gates. No P2/P3/TTS/Voice Render/Semantic Remix changes.

## Gates
- Execution: AUTHORIZED / NOT YET VERIFIED.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
