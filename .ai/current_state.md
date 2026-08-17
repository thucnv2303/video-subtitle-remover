# Current State

## Status
P1-P2-PER-JOB-EXPORT-NOVOCAL-034 — SOURCE PUBLISHED / STATIC SOURCE REVIEW PASS / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Active Draft PR: #74.
- Application-source HEAD before docs sync: `0799ec2faedcb4d025b559f3ac604ceed052adda`.
- Base: `review/P1-P2-HANDOFF-HYDRATION-032@fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## Owner-approved product scope
1. Pipeline 1: every Job can Save As its generated artifacts.
2. Pipeline 2: every completed Job can Save As its clean/no-sub video.
3. Pipeline 2: every completed Job can optionally create a no-original-vocal derivative using Demucs strict.
4. The no-vocal derivative must not overwrite canonical P2 `outputPath` or change P3 input authority.
5. No librosa/weak fallback is accepted for the derivative.

## Implementation
- `src/main/main-entry.js`: main-process `app:saveCopy` IPC with native Save As dialog and file copy; loads job export controls.
- `src/main/preload.js`: exposes `electronAPI.saveCopy` only as a narrow IPC bridge.
- `src/renderer/js/job-export-controls.js`: binds P1/P2 actions to exact Job IDs, exports available P1 artifacts, exports P2 output, and creates P2 no-vocal derivative through existing `removeVocal` + `replaceAudio` APIs.

## Review corrections already applied
- Removed array-index Job binding; controls resolve exact Job via card Job ID.
- Removed fallback treating `ttsTimedSrt` content as a filesystem path.
- Preserved the real TTS audio extension instead of forcing `.wav`.
- No-vocal action transitions to a download action after successful derivative creation.

## Static evidence
- Main entry source syntax checked with `node --check`: PASS.
- New job-export-controls source syntax checked with `node --check`: PASS.
- Preload change is a single IPC exposure added to the already-running preload file; exact local checkout syntax verification remains part of Owner preflight.
- GitHub Actions / commit statuses for source HEAD: none published.
- PR has no unresolved review threads at latest review.

## Owner runtime acceptance
Required before merge:
1. P1 completed Job shows `Kết quả` and can Save As SRT/JSON/voice artifacts that actually exist.
2. Two P1 Jobs export artifacts from the correct Job, not by list index.
3. P2 completed Job can Save As its own clean/no-sub MP4.
4. `Xóa giọng` uses Demucs and creates a separate no-vocal MP4.
5. Canonical P2 `outputPath` remains unchanged after derivative creation.
6. A second P2 Job remains independent.
7. No regression to P1→P2 hydration, standalone Xóa Sub, Voice Render, or P3.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL PASS; exact Owner checkout commands still required because no CI is configured for this HEAD.
- Code review: PASS for current application-source scope after corrective review.
- Owner manual verification: NOT STARTED.
- Documentation synchronization: PASS after this docs series completes.
- Merge permission: BLOCKED.

## Next permitted action
Owner checks out the exact review branch, runs syntax/diff preflight, starts the app, and performs the runtime acceptance above. Do not merge until Owner PASS is recorded.
