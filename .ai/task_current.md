# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Continuous Narration — Duration Policy Redesign for P1/P3

## Status
BUG034_DURATION_POLICY_REDESIGN_REQUIRED

## Authority
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Prior BUG-033 source: `77f5e2186ddb4660c9ba35de245bc8b86d297f33` + `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- Fresh Owner runtime shows BUG-033 design is still too strict and too expensive; release direction is NEEDS_REVISION.

## Fresh Owner runtime
- 97.57s source; Adaptive Vision succeeds with 25 keyframes / 4 chunks.
- Global reasoning completes in 38.8s and returns quality-clean narration of 613 chars.
- TTS pass 1: 35.91s = 36.8% of source duration.
- Controller computes measured 17.07 chars/s, target 1582–1666 chars.
- Evidence-backed second reasoning request times out at 150s.
- The exact tested `git rev-parse HEAD` was not supplied, but the runtime log proves the BUG-033 `Narration evidence-fit` path is present.

## Verified product/architecture issue
1. P1 currently blocks completion unless narration audio is 95–100% of ORIGINAL video duration.
2. That forces a second heavy 30B reasoning request even after P1 already has a coherent script and valid continuous TTS.
3. P3 is the final cut/mix/render owner and therefore is the correct stage to know the final video duration and decide bounded voice retiming.
4. Existing P3 code currently does the opposite operation: it changes VIDEO speed to match voice through `adjustVideoTempo()`.
5. The new direction is to preserve video pacing by default and, in P3, create a derived adjusted voice only when the mismatch is modest and listening quality remains acceptable.
6. P1 short narration must no longer fail merely because it leaves silence/background-music coverage in the source timeline.

## Proposed contract to research/approve before source revision
### P1
- Blocking: narration quality, grounding, valid continuous TTS, valid artifacts/source identity.
- Non-blocking telemetry: `voice_duration_ms`, `source_duration_ms`, ratio, measured chars/s.
- Remove the 95% hard minimum as a P1 completion gate.
- Do not run a second evidence-fit solely to make narration fill the original timeline.
- Keep only a pathological overlength protection so an obviously unusable narration cannot unlock P2; exact threshold requires product/quality research.

### P3
- Final timeline duration is authoritative after approved cuts/reorders.
- Preserve clean-video speed by default.
- If narration is moderately longer/shorter than final timeline, P3 may create a new pitch-preserving time-stretched voice artifact; never overwrite P1 `voice.wav`.
- P3 must regenerate/rescale subtitle timing to the derived voice.
- If required voice stretch exceeds the approved quality limit, do not silently distort speech; require edit-plan/timeline adjustment or explicit failure/warning.

## Next permitted action
Research practical high-quality speech time-stretch limits and inspect existing FFmpeg/P3 contracts. Then write an exact BUG-034 acceptance spec before source modification. Do not increase evidence-fit timeout and do not add another P1 reasoning retry.

## Gates
Execution NEEDS_REVISION; automated/static WAITING for new source; code review WAITING for new revision; Owner verification FAIL for current duration policy; docs sync PASS after BUG-034 canonical update; merge BLOCKED; Step 3 release BLOCKED.