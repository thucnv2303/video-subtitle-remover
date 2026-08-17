# Active PM Execution Spec

Status: P1_P2_PER_JOB_EXPORT_NOVOCAL_034_OWNER_RUNTIME_WAITING

Task: `P1-P2-PER-JOB-EXPORT-NOVOCAL-034`
Repository: `thucnv2303/video-subtitle-remover`
Branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`
Draft PR: #74
Application-source HEAD before docs sync: `0799ec2faedcb4d025b559f3ac604ceed052adda`
Base: `fbaa060bc9f604fc93e3e195e264ea27e78921fd`

## Purpose
Make P1/P2 outputs independently retrievable per Job and add an optional P2 no-original-vocal derivative without changing canonical P2/P3 authority.

## Scope
- P1 per-Job Save As for available artifact files.
- P2 per-Job Save As for canonical clean/no-sub video.
- Optional P2 Demucs-strict no-vocal derivative.
- Narrow Electron Save As IPC bridge.
- No P3 behavior change.

## Invariants
- Resolve the target by exact Job ID.
- Never pass SRT text content as a filesystem source path.
- Preserve actual voice file extension.
- `job.outputPath` remains canonical and unchanged.
- Derivative path is separate (`p2NoVocalOutputPath`).
- Require `method_used=demucs`; fail closed otherwise.

## Owner acceptance
Run exact checkout preflight and app runtime tests from `.ai/task_current.md`. PASS requires correct per-Job ownership with at least two Jobs, successful Save As, Demucs derivative creation/download, and no regression to canonical P2→P3 flow.

## Gates
Execution PASS; static PARTIAL PASS with exact Owner checkout WAITING; code review PASS; Owner WAITING; docs sync PASS after publication; merge BLOCKED.

## Next action
Owner runtime verification. Do not merge before Owner PASS is recorded in canonical project state.
