# Current Task

## Task ID
STANDALONE-SUBTITLE-REMOVER-010

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch / Draft PR: `review/STANDALONE-SUBTITLE-REMOVER-010` / #59.
- Corrected runtime base: `review/STANDALONE-SUBTITLE-REMOVER-010-RUNTIME-BASE@92deaf8fa72094fbad3f84c75c716967acbc509d`.
- Reviewed application-source HEAD: `08729502dbbcea334caf6151b0289cd57cf39e16`.
- Active task spec: `.ai/task_specs/STANDALONE-SUBTITLE-REMOVER-010.md`.

## User outcome
Standalone `Xóa Sub` directly below Voice Render, reusing the active Pipeline 2 workspace/controller/backend without requiring P1/P3.

## Published implementation
- New `src/renderer/js/standalone-subtitle-remover.js`.
- One import-only bootstrap line in `src/renderer/js/pipeline1-run-config.js`.
- No duplicate P2 state, DOM or backend.
- Manual region-specific Box/Tight/Soft mask selection.
- Manual request bridge uses region mask for the active manual pass while Auto stays job-level.
- Continuous multi-region drawing is restored after successful region creation.
- Crosshair is limited to active Manual Draw state.
- Existing coordinate mapping is preserved.

## Verification
- GitHub source/diff review: PASS.
- PR #59: Draft/open/unmerged.
- No unresolved review threads/comments observed.
- CI/check status: none reported by GitHub.
- Exact static command evidence: WAITING; PM environment could not perform network checkout.

## Required static evidence before Owner runtime
```text
git status --short
node --check src/renderer/js/app.js
node --check src/renderer/js/standalone-subtitle-remover.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner manual verification: NOT STARTED / BLOCKED until static PASS.
- Documentation synchronization: PASS after dynamic docs commit completes.
- Merge permission: BLOCKED.

## Next action
Run the required static commands on a clean exact checkout of current PR HEAD. If PASS, Owner may execute manual QA. No merge.
