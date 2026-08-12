# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — QUALITY-GATE CODE REVIEW PASS / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Prior corrective source: `1c028612900b1180aa8c1e66da2d769373793c91` / PM review `4906247596`.
- Narration-quality source commit: `00e80aea06d526b34518dd069f9b1c581c80e77c`.
- PM narration-quality review: `4912002868` — PASS for logic/scope, not release PASS.
- Task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner evidence now closed
1. Short two-Job corrective run: Owner reported both Jobs successful.
2. Static verification on the prior tested/docs head: all four requested `node --check` commands and `git diff --check 68c750...HEAD` returned clean.
3. Long-video runtime: `97.57s` source -> `25` adaptive keyframes / `4` chunks with frame counts `8/8/8/1`; all Vision chunks completed.
4. Long-video global reasoning completed in `48.2s`; continuous TTS produced `94.62s`, ratio `97.0%`; P1 completed and unlocked P2.
5. Therefore adaptive >60s coverage, multi-chunk <=8-frame behavior, bounded global reasoning, continuous TTS and final duration gate all have Owner runtime evidence.

## New Owner blocker — BUG-031
The same 97.57s run produced a `1610`-character narration at the exact upper character bound. The ending repeated the same value/CTA sentences multiple times and contained stray CJK text (`饱满`). Duration passed, but narration quality failed. Merge remains blocked.

## Verified root cause
- Existing code constrained narration length and duration but did not have a deterministic narration-quality gate.
- The initial JSON schema treated the lower character bound as hard, encouraging the model to pad text to satisfy length.
- Prompt-only instructions against repetition were insufficient.

## Quality-gate correction published and reviewed
Source commit `00e80aea...` changes only `src/main/p1-vision-ipc.js` relative to prior head `131f35c...`.

1. Initial narration lower bound is now soft: schema only enforces non-empty + upper bound before measured TTS. The model is explicitly told not to pad to the minimum.
2. Deterministic quality report rejects:
   - CJK/Han/Japanese/Korean characters in Vietnamese narration;
   - exact repeated long sentences;
   - high-similarity repeated long sentences;
   - repeated exact 10-word phrases.
3. Initial narration is quality-checked before artifacts/TTS. If bad, one narration-only quality repair is allowed without rerunning Vision.
4. Duration-fit narration is revalidated for both hard measured duration character range and narration quality before final re-TTS.
5. Quality repair explicitly requires one CTA/conclusion maximum, no filler, no repeated wording, Vietnamese-only output and subject/ingredient consistency.
6. If quality remains bad after the bounded repair, P1 fails closed rather than accepting low-quality narration.
7. No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Verification evidence
- GitHub compare `131f35c... -> 00e80aea...`: exactly one application source file changed, `src/main/p1-vision-ipc.js`.
- Direct GitHub full-source inspection completed for the quality-gate implementation.
- Deterministic helper simulation on the Owner-provided repeated/CJK narration reports FAIL with `CJK_CHARACTERS`, `REPEATED_SENTENCE`, and `REPEATED_LONG_PHRASE`; a clean Vietnamese narration reports PASS.
- PM narration-quality code review PASS for logic/scope: `4912002868`.
- Review risk: deterministic heuristics do not prove factual semantic consistency; Owner must inspect narration content during retest.
- GitHub CI/status checks: none configured.
- Exact Node syntax/diff checks on the new quality-gate final head: WAITING.
- Fresh Owner runtime on the quality-gate final head: WAITING.

## Gates
- Execution: PASS for published correction.
- Automated/static verification: WAITING on the new final head.
- Code review: PASS for logic/scope (`4912002868`).
- Owner manual app verification: WAITING fresh narration-quality retest.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Run exact static checks on the new final docs/head, then Owner retests the uploaded 97.57s video (or equivalent) and confirms: no repeated tail, no stray CJK, natural continuous Vietnamese narration, no obvious subject/ingredient contradiction, final successful voice remains 95–100%, and P1 completes. Do not merge or begin Step 3 until this evidence is recorded and PM explicitly approves merge.