# Active PM Execution Spec

Status: SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

Task: `PIPELINE1-PER-JOB-SEMANTIC-REMIX-011`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-PER-JOB-SEMANTIC-REMIX-011` / #54
Task spec: `.ai/task_specs/PIPELINE1-PER-JOB-SEMANTIC-REMIX-011.md`
Spec commit: `280eafa57ff05268a378e82f468eec2f4feebe7d`
Application-source head: `c3662ea84f32c25bf5bf633888affe39fd2cb6fa`

## Product authority
Semantic Remix is per Job. Each P1 Job independently chooses Standard or Remix. There is no global Remix preference for this task.

## Published application scope
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/js/pipeline1-semantic-remix-per-job.js`
- `src/renderer/styles/pipeline1-semantic-remix-per-job.css`

## Verified source behavior
- global Semantic Remix checkbox creation removed;
- global Remix localStorage is no longer read/written by run config;
- each Job defaults to Standard when its field is absent;
- Job card gets a compact Remix switch;
- queued/processing switch is disabled;
- start snapshot stores each Job's own boolean in `p1Config.semanticRemixEnabled`;
- downstream analysis source remains unchanged because it already reads that field;
- source isolation/code review PASS.

## Required verification
```text
node --check src/renderer/js/pipeline1-semantic-remix-per-job.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

Owner runtime:
- 2+ Jobs show independent switches OFF by default;
- enable only Job A;
- mixed queue runs A Remix and B Standard;
- queued/processing mode cannot be changed;
- newly added Job starts OFF.

## Sibling isolation
PR #52 and PR #53 remain separate Draft PRs and their source is not part of this task branch.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
