# AgentOS Handoff Status

## Active task
`PIPELINE1-STANDARD-LONG-VIDEO-012`

## Status
REVISION 3 SOURCE PUBLISHED / PM REVIEW PASS / STATIC + OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`
- Revision-3 application source: `f00b5e8711ec737ad5c474987647171161226cb5`
- Bug: `BUG-041`

## Current implementation
Long Standard targets no longer depend on one ~8k generation call.
- chronological contiguous section planning;
- approximately <=1650 chars per section;
- duration-proportional local budgets;
- section-local SRT + Vision evidence;
- sequential same-model requests only;
- one retained-candidate retry per section;
- global continuity brief + previous accepted tail for transitions;
- opening only in first section, conclusion/CTA only in last;
- joined to one narration then global length/CJK/repetition gates;
- no monolithic final rewrite;
- exactly one final narration is passed downstream; TTS ordering remains after `Standard duration guard PASS`.

## Review evidence
Compare prior branch head `98052170...` -> source `f00b5e87...`: exactly one application file, `src/main/p1-standard-vision-wrapper.js`, +337/-4. PM source logic/scope review PASS. Static/runtime execution still WAITING.

## Product integration / local safety
PR #54 is still the per-Job Semantic Remix implementation; isolated PR #55 does not include it.
Owner explicitly requires no more clone/worktree folders. Future testing must reuse the existing LONG012 test directory. PM should create a GitHub-only integration branch combining Revision 3 + per-Job Remix, then Owner switches the existing directory to the exact approved integration ref.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL pending integration/final runtime/QA closeout.
- Merge: BLOCKED.

## Next permitted action
Create/review the GitHub-only integration branch. Do not create local clone/worktree directories and do not merge any PR.
