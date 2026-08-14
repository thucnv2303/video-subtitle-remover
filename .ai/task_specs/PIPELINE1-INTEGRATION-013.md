# PIPELINE1-INTEGRATION-013 — Owner Integration Build

Status: APPROVED FOR PM DIRECT EXECUTION

## Goal
Create one Owner-testable Pipeline 1 build that contains both:
1. `PIPELINE1-STANDARD-LONG-VIDEO-012` Revision 3 chunked Standard narration; and
2. `PIPELINE1-PER-JOB-SEMANTIC-REMIX-011` per-Job Remix UI/state.

No new local clone/worktree is allowed. This integration exists on GitHub; Owner will reuse the existing `E:\Project AI\Video-sub-remove-owner-test-LONG012` directory for testing.

## Exact basis
- Integration branch: `review/PIPELINE1-INTEGRATION-013`
- Starting SHA: `4ff0712a909f12929373e6f457aa96329e9c3610`
- Starting lineage already contains PR #52 log-router source and PR #55 long-video Revision 3 source.
- Long-video application source: `f00b5e8711ec737ad5c474987647171161226cb5`
- Per-Job Remix source authority: PR #54 / `review/PIPELINE1-PER-JOB-SEMANTIC-REMIX-011`, application source head `c3662ea84f32c25bf5bf633888affe39fd2cb6fa`.

## Application integration scope
Allowed application source only:
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/js/pipeline1-semantic-remix-per-job.js` (new)
- `src/renderer/styles/pipeline1-semantic-remix-per-job.css` (new)

The inherited `src/main/p1-standard-vision-wrapper.js` Revision 3 must remain byte-identical to integration starting SHA.

## Required merge behavior
`pipeline1-run-config.js` must preserve BOTH lineages:
- keep `import './pipeline1-log-router.js';` from PR #52/long-video lineage;
- add `installPerJobSemanticRemixControls` import from PR #54;
- remove global `p1_semantic_remix_enabled` localStorage authority and injected global Semantic Remix checkbox;
- each idle Job snapshots its own `Boolean(job.semanticRemixEnabled)` into `job.p1Config.semanticRemixEnabled`;
- shared AI/model/prompt/voice/speed settings remain shared;
- log summary uses `Remix=x/y jobs`;
- no unrelated behavior change.

## Per-Job UI behavior
- Every Pipeline 1 Job card gets its own compact `Remix` switch.
- New/missing value defaults OFF / Standard.
- Changing Job A must not change Job B.
- queued/processing Job switch is disabled; idle/error remains editable.
- if a Job already has `p1Config`, changing idle/error switch updates only that Job's existing `p1Config.semanticRemixEnabled` for retry.
- no global persistence that turns future Jobs on.

## Long-video/TTS invariants
Integration must not modify long-video Revision 3 implementation.
- long Standard AI composition is sectioned internally;
- accepted sections join to one `narration_script`;
- global hard-length/CJK/repetition validation remains before TTS;
- TTS still receives one continuous final narration after `Standard duration guard PASS`.

## Forbidden
- no Prompt Manager source integration in this task;
- no TTS engine/Voice Render changes;
- no P2/P3/backend/dependency changes;
- no changes to `src/main/p1-standard-vision-wrapper.js`;
- no merge of PR #54/#55;
- no local clone/worktree creation.

## Verification
Required source review:
- integration compare from starting SHA changes exactly the 3 authorized renderer files;
- `pipeline1-log-router.js` import remains present;
- no `SEMANTIC_REMIX_KEY` or global Remix DOM injection remains;
- inherited wrapper SHA/content unchanged.

Required static on exact integration HEAD:
```text
node --check src/main/p1-standard-vision-wrapper.js
node --check src/renderer/js/pipeline1-run-config.js
node --check src/renderer/js/pipeline1-semantic-remix-per-job.js
git diff --check 4ff0712a909f12929373e6f457aa96329e9c3610..HEAD
```

## Owner runtime acceptance
Reuse existing LONG012 directory only.
1. UI: no global Semantic Remix block in Action area.
2. Add 2 Jobs: each card shows Remix OFF/Standard by default.
3. Toggle only Job A ON; Job B remains OFF.
4. Start queue: Job A uses semantic-remix; Job B uses standard; switch locks while queued/processing.
5. For the ~497s Standard Job, long-video path logs chunked section plan rather than one 8k recompose request.
6. Joined narration passes global guard and only then one TTS flow begins.
7. No P1/Ollama log regression into P2 console.

## Gates
- Execution: APPROVED.
- Static: WAITING.
- Code review: WAITING.
- Owner runtime: WAITING.
- Documentation sync: PARTIAL.
- Merge: BLOCKED.
