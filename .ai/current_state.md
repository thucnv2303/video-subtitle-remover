# Current State

## Status
STANDALONE-SUBTITLE-REMOVER-010 — SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RUNTIME BLOCKED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Corrected runtime base branch: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE`.
- Corrected runtime base SHA: `92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Reviewed source HEAD before this docs commit: `08729502dbbcea334caf6151b0289cd57cf39e16`.
- Active task: `.ai/task_specs/ACTIVE.md` + `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`.

## Runtime-base correction
The original task base `330d756fcce1b71ca8745b3292d7ac655bc32d13` predates the active Voice Render runtime lineage. Owner reported the real app running at `92deaf8fa72094fbad3f84c75c716967acbc509d`; GitHub verification confirmed that ref contains the active Voice Render bootstrap/runtime. PR #59 was therefore retargeted to the pinned runtime-base branch at exactly `92deaf8...`.

## Published source
Source implementation is intentionally narrow:
- new `src/renderer/js/standalone-subtitle-remover.js`;
- `src/renderer/js/pipeline1-run-config.js` adds one import-only bootstrap line.

`src/renderer/js/app.js`, `src/renderer/index.html`, backend/inpaint, Voice Render processing, P1 processing, TTS and P3 processing are unchanged by task 010 source publication.

## Reviewed behavior
- `Xóa Sub` mounts directly after dynamic `#nav-voice-render`.
- Standalone mode reuses `page-home` and existing Step 2 DOM; no duplicate P2 DOM/state/backend.
- Existing shared `window._appState` remains the only P2 state authority.
- Manual region rows receive Box/Tight/Soft selectors; default is `region.maskMode || job.maskMode || 'box'`.
- The request bridge only overrides `mask_mode` for the currently processing manual P2 pass using `processingJobId + processingPassIndex`; Auto remains job-level.
- Draw state is restored after successful region creation so Region 2/3 can be drawn without re-enabling Draw.
- Auto/Draw-off clears crosshair.
- Existing preview-to-source coordinate mapping is not rewritten.

## Verification evidence
- GitHub PR #59 exact source HEAD verified: `08729502dbbcea334caf6151b0289cd57cf39e16`.
- PR is open, Draft, unmerged.
- PR base is corrected runtime base `92deaf8...`.
- No unresolved review threads or PR comments were present at review time.
- GitHub returned no CI/check statuses for the source HEAD.
- PM reviewed the full source diff and relevant baseline source; logic/scope review PASS.
- Exact-checkout static verification could not be executed in the PM environment because outbound DNS/network access to GitHub failed. Do not infer static PASS from source inspection.

## Gates
- Execution: PASS — source published.
- Automated/static verification: WAITING — exact checkout `node --check` and `git diff --check` evidence still required.
- Code review: PASS — logic and scope reviewed against GitHub source/diff.
- Owner manual app verification: NOT STARTED / BLOCKED until static evidence passes.
- Documentation synchronization: PASS after this docs-state commit is published.
- Merge permission: BLOCKED.

## Next permitted action
On a clean local checkout of exact current PR HEAD, run required static commands. If all PASS, Owner may run the task-010 manual QA checklist. No merge.
