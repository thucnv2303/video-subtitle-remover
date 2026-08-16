# Active PM Execution Spec

Status: SOURCE_PUBLISHED_REVIEW_PENDING

Task: `PIPELINE1-ABSOLUTE-FILE-PATH-018`
Repository: `thucnv2303/video-subtitle-remover`
Active review branch: `review/PIPELINE1-ABSOLUTE-FILE-PATH-018`
Exact starting SHA: `c731b71c1e4fb4ba5294cc5f9a20486bcfbf96f9`
Spec: `.ai/task_specs/PIPELINE1-ABSOLUTE-FILE-PATH-018.md`

## Goal
Restore stable absolute native video paths for shared Jobs so preview and Pipeline 1 ASR never receive a basename-only path.

## Scope
Only the existing Electron file-path compatibility layer may be changed unless later evidence proves another source defect. Do not refactor P1/P2/P3/TTS/backend.

## Gates
- Execution: PASS source published.
- Automated/static verification: PARTIAL.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
