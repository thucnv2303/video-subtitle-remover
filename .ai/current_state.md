# Current State

## Status
PIPELINE1-STANDARD-LONG-VIDEO-012 — REVISION 3 CHUNKED SOURCE PUBLISHED / PM REVIEW PASS / STATIC WAITING / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55.
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Revision-2 application source: `6e047bf120dde6543386c50c725bf8f73418d441`.
- Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`.
- Revision-3 spec commit: `628fae6cde8ee3a9a82fb26fd65ca44acae68b66`.
- Revision-3 application source: `f00b5e8711ec737ad5c474987647171161226cb5`.
- Active bug: `BUG-041`.

## Owner runtime basis — Revision 2 FAIL
Latest ~497.1s Standard run completed ASR, 80-keyframe/10-chunk Vision and global reasoning. Hard target was 7792-8202 chars. The prior grammar HTTP 400 was gone, but both monolithic recompose attempts completed at only ~1610 chars and failed before TTS.

## Revision 3 implementation
Only `src/main/p1-standard-vision-wrapper.js` changes application behavior from the prior branch head.
- Long target trigger: >3200 chars with at least 2 Vision chunks.
- Chronological contiguous section planning, aiming around <=1650 chars per section.
- Global min/target/max budget is allocated proportionally to section timeline duration, accounting for join separators.
- Each section receives only overlapping SRT and local Vision chunks/scenes.
- Section requests run sequentially on the same reasoning model; no concurrent GPU inference.
- Each section has at most one retained-candidate retry for retryable JSON/length/quality failures.
- Continuity is preserved by a compact global brief plus up to the last 3 sentences / 520 chars from the previously accepted section.
- Only section 1 may open; only the final section may conclude/CTA; middle sections must continue directly.
- Accepted sections are joined into exactly one continuous narration, then original global hard-length + ZERO-CJK + repetition gates run fail-closed.
- There is no final monolithic AI rewrite.
- TTS ordering is unchanged: TTS receives one joined narration only after `Standard duration guard PASS`.

## PM source review
PASS for scope/logic review of source commit `f00b5e87...`.
- Compare `98052170... -> f00b5e87...` changes exactly one application file: `src/main/p1-standard-vision-wrapper.js` (+337/-4).
- Short/medium single-request path remains.
- Long section planning is chronological and bounded.
- No TTS/P2/P3/renderer/Prompt Manager/Remix/log/dependency source was changed.
- Exact runtime/static execution is still required; no release PASS is claimed.

## Semantic Remix / Owner build policy
PR #54 remains the per-Job Semantic Remix source. PR #55 by itself does not contain that sibling renderer change.
Owner requested no further clone/worktree directories. Future Owner tests must reuse one existing test directory/worktree and switch/fetch the approved remote ref; do not create additional `owner-test-*` folders.
Before the next product-level Owner test, PM should create one explicit integration review branch on GitHub that combines the verified long-video source with per-Job Remix, rather than asking Owner to test another isolated sibling build.

## Gates
- Revision-3 Execution: PASS.
- Revision-3 Automated/static: WAITING.
- Revision-3 Code review: PASS (logic/scope only).
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL pending final-head static/runtime/QA closeout and integration state.
- Merge permission: BLOCKED.

## Next permitted action
Create/review a GitHub-only integration branch containing Revision 3 long-video + per-Job Semantic Remix, with no new local clone/worktree. Then give Owner commands that reuse the existing LONG012 test directory and verify the exact integration HEAD before runtime.
