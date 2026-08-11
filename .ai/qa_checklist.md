# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006`

## Corrective source basis
- [x] Active branch `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Owner-failed tested head recorded: `5d247d8ee37fc8370a3f05983eeac7cfc850e444`.
- [x] Corrective source commit: `1c028612900b1180aa8c1e66da2d769373793c91`.
- [x] Corrective compare from `ecb733b...` changes exactly one application source file: `src/main/p1-vision-ipc.js`.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Corrective logic review
- [x] Clone initial narration estimate calibrated closer to observed Owner continuous voice rate.
- [x] Final reasoning schema is generated from narration budget and carries `minLength/maxLength` for `narration_script`.
- [x] Narration-fit schema is generated from measured repair budget and carries `minLength/maxLength`.
- [x] Explicit code validation rejects final/repair narration outside budget.
- [x] A bad narration repair cannot proceed to the final re-TTS.
- [x] Short final JSON caps summary/string lengths, insight arrays, edit-plan count and edit-notes count.
- [x] Compact final objects disallow additional properties.
- [x] Short global reasoning output floor is reduced from 900 to 520 tokens.
- [x] Narration-only repair uses a separate smaller output budget floor of 260 tokens.
- [x] Vision evidence is compacted before being sent to global qwen reasoning.
- [x] Owner-selected reasoning model remains unchanged.
- [x] Existing 150s short-video timeout remains a finite safety bound.
- [x] Continuous `/api/tts/generate`, max one fit + one final TTS, queue auto-advance, manual browsing and P2 fail-closed behavior are preserved.

## Deterministic evidence completed
- [x] `280` chars is rejected for a `391–412` repair range.
- [x] Example short reasoning budget is below the old 900-token floor.

## Exact static checks — BLOCKING BEFORE OWNER RETEST
- [ ] `node --check src/main/p1-vision-ipc.js` on final docs/head.
- [ ] `node --check src/main/preload.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] GitHub CI/status checks — none configured; absence is not CI PASS.

## PM review — BLOCKING
- [ ] Final PM review decision for corrective source after exact static/diff evidence.

## Fresh Owner runtime — BLOCKING
- [ ] Re-run the same 24.30s + 17.60s two-Job sequence on exact final head.
- [ ] Job 1 initial narration falls within its initial voice/video character budget before first TTS.
- [ ] If Job 1 pass 1 misses 95–100%, measured repair target is logged.
- [ ] If repair target is e.g. 391–412, repaired narration must actually be 391–412 before re-TTS; an out-of-range repair must fail before second TTS.
- [ ] Final successful voice ratio is 95–100% inclusive.
- [ ] No segmented `/api/tts-retry` narration path reappears.
- [ ] Job 2 global qwen reasoning completes within the 150s safety bound or fails clearly without stalling the queue.
- [ ] After Job 1 finishes/fails, Job 2 auto-starts without manual intervention.
- [ ] Manual Job browsing remains usable while another Job is processing.
- [ ] Existing adaptive Vision/file-path/popup/retry/spinner behavior does not regress.
- [ ] Before ultimate P1 merge approval, a >60s input demonstrates >8 adaptive samples and multiple Vision chunks with <=8 frames each.

## Gates
Execution PASS for corrective source; automated/static PARTIAL; code review WAITING; Owner corrective retest NOT STARTED; documentation synchronization PASS after docs publication; merge BLOCKED; Step 3 BLOCKED.