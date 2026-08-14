# Current Task

## Task ID
PIPELINE1-STANDARD-LONG-VIDEO-012

## Status
REVISION_3_CHUNKED_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RETEST_WAITING

## Basis
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Revision-2 source: `6e047bf120dde6543386c50c725bf8f73418d441`.
- Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`.
- Revision-3 spec commit: `628fae6cde8ee3a9a82fb26fd65ca44acae68b66`.
- Revision-3 application source: `f00b5e8711ec737ad5c474987647171161226cb5`.
- Bug: `BUG-041`.

## Revision-2 runtime failure
The ~497s Standard run reached target-aware recompose without grammar HTTP 400, but both full-script calls returned only ~1610 chars against target 7792-8202 and failed before TTS.

## Revision-3 implementation
Authorized source only: `src/main/p1-standard-vision-wrapper.js`.
- Long targets >3200 chars + >=2 Vision chunks use sequential timeline sections.
- Approximate section target is <=1650 chars; observed 8k/10-chunk case plans about 5 chronological sections.
- Section min/target/max budgets are allocated by section duration and preserve the original joined hard range.
- Full SRT is filtered to each section range; compact Vision context is filtered to matching chunks/scenes.
- Requests are sequential on the same model with one retained-candidate retry per section.
- A global brief preserves subject/style consistency; each later section receives only the previous accepted tail (max 3 sentences / 520 chars) for continuity.
- Opening is allowed only in section 1; only the final section may conclude/CTA.
- Sections are compact-joined into one narration, then original global hard-length, ZERO-CJK and repetition gates run fail-closed.
- No final monolithic AI rewrite.
- TTS receives one final narration only after `Standard duration guard PASS`.

## Review
PM source scope/logic review: PASS for `f00b5e87...`.
Compare from prior branch head changes exactly one application file (+337/-4). No renderer/TTS/P2/P3/Prompt Manager/Remix/log/dependency source changes.

## Owner-test policy
Do not create additional clone/worktree directories. Reuse the existing LONG012 test directory for the next approved ref.
The next product-level test should use a GitHub integration branch combining Revision 3 with PR #54 per-Job Remix so Owner does not test another isolated build with the obsolete global Remix UI.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS (logic/scope).
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL pending final-head static/runtime/QA closeout and integration state.
- Merge: BLOCKED.

## Next action
PM creates and reviews the GitHub-only integration ref containing long-video Revision 3 + per-Job Remix. No new local clone/worktree. Owner then updates the existing LONG012 test directory to that exact ref and runs static/runtime acceptance.
