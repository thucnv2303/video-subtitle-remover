# Current Task

## Task ID
PIPELINE1-STANDARD-CJK-GUARD-008

## Status
OWNER_STANDARD_FUNCTIONAL_PASS_FOLLOWUP_OBSERVABILITY_AND_DEFAULT_PROMPT_SYNC_REQUIRED

## Authority
- Parent task: `PIPELINE1-SEMANTIC-REMIX-007`.
- Parent branch/PR: `review/PIPELINE1-SEMANTIC-REMIX-007` / #48.
- Corrective branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Corrective Draft PR: #51.
- Starting SHA: `7df7e45c277feb56b5a8a45195007f5e41b69638`.
- Source correction: `e2cf430971fb75d5ef794fafc6879e35ba0a608e`.
- Exact Owner-tested application-source head: `6e023808891a4c5ff5e886aa62a18838c7fb42ae`.

## Verified source/static state
- Source publication: PASS.
- Source isolation: PASS — only `src/main/p1-standard-vision-wrapper.js`, +14/-4 from starting SHA.
- Owner exact-head Node syntax for wrapper + IPC: PASS.
- Owner exact-head `git diff --check`: PASS.
- Owner worktree clean at static verification.
- Code review: PASS for the prompt-contract correction.

## Owner runtime result — 2026-08-14
Owner reports:
- app runs well;
- Standard AI narration/script is correct;
- voice rendering is stable.

Owner Standard functional outcome is therefore PASS for the corrected configured prompt.

## Follow-up defects discovered during closeout
### BUG-039 — P1 log observability
- P1 card console is hard-capped at 100 DOM entries and removes the oldest lines.
- Global Python stdout is cloned into P1 console.
- Routine successful background `/api/health`, `/api/tts/status`, `/api/gpu-info` access logs appear even with no P1 Job.
- Voice Render/global status refreshes legitimately make those requests; the P1 console should not present them as Job activity.

### BUG-040 — stale product default prompt
- `src/renderer/js/components/prompt-manager.js` still seeds a subtitle-translation/SRT-oriented default prompt.
- `pipeline1-run-config.js` snapshots the selected/default prompt into P1 runs.
- Owner success required manually replacing the configurable prompt with the corrected continuous-narration / ZERO-CJK contract.

## Gates
- Execution: PASS.
- Automated/static: PASS.
- Code review: PASS.
- Owner Standard runtime: PASS for corrected configured prompt.
- Owner Semantic: DEFERRED.
- Documentation synchronization: PASS after current corrective sync.
- Merge: BLOCKED.

## Next task
`PIPELINE1-LOG-OBSERVABILITY-009` — narrow stacked task from the synchronized PR #51 head. Fix only P1 log retention/noise routing and project knowledge. No AI/TTS/P2/P3 behavior change. Default-prompt source synchronization remains a separate follow-up task after log observability is runtime-verified.
