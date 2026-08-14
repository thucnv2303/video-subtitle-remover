# Current State

## Status
PIPELINE1-INTEGRATION-013 — SOURCE PUBLISHED / PM REVIEW PASS / STATIC WAITING / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Integration branch / Draft PR: `review/PIPELINE1-INTEGRATION-013` / #56.
- Integration starting SHA: `4ff0712a909f12929373e6f457aa96329e9c3610`.
- Long-video Revision-3 source inherited unchanged: `f00b5e8711ec737ad5c474987647171161226cb5`.
- Per-Job Remix authority: PR #54 application source `c3662ea84f32c25bf5bf633888affe39fd2cb6fa`.
- Integration source head before docs: `e6d43cedca4890cb5d3d340a69f454cb3af0edad`.
- Integration spec: `.ai/task_specs/PIPELINE1-INTEGRATION-013.md`.

## Verified integration source
Compare `4ff0712... -> e6d43ced...` changes exactly the integration spec plus 3 renderer files:
- `src/renderer/js/pipeline1-run-config.js`
- new `src/renderer/js/pipeline1-semantic-remix-per-job.js`
- new `src/renderer/styles/pipeline1-semantic-remix-per-job.css`

The inherited long-video wrapper is not changed by integration.

### Per-Job Remix
- global `p1_semantic_remix_enabled` localStorage authority and injected Action-area checkbox are removed;
- every Job card receives its own Remix switch, default OFF/Standard;
- changing a Job updates only that Job; queued/processing locks the switch;
- run snapshot stores each Job's own `semanticRemixEnabled` into its own `p1Config`;
- new Jobs do not inherit another Job's Remix state;
- existing `import './pipeline1-log-router.js';` is preserved.

### Long-video Standard
Inherited Revision 3 composes long narration in sequential chronological sections from section-local transcript/Vision evidence. A compact global brief + previous accepted tail provides continuity. Sections join into exactly one final narration; original global hard-length/ZERO-CJK/repetition gates remain fail-closed. TTS receives one continuous narration only after `Standard duration guard PASS`.

## Owner local safety
Owner explicitly requested no more clone/worktree folders. Do not create additional local directories. The next Owner test reuses only:
`E:\Project AI\Video-sub-remove-owner-test-LONG012`
by fetching and switching that existing clean directory to the exact integration ref.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL pending exact final-head static/runtime/QA closeout.
- Merge permission: BLOCKED.

## Next permitted action
Synchronize remaining canonical integration docs, verify exact PR #56 final head and changed files, then Owner may update the existing LONG012 directory to that exact head and run static + UI + long-video runtime acceptance. No merge.
