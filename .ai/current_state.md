# Current State

## Status
PIPELINE1-PER-JOB-SEMANTIC-REMIX-011 — SOURCE PUBLISHED / PM CODE REVIEW PASS / STATIC WAITING / OWNER RUNTIME NOT STARTED / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active review branch: `review/PIPELINE1-PER-JOB-SEMANTIC-REMIX-011`.
- Active Draft PR: #54.
- Task spec commit: `280eafa57ff05268a378e82f468eec2f4feebe7d`.
- Application-source head: `c3662ea84f32c25bf5bf633888affe39fd2cb6fa`.

## Owner requirement
Semantic Remix is optional per video/Job. A queue may contain a mixture of Standard and Remix Jobs. The mode must be visible/editable on each Job rather than being one global Pipeline 1 switch.

## Verified prior behavior
`pipeline1-run-config.js` previously created one global `#step1-semantic-remix` checkbox, persisted `p1_semantic_remix_enabled` in localStorage, then copied the same boolean into every idle Job at run start.

Downstream P1 already supports true per-Job behavior: `runPipeline1MultimodalAnalysis(job)` reads `job.p1Config.semanticRemixEnabled` to choose Standard vs Semantic Remix for that specific Job.

## Published task-011 source
- New `src/renderer/js/pipeline1-semantic-remix-per-job.js` mounts one compact Remix switch on each P1 Job card.
- Missing Job value defaults to `job.semanticRemixEnabled = false`.
- Toggle changes only that Job and, when a prior `p1Config` exists on an idle/error Job, synchronizes only that Job for retry correctness.
- Queued/processing Jobs lock the switch.
- New CSS `src/renderer/styles/pipeline1-semantic-remix-per-job.css` provides compact switch states.
- `pipeline1-run-config.js` no longer creates/reads/writes the global Remix checkbox/localStorage mode. Shared provider/model/prompt/TTS settings remain shared, while each idle Job receives its own `semanticRemixEnabled` in its `p1Config` snapshot.
- Run-start summary reports `Remix=X/Y jobs`.

## Source review
- Spec -> source compare: exactly 3 authorized files.
- No `app.js`, `index.html`, P2/P3/backend/log router/Prompt Manager/AI analysis/TTS/dependency changes.
- PM source review: PASS.

## Sibling task state
- PR #52 BUG-039 log observability remains a separate Draft PR. Owner reports the log behavior is now handled; formal static/docs closeout is still independent and not imported into PR #54.
- PR #53 BUG-040 Prompt Manager V2 remains a separate Draft PR. Owner has verified prompt creation works after the latest runtime correction; formal closeout/merge remains independent and is not imported into PR #54.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout commands.
- Code review: PASS.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: PARTIAL until runtime result/QA closeout.
- Merge permission: BLOCKED.

## Next permitted action
Run static checks on the latest PR #54 HEAD, then Owner tests at least two P1 Jobs with mixed Standard/Remix choices. Do not evaluate sibling Prompt Manager/log behavior from this isolated branch and do not merge.
