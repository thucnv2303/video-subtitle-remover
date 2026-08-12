# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — OWNER QUALITY RETEST FAIL / BUG-032 / NEEDS REVISION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Owner-tested quality-gate head: `0e327f353b7be15483576233aaed126813542158`.
- Narration-quality source commit: `00e80aea06d526b34518dd069f9b1c581c80e77c`.
- PM narration-quality review: `4912002868` — prior logic/scope PASS, now invalidated for release readiness by BUG-032 runtime failure.
- Task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner runtime evidence already closed
1. Prior corrective two-Job run: Owner reported both Jobs successful.
2. Prior static bundle: four requested `node --check` commands and `git diff --check` clean.
3. Long-video technical coverage: `97.57s` source -> `25` adaptive keyframes / `4` chunks / frame counts `8/8/8/1`; all Vision chunks completed.
4. Long-video qwen reasoning previously completed in `48.2s`.
5. Prior full-text TTS duration PASS: `94.62s / 97.57s = 97.0%`.
6. BUG-031 quality defect was then corrected with a deterministic narration-quality gate and a soft initial lower-character target.

## Fresh Owner failure — BUG-032
On the new quality-gate head, the same 97.57s class of input produced:
- initial narration: `575` chars;
- TTS pass 1: `33.98s`, ratio `34.8%`;
- measured duration-fit budget: `1568–1651` chars;
- narration-fit result: still `575` chars;
- post-parse hard validator rejected it before final TTS: `narration 575 ký tự nằm ngoài budget 1568-1651 ký tự`.

## Verified root cause
- `narrationRepairSchemaForBudget()` was changed for soft quality-repair use so `minLength` became `1`.
- The same helper is also used by `ollama:p1FitNarration` for measured duration-fit.
- Therefore duration-fit still had a hard post-parse validator, but its structured schema no longer carried the measured hard minimum.
- This allowed qwen to legally return the original 575-char narration under schema, after which code rejected it.

## Corrective direction
Keep two distinct semantics while reusing one safe helper:
1. If `budget.min_chars` is supplied, schema must enforce that hard `minLength` and corresponding `maxLength`.
2. If only `max_chars` is supplied by quality cleanup, schema keeps `minLength: 1`.
3. Duration-fit remains hard-bounded before and after model output.
4. Quality cleanup remains soft-min and quality-first.
5. No P2/P3/STTN/Settings/backend/TTS-engine changes.

## Gates
- Execution: NEEDS_REVISION.
- Automated/static verification: WAITING after corrective source publication.
- Code review: INVALIDATED for release readiness by BUG-032; fresh review required after correction.
- Owner manual app verification: FAIL on `0e327f353b7be15483576233aaed126813542158`.
- Documentation synchronization: PASS after this failure intake update.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Publish the narrow BUG-032 source correction in `src/main/p1-vision-ipc.js`, inspect the exact diff/full file, run or obtain exact static checks, then Owner retests the same 97.57s case. Do not merge or begin Step 3 before fresh Owner PASS is recorded.