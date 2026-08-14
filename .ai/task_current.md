# Current Task

## Task ID
PIPELINE1-PER-JOB-SEMANTIC-REMIX-011

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

## Basis
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Review branch / Draft PR: `review/PIPELINE1-PER-JOB-SEMANTIC-REMIX-011` / #54.
- Task spec commit: `280eafa57ff05268a378e82f468eec2f4feebe7d`.
- Application source: `c3662ea84f32c25bf5bf633888affe39fd2cb6fa`.

## Product decision
Semantic Remix belongs to each P1 Job. It is not a Settings preference and not one global start-mode checkbox.

## Current implementation
- Each P1 Job card gets a compact `Remix` switch.
- Default state for a Job without the field is OFF / Standard.
- Each switch updates only its owning Job.
- Queued/processing Jobs lock the switch.
- Idle/error Job changes update only that Job's existing `p1Config` when present so retry uses the selected mode.
- At start, provider/model/prompt/TTS remain shared settings, but `p1Config.semanticRemixEnabled` is taken independently from each Job.
- Legacy `p1_semantic_remix_enabled` localStorage is ignored and no longer written by run config.

## Scope
Application source is limited to:
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/js/pipeline1-semantic-remix-per-job.js`
- `src/renderer/styles/pipeline1-semantic-remix-per-job.css`

## Verification
- Source isolation: PASS.
- PM code review: PASS.
- Node syntax + exact diff-check: WAITING.
- Owner runtime: NOT STARTED.

## Acceptance
1. Two or more Jobs start Remix OFF independently.
2. Turning Remix ON for Job A does not change Job B.
3. Mixed queue runs A semantic-remix and B standard.
4. Queued/processing Job cannot change mode.
5. Newly added Job remains OFF regardless of previous Jobs.
6. Restart does not globally enable Remix for new Jobs.

## Sibling PRs
PR #52 log and PR #53 Prompt Manager stay separate/unmerged. This task does not import their source.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
