# Current State

## Status
STANDALONE-SUBTITLE-REMOVER-010 — SOURCE PUBLISHED / STATIC PASS / PM CODE REVIEW PASS / OWNER RUNTIME READY / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Corrected runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Application-source verification head: `524f7724754e190fca19d8b21d50ff10296b49aa` (docs after source do not change application files).
- Active task: `.ai/task_specs/ACTIVE.md` + `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`.

## Published source
- New `src/renderer/js/standalone-subtitle-remover.js`.
- `src/renderer/js/pipeline1-run-config.js` adds one import-only bootstrap line.
- No task-010 change to `app.js`, `index.html`, backend/inpaint, Voice Render processing, P1 processing, TTS, or P3 processing.

## Reviewed behavior
- `Xóa Sub` mounts directly after dynamic `#nav-voice-render`.
- Standalone mode reuses existing `page-home` + Step 2 DOM and shared `window._appState`.
- No duplicate P2 DOM/state/backend.
- Region rows receive Box/Tight/Soft selector with job-level fallback.
- Manual request bridge selects `region.maskMode || processingJob.maskMode || 'box'` for the active manual pass; Auto remains job-level.
- Draw remains active across consecutive successful region creation and crosshair is cleared outside active Manual Draw.
- Existing preview-to-source coordinate mapping is untouched.

## Verification evidence
- PM GitHub source/diff review: PASS logic/scope.
- Verification branch: `verify/STANDALONE-SUBTITLE-REMOVER-010-static`.
- Verification commit: `d9bde2fd036191763e043863b77676f6c8ec2e8d`.
- GitHub Actions run: `31862007860`, job `94956922811`, conclusion SUCCESS.
- Step `Verify pinned PR head` conclusion SUCCESS.
- The successful step executed:
  - `git cat-file -e 524f7724754e190fca19d8b21d50ff10296b49aa^{commit}`;
  - `git cat-file -e 92deaf8fa72094fbad3f84c75c716967acbc509d^{commit}`;
  - `node --check src/renderer/js/standalone-subtitle-remover.js`;
  - `node --check src/renderer/js/pipeline1-run-config.js`;
  - `git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..524f7724754e190fca19d8b21d50ff10296b49aa`.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS.
- Owner manual app verification: READY / NOT STARTED.
- Documentation synchronization: PASS after this gate-sync sequence.
- Merge permission: BLOCKED until Owner runtime PASS is recorded in canonical `.ai/` and PM explicitly approves merge.

## Next permitted action
Owner may now test the exact current PR #59 checkout. Run the task-010 Owner QA checklist. Do not merge.