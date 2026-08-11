# QA Checklist

## Active task
`PIPELINE1-FINAL-RUNTIME-GUARDS-005`

## Source/scope
- [x] Dedicated branch `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005` from exact adaptive head `0f668866dba2a38053080627872229e9ed85addd`.
- [x] Draft PR #46 targets `review/PIPELINE1-ADAPTIVE-VISION-004`.
- [x] Application-source changes limited to `src/renderer/js/pipeline1-run-ux.js` and `src/renderer/js/pipelines/pipeline1-ai.js`.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes.
- [x] PM source/diff review PASS `4904862077`.

## Deterministic duration checks
- [x] 94% exported voice ratio is rejected.
- [x] 95% is accepted.
- [x] 100% is accepted.
- [x] 101% is rejected.
- [x] 120% initial ratio calculates 81.25% text-scale toward a 97.5% target.
- [x] Legacy 9000ms reported TTS + fixed 1000ms export tail normalizes to 10000ms exported duration.
- [x] Source review confirms at most one script-fit request and one re-TTS request.
- [x] Source review confirms repaired SRT must keep segment count/timestamps.
- [x] Source review confirms repaired `remix_script.srt` and `remix_script.json` are synchronized before success.
- [x] Source review confirms second out-of-range TTS throws before P1 artifact-ready success.

## Static checks still required
- [ ] Exact `node --check src/renderer/js/pipeline1-run-ux.js` on final head.
- [ ] Exact `node --check src/renderer/js/pipelines/pipeline1-ai.js` on final head.
- [ ] Exact `git diff --check 0f668866dba2a38053080627872229e9ed85addd..HEAD`.
- [ ] GitHub CI/status checks — none configured.

## Owner evidence already observed
- [x] Latest adaptive short-input batch completes all supplied Jobs.
- [x] Absolute path handling / ASR / adaptive Vision path no longer blocks supplied Jobs.
- [x] Multi-job continuation remains functional in prior evidence.

## Fresh Owner runtime — BLOCKING
- [ ] While Job A is processing, click Job B; detail stays on B until another manual selection.
- [ ] Job A continues processing normally while B is inspected.
- [ ] Run a narration case that previously exceeded video duration.
- [ ] Log reports `video=...`, `voice-export=...`, ratio and 95–100% gate.
- [ ] If pass 1 is outside range, exactly one script-fit event occurs.
- [ ] Exactly one TTS regeneration occurs after repair.
- [ ] Successful final ratio is >=95% and <=100% inclusive.
- [ ] If pass 2 remains outside range, Job becomes error and P2 remains locked.
- [ ] Repaired content displayed/artifacts correspond to the accepted final voice.
- [ ] Existing adaptive Vision, popup/retry, spinner, file-path and OmniVoice-release behavior remains functional.
- [ ] >60s input demonstrates adaptive >8 keyframes and multiple <=8-frame chunks before final merge approval.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner NOT STARTED on PR #46; documentation sync PASS after docs publication; merge BLOCKED; Step 3 BLOCKED.
