# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006`

## Source/scope
- [x] Dedicated branch `review/PIPELINE1-CONTINUOUS-NARRATION-006` from exact failed parent `68c750524f9604b7799d97a2b5604d87368f889c`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Prior source review PASS `4905691792` at source head `e07c02776a5918be7a4d2c1a72b26ed3138027cc`.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes in the published revision.

## Fresh Owner runtime — RESULT: FAIL on `5d247d8ee37fc8370a3f05983eeac7cfc850e444`
- [x] Job 1 used continuous full-text `/api/tts/generate`.
- [x] Job 1 pass 1 measured exact voice duration: `16.52s / 24.30s = 68.0%`.
- [x] Repair budget was computed as `391–412` characters.
- [ ] Repair output respected the computed budget. **FAIL: returned 280 chars again.**
- [ ] Out-of-budget repair was blocked before final TTS. **FAIL: final TTS was still executed.**
- [x] Pass 2 failed closed at `16.52s / 68.0%`; P1 did not report success.
- [x] Queue isolation/auto-advance worked: Job 2 started automatically after Job 1 failed.
- [x] Job 2 adaptive Vision completed: 6 keyframes / 1 chunk; Vision phase ~28.3s.
- [ ] Job 2 compact global reasoning completed within the 150s bound. **FAIL: qwen timed out at 150s after first output at 55.5s.**

## Verified blockers from runtime + source
- [ ] Narration repair schema enforces dynamic `minLength` / `maxLength` from measured repair budget.
- [ ] Handler explicitly rejects repaired narration outside computed min/max before any re-TTS.
- [ ] Initial narration output is also explicitly validated against its voice-aware budget before synthesis or has a documented bounded tolerance.
- [ ] Short-video final schema caps nonessential arrays/string sizes.
- [ ] Short-video output token floor is reduced from current 900-token minimum to a budget proportional to the required compact artifact.
- [ ] Selected reasoning model remains unchanged; no silent fallback.
- [ ] One whole-narration repair maximum + one final TTS maximum remain enforced.
- [ ] Continuous full-text TTS and subtitle-after-synthesis behavior remain intact.

## Corrective static verification required
- [ ] Exact `node --check` on every JS file changed by the corrective source commit.
- [ ] Deterministic test: 280-char repair is rejected for a 391–412 window before re-TTS.
- [ ] Deterministic test: repaired text inside range is accepted.
- [ ] Deterministic test: short-input final token/schema budget is bounded.
- [ ] Exact `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] PM full-file + diff review of corrective source.

## Next Owner retest after corrective review PASS
- [ ] Re-run the same 24.30s Job 1 and 17.60s Job 2 sequence.
- [ ] Job 1 repair, if needed, must actually move narration into the measured target range before the second TTS request.
- [ ] Final accepted voice ratio must be 95–100% inclusive, otherwise fail closed after one correction only.
- [ ] Job 2 global reasoning must complete within its bound or return an earlier deterministic bounded-output failure rather than spend the whole timeout on oversized JSON.
- [ ] Queue auto-advance and manual Job browsing remain functional.
- [ ] Before ultimate P1 merge approval, >60s adaptive coverage still requires >8 samples and multiple <=8-frame chunks.

## Gates
Execution NEEDS REVISION; automated/static WAITING; code review INVALIDATED by Owner FAIL; Owner FAIL on `5d247d8...`; documentation synchronization PASS for failure intake; merge BLOCKED; Step 3 BLOCKED.
