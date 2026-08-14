# Current Task

## Task ID
PIPELINE1-INTEGRATION-013

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RUNTIME_WAITING

## Basis
- Integration branch / Draft PR: `review/PIPELINE1-INTEGRATION-013` / #56.
- Integration starting SHA: `4ff0712a909f12929373e6f457aa96329e9c3610`.
- Long-video Revision-3 source inherited unchanged: `f00b5e8711ec737ad5c474987647171161226cb5`.
- Per-Job Remix authority: PR #54 application source `c3662ea84f32c25bf5bf633888affe39fd2cb6fa`.
- Integration source head before docs: `e6d43cedca4890cb5d3d340a69f454cb3af0edad`.
- Spec: `.ai/task_specs/PIPELINE1-INTEGRATION-013.md`.

## User outcome
One Owner-testable Pipeline 1 build must contain both the long-video Standard fix and the already-implemented per-Job Semantic Remix behavior. Owner must not be asked to create another local clone/worktree directory.

## Integrated application behavior
### Long Standard narration
- Targets >3200 chars with >=2 Vision chunks use sequential chronological sections.
- Each section receives local SRT + local Vision evidence and a bounded continuity handoff.
- Opening only occurs in section 1; only final section may conclude/CTA.
- Sections join into one continuous narration.
- Original global hard-length, ZERO-CJK and repetition gates remain fail-closed.
- TTS receives one joined narration only after `Standard duration guard PASS`.

### Per-Job Semantic Remix
- No global Semantic Remix checkbox/localStorage authority.
- Each Job card owns `job.semanticRemixEnabled`, default OFF/Standard.
- queued/processing locks that Job's switch; idle/error remains editable.
- run snapshot copies each Job's own value to `job.p1Config.semanticRemixEnabled`.
- changing one Job does not modify another Job or future Jobs.

### Log routing
`pipeline1-run-config.js` preserves `import './pipeline1-log-router.js';`; integration must not regress P1/Ollama isolation from the P2 console.

## Review evidence
Compare `4ff0712... -> e6d43ced...` changes exactly the integration spec and 3 authorized renderer files. The inherited `src/main/p1-standard-vision-wrapper.js` is unchanged by integration. PM logic/scope review PASS; static/runtime evidence is still required.

## Owner local policy
Reuse only `E:\Project AI\Video-sub-remove-owner-test-LONG012`. Do not create any additional clone/worktree/test directory. If that existing directory is dirty, STOP rather than reset/restore/clean it.

## Required verification
```text
git rev-parse HEAD
node --check src/main/p1-standard-vision-wrapper.js
node --check src/renderer/js/pipeline1-run-config.js
node --check src/renderer/js/pipeline1-semantic-remix-per-job.js
git diff --check 4ff0712a909f12929373e6f457aa96329e9c3610..HEAD
```

Then Owner runtime acceptance:
1. no global Semantic Remix block;
2. 2+ Job cards each show independent Remix OFF/Standard;
3. Job A ON does not change Job B;
4. queued/processing switch locks and run uses per-Job mode;
5. ~497s Standard uses chunked long narration and joined global PASS before TTS;
6. one continuous TTS flow starts only after the final joined narration passes;
7. P1/Ollama logs remain out of P2 console.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL pending exact final-head/static/runtime/QA closeout.
- Merge: BLOCKED.

## Next action
Finish canonical integration-doc synchronization, verify live PR #56 exact head/files/checks, then authorize Owner to update the existing LONG012 directory to that exact head. No new local directory and no merge.
