# AgentOS Handoff Status

## Active task
`STANDALONE-SUBTITLE-REMOVER-010`

## Status
SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME BLOCKED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59
- Corrected runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`
- Reviewed application-source HEAD: `08729502dbbcea334caf6151b0289cd57cf39e16`
- Task authority: `.ai/task_specs/ACTIVE.md` + `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`

## Published source
- `src/renderer/js/standalone-subtitle-remover.js` added.
- `src/renderer/js/pipeline1-run-config.js` imports the helper.
- No task-010 changes to backend/inpaint, `app.js`, `index.html`, Voice Render processing, P1 processing, TTS or P3 processing.

## Reviewed behavior
- Sidebar order target is Home -> Voice Render -> Xóa Sub -> Settings.
- Standalone mode reuses existing Home/Step 2 P2 workspace and shared `window._appState`.
- No duplicate P2 DOM IDs, store or backend engine.
- Manual region list gets Box/Tight/Soft per-region selectors.
- Manual request mask is overridden only for the active manual pass via `processingJobId + processingPassIndex`.
- Auto remains job-level mask.
- Drawing remains active across consecutive region creation.
- Crosshair is cleared outside active Manual Draw.
- Existing coordinate mapping remains untouched.

## Review evidence
- PR #59 exact source HEAD `08729502...` was directly reviewed from GitHub.
- PR is Draft/open/unmerged and targets corrected runtime base `92deaf8...`.
- No unresolved review threads/comments observed.
- GitHub reported no CI/check status for source HEAD.
- PM code review: PASS logic/scope.
- Static execution is not yet evidenced: PM checkout attempt was blocked by outbound DNS/network failure. This is not a static PASS.

## Required static evidence
```text
git status --short
node --check src/renderer/js/app.js
node --check src/renderer/js/standalone-subtitle-remover.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

## Owner manual QA after static PASS
- sidebar order Home -> Voice Render -> Xóa Sub -> Settings;
- Xóa Sub opens existing P2 without P1 execution;
- Auto removal smoke test;
- Manual crosshair only on drawable preview;
- draw Region 1 then Region 2 without re-enabling Draw;
- region geometry remains aligned;
- assign different region masks and process;
- progress/result preview/output `_no_sub.mp4` work;
- Auto removes crosshair;
- Voice Render and normal pipeline have no obvious regression.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner manual verification: NOT STARTED / BLOCKED until static PASS.
- Documentation synchronization: PASS after this dynamic-doc sequence.
- Merge permission: BLOCKED.

## Next permitted action
Run static verification on a clean exact checkout of the current PR HEAD. If PASS, Owner runtime QA is permitted. Do not merge.
