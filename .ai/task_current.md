# Current Task

## Task ID
P1-P2-PER-JOB-EXPORT-NOVOCAL-034

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_OWNER_RUNTIME_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Draft PR: #74.
- Application-source HEAD before docs sync: `0799ec2faedcb4d025b559f3ac604ceed052adda`.
- Base: `fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## User outcome
Results belong to individual Jobs. The Owner can Save As P1 artifacts and P2 clean video from the correct Job card, and may create a separate Demucs-strict P2 derivative without original vocals.

## Product invariants
- Job actions resolve by exact Job ID, never visual list index.
- P1 export exposes only real filesystem artifact paths.
- P2 export copies `job.outputPath`; it does not mutate it.
- P2 no-vocal derivative is stored separately as `job.p2NoVocalOutputPath`.
- P3 continues to use canonical P2 output authority.
- Vocal removal must return `method_used=demucs`; otherwise derivative creation fails closed.

## Required Owner verification
Preflight on exact branch:
```text
git fetch origin
git switch review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034
git pull --ff-only
node --check src/main/main-entry.js
node --check src/main/preload.js
node --check src/renderer/js/job-export-controls.js
git diff --check fbaa060bc9f604fc93e3e195e264ea27e78921fd..HEAD
```

Runtime:
1. Complete or load at least two P1 Jobs; verify each `Kết quả` menu saves artifacts from that exact Job.
2. Verify voice export keeps the actual audio file type.
3. Complete or load at least two P2 Jobs; verify each `↓ P2` saves its own clean video.
4. On one P2 Job click `♬ Xóa giọng`; require successful Demucs path and separate output.
5. Download the derivative through `↓ Không giọng`.
6. Verify canonical clean video is still present/usable and P3 input behavior is unchanged.
7. Sanity-check P1→P2 hydration, standalone Xóa Sub, Voice Render, and P3 availability.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL PASS; no GitHub CI/status exists for source HEAD, exact Owner checkout preflight remains required.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PASS after docs publication.
- Merge: BLOCKED.

## Next action
Owner runtime verification only. On PASS, record observed result in canonical `.ai/`, re-check exact PR HEAD/gates, then merge may be considered.
