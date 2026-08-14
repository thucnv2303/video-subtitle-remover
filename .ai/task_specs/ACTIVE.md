# Active PM Execution Spec

Status: NO_EXECUTOR_AUTHORIZED_STANDARD_FUNCTIONAL_PASS_FOLLOWUP_PLANNING

Task: `PIPELINE1-STANDARD-CJK-GUARD-008`
Repository: `thucnv2303/video-subtitle-remover`
Active review branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
Active Draft PR: #51
Base: `review/PIPELINE1-SEMANTIC-REMIX-007@7df7e45c277feb56b5a8a45195007f5e41b69638`

## Execution authority
No executor source work is authorized by this ACTIVE file.
Task 008 application source has already been published, statically verified, code-reviewed, and functionally runtime-verified by Owner with the corrected configured prompt.

## Verified application source
- Prompt-contract source commit: `e2cf430971fb75d5ef794fafc6879e35ba0a608e`.
- Exact Owner-tested application-source state: `6e023808891a4c5ff5e886aa62a18838c7fb42ae`.
- Later known task-008 commits before this knowledge sync are documentation-only.

## Owner runtime — 2026-08-14
PASS for Standard functional outcome with corrected configured prompt:
- app runs well;
- generated narration/script is correct;
- voice render is stable.

## Open closeout follow-ups
1. `BUG-039` / planned `PIPELINE1-LOG-OBSERVABILITY-009`: P1 console truncates at 100 entries and displays routine background Python health/TTS/GPU access logs while idle.
2. `BUG-040`: product default prompt remains SRT/subtitle-translation oriented; Owner success required a manual continuous-narration / ZERO-CJK prompt replacement.

## Next execution routing
Before any source change for BUG-039:
1. Create dedicated branch `review/PIPELINE1-LOG-OBSERVABILITY-009` from the exact synchronized PR #51 head.
2. Publish a task-specific spec on that branch and make that branch's `.ai/task_specs/ACTIVE.md` point to it.
3. Re-read the exact remote branch HEAD and spec before execution.
4. No source changes are authorized on `review/PIPELINE1-STANDARD-CJK-GUARD-008` for BUG-039.

## Gates
- Task 008 Execution: PASS.
- Task 008 Automated/static: PASS.
- Task 008 Code review: PASS.
- Task 008 Owner Standard runtime: PASS for corrected configured prompt.
- Semantic: DEFERRED.
- Documentation synchronization: PASS after the corrective knowledge sync.
- Merge permission: BLOCKED.
