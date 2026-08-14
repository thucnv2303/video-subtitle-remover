# Active PM Execution Spec

Status: PIPELINE1_STANDARD_LONG_VIDEO_012_REVISION_3_SOURCE_PUBLISHED

Task: `PIPELINE1-STANDARD-LONG-VIDEO-012`
Repository: `thucnv2303/video-subtitle-remover`
Corrective review branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
Revision-3 spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012-REV3-CHUNKED.md`
Revision-3 source: `f00b5e8711ec737ad5c474987647171161226cb5`
Bug: `BUG-041`

## Revision 3 source result
`src/main/p1-standard-vision-wrapper.js` now uses chunked chronological composition for materially long Standard narration targets (>3200 chars with >=2 Vision chunks).
- section target approximately <=1650 chars;
- local budget proportional to timeline duration;
- only overlapping SRT + local Vision evidence per section;
- sequential calls, one retained-candidate retry per section;
- global subject/style brief + previous accepted tail for continuity;
- opening only first section; conclusion/CTA only final section;
- joined narration must pass original global hard length, ZERO-CJK and repetition gates;
- no final monolithic rewrite;
- TTS receives one joined narration only after `Standard duration guard PASS`.

## Review
PM source logic/scope review PASS. Compare `98052170... -> f00b5e87...` changes exactly one application file (+337/-4). Static/runtime still WAITING.

## Owner local policy
Do not create more clone/worktree directories. Reuse the existing LONG012 test directory for the next approved ref.

## Integration requirement
PR #54 is the authoritative per-Job Semantic Remix implementation. Before the next product-level Owner test, create a GitHub-only integration review branch that combines Revision 3 long-video with per-Job Remix while preserving the existing log-router import from the long-video lineage. Do not merge PRs.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS logic/scope.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.

## Next permitted action
Create/review the integration branch on GitHub only; then Owner updates the existing LONG012 directory to the exact integration HEAD and runs static/runtime acceptance.
