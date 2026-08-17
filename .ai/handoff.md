# AgentOS Handoff Status

## Active task
`P1-P2-PER-JOB-EXPORT-NOVOCAL-034`

## Status
SOURCE PUBLISHED / CODE REVIEW PASS / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Draft PR: #74.
- Application-source HEAD before docs sync: `0799ec2faedcb4d025b559f3ac604ceed052adda`.
- Base: `review/P1-P2-HANDOFF-HYDRATION-032@fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## Implemented behavior
- P1 Job cards gain `↓ Kết quả` for available artifact files.
- P2 completed Job cards gain `↓ P2` for Save As of canonical clean video.
- P2 completed Job cards gain `♬ Xóa giọng`; successful Demucs separation + audio replacement creates a separate derivative and changes the action to `↓ Không giọng`.
- Canonical `job.outputPath` is never replaced by the derivative.
- Export controls bind to exact Job IDs, not array positions.

## Corrective review included
The PM reviewed the first implementation and corrected three risks before Owner testing:
1. array-index binding could export the wrong Job after list filtering/reordering;
2. `ttsTimedSrt` could be SRT content rather than a file path and therefore must not be passed to Save As;
3. voice export must retain the source audio extension.

## Static/code-review evidence
- `src/main/main-entry.js`: syntax PASS.
- `src/renderer/js/job-export-controls.js`: syntax PASS.
- Full GitHub source for changed files reviewed after publication.
- GitHub commit status list for source HEAD is empty; no CI result can be claimed.

## Owner test sequence
```text
git fetch origin
git switch review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034
git pull --ff-only
node --check src/main/main-entry.js
node --check src/main/preload.js
node --check src/renderer/js/job-export-controls.js
git diff --check fbaa060bc9f604fc93e3e195e264ea27e78921fd..HEAD
```
Then run the app and verify per-Job P1 export, per-Job P2 export, Demucs-only derivative, derivative download, and canonical P2/P3 continuity.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL PASS; Owner exact-checkout preflight WAITING.
- Code review: PASS.
- Owner verification: WAITING.
- Documentation sync: PASS after docs series.
- Merge permission: BLOCKED.

## Next permitted action
Owner runtime test only. If Owner reports PASS, PM records that evidence into canonical `.ai/`, verifies the final exact HEAD and then decides merge permission.
