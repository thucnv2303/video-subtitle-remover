# AgentOS Handoff Status

## Active task
`STANDALONE-SUBTITLE-REMOVER-010`

## Status
READY FOR PM DIRECT IMPLEMENTATION / SOURCE NOT YET PUBLISHED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59
- Parent/base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Exact task base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Remote task authority: `.ai/task_specs/ACTIVE.md` + `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`
- Always re-read current PR HEAD from GitHub before source edits; do not treat historical handoff SHAs as current if the branch moved.

## Verified pre-implementation repository state
- PR #59 is open, Draft, unmerged.
- Verified pre-sync HEAD `6ad17f5ba3ec8c8654eb6086045408f821e7b777` was 5 commits ahead of task base and changed only task-spec/docs files.
- No application source implementation was present at that verification point.
- Previously attempted `src/renderer/js/standalone-subtitle-remover.js` is absent at that ref.

## Product goal
Add standalone `Xoa Sub` directly below Voice Render. The entry reuses the current Pipeline 2 Step 2 workspace/controller/backend so Owner can remove burned-in subtitles without running P1 or P3.

## Mandatory implementation facts
- `src/renderer/js/app.js` is the active P2 controller and owns shared `window._appState`.
- Existing P2 DOM is already in `src/renderer/index.html`; do not duplicate it.
- Voice Render mounts `#nav-voice-render` dynamically before Settings; Xoa Sub must appear directly after it without changing Voice Render processing.
- Manual processing currently uses `mask_mode: job.maskMode || 'box'`; it must use `region.maskMode || job.maskMode || 'box'` for manual passes only.
- Auto path must keep job-level mask behavior.
- Region list needs per-region Box/Tight/Soft selector.
- New region may inherit current job mask as default.
- Drawing currently uses `canvas-inner-orig` source-coordinate scaling; preserve it.
- Current successful region draw disables drawing; remove that auto-disable so continuous multi-region drawing works.
- Crosshair applies only while Manual drawing mode is active over the drawable preview and disappears when drawing is disabled/Auto.

## Preferred source scope
- `src/renderer/js/app.js`
- `src/renderer/index.html`
- `src/renderer/styles/main.css`

A small helper is allowed only if it has an explicit bootstrap and does not duplicate processing/state.

## Forbidden scope
No P1 AI/Semantic, Voice Render processing, TTS, P3, backend/inpaint duplication, BUG-039/BUG-040, dependency churn, broad renderer refactor, force/reset/restore/clean, or merge.

## Required source publication flow
1. New chat verifies PR #59 live HEAD + canonical `.ai/` files.
2. If still docs-only, PM edits source directly on `review/STANDALONE-SUBTITLE-REMOVER-010`.
3. Source commit(s) contain only task source changes.
4. PM reviews full GitHub diff/full files and static evidence.
5. Dynamic `.ai/` docs are synchronized in separate docs commit.
6. Owner runtime only after code review PASS.
7. No merge until every gate PASS and explicit Owner/PM approval.

## Required static evidence
```text
git status --short
node --check src/renderer/js/app.js
node --check <every additional changed JS>
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner manual QA after review PASS
- sidebar order: Home -> Voice Render -> Xoa Sub -> Settings;
- Xoa Sub opens standalone existing P2 without P1 execution;
- Auto removal smoke test;
- Manual drawing crosshair only on drawable preview;
- draw Region 1 then Region 2 without re-enabling Draw;
- region geometry stays aligned;
- set different region masks and process;
- progress/result preview/output `_no_sub.mp4` work;
- Auto removes crosshair;
- Voice Render and normal main pipeline show no obvious regression.

## Gates
- Execution: NOT STARTED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner manual verification: NOT STARTED.
- Documentation synchronization: PASS for pre-implementation handoff.
- Merge permission: BLOCKED.

## New-chat startup
Use GitHub as source of truth. Fetch PR #59, record exact current HEAD, read ACTIVE/task spec/current_state/task_current/handoff/qa from that exact ref, compare with `330d756f...`, and inspect changed files. If there is any new application source, review it before editing. If still docs-only, implement directly according to task 010. No executor and no merge.
