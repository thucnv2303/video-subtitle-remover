# Active PM Execution Spec

Status: PIPELINE1_INTEGRATION_013_SOURCE_PUBLISHED_OWNER_VERIFY_WAITING

Task: `PIPELINE1-INTEGRATION-013`
Repository: `thucnv2303/video-subtitle-remover`
Integration branch / Draft PR: `review/PIPELINE1-INTEGRATION-013` / #56
Integration starting SHA: `4ff0712a909f12929373e6f457aa96329e9c3610`
Integration spec: `.ai/task_specs/PIPELINE1-INTEGRATION-013.md`
Long-video Revision-3 application source inherited unchanged: `f00b5e8711ec737ad5c474987647171161226cb5`
Integration renderer source head before docs: `e6d43cedca4890cb5d3d340a69f454cb3af0edad`

## Purpose
Provide one Owner-testable Pipeline 1 build containing both:
1. long-video Standard chunked narration; and
2. per-Job Semantic Remix.

This replaces the prior incorrect product-test sequence where Owner was asked to run isolated PR #55 and therefore still saw the old global Remix UI.

## Source invariants
- `src/main/p1-standard-vision-wrapper.js` remains inherited from Revision 3 and is not modified by integration.
- `pipeline1-run-config.js` preserves `import './pipeline1-log-router.js';`.
- global Semantic Remix localStorage/Action-area control is removed.
- each Job snapshots its own `semanticRemixEnabled`.
- per-Job switch defaults OFF and locks during queued/processing.
- long Standard sections join into one narration and pass global gates before TTS.
- TTS receives one continuous narration, not one audio render per AI section.

## Owner local safety
No new clone/worktree/test folders. Reuse only:
`E:\Project AI\Video-sub-remove-owner-test-LONG012`

Before changing ref, `git status --short` must be empty. Dirty state => STOP; do not reset/restore/clean.

## Required verification on exact final integration HEAD
```text
git rev-parse HEAD
node --check src/main/p1-standard-vision-wrapper.js
node --check src/renderer/js/pipeline1-run-config.js
node --check src/renderer/js/pipeline1-semantic-remix-per-job.js
git diff --check 4ff0712a909f12929373e6f457aa96329e9c3610..HEAD
```

## Runtime acceptance
1. No global Semantic Remix block remains in Action area.
2. Add 2+ Jobs: each card independently shows Remix OFF/Standard.
3. Enable only Job A; Job B stays Standard.
4. During queued/processing, each relevant switch locks and run config respects the Job-specific mode.
5. ~497s Standard Job logs chunked long-narration section plan rather than one ~8k generation request.
6. Sections join to one narration, global hard-length/CJK/repetition gate passes, then exactly one TTS flow begins.
7. Listening check: transitions coherent; no repeated opening/CTA/filler/CJK.
8. P1/Ollama logs remain isolated from P2 console.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL pending exact final-head/static/runtime/QA closeout.
- Merge: BLOCKED.

## Next permitted action
PM reverifies PR #56 exact final head/files/checks/comments. If consistent, Owner updates the existing LONG012 directory to that exact head and runs the required checks/runtime. Do not merge.
