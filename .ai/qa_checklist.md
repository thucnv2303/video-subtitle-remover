# QA Checklist

## Active task
`PIPELINE1-SEMANTIC-REMIX-007 — Optional Semantic Remix with Standard Script Default`

## Review basis
- [x] Branch `review/PIPELINE1-SEMANTIC-REMIX-007`.
- [x] Draft PR #48.
- [x] Base `9981da334ca10fd845c971241d541894d736c13b`.
- [x] BUG-037 records Standard severe-underfill behavior.
- [x] D-016 records Owner requirement that Standard use full ASR + Vision + source duration + selected voice/speed to build grounded near-timeline narration before TTS.
- [x] Fresh Owner runtime on `cf31b489...` captured quality-retry failure before TTS.
- [x] Quality-retry correction source commit: `0fb72b4f421891a20b6574564f90886f6a108356`.
- [x] No P2/P3/TTS-engine/dependency change in the correction.

## Mode routing invariants
- [x] Standard remains default / Semantic Remix OFF.
- [x] Semantic remains explicit opt-in.
- [x] Per-Job mode snapshot remains unchanged.
- [x] Standard and Semantic continue to use isolated analysis IPC paths.
- [x] Semantic BUG-036 validation behavior is unchanged.

## Standard duration guard — verified runtime on failed head
Owner run on `cf31b489...` proved:
- [x] source duration ~97.57s;
- [x] voice-aware Standard hard budget 1529-1610 chars;
- [x] first narration 721 chars;
- [x] `Standard duration guard` triggered before TTS;
- [x] evidence-backed recompose ran;
- [x] deterministic quality gate rejected repetition;
- [x] final failure was `REPEATED_SENTENCE` + `REPEATED_LONG_PHRASE`;
- [x] TTS did not run after invalid narration.

## Quality-retry root cause
- [x] Previous evidence-fit retry discarded the parsed rejected candidate.
- [x] Previous retry restarted from the original short narration.
- [x] Strict quality gate is retained; it is not relaxed to make the retry pass.

## Corrected source contract — `0fb72b4f...`
- [x] First recompose still uses full transcript + accumulated Vision evidence.
- [x] Parsed candidate is captured before hard length/quality failure is returned.
- [x] If a parsed candidate is rejected, that exact candidate becomes retry input.
- [x] Retry does not restart from the original short draft when a rejected candidate exists.
- [x] Retry prompt explicitly removes repeated sentences, repeated long phrases, near-duplicate wording and duplicate CTA/conclusion.
- [x] Retry prefers unused grounded evidence instead of padding/paraphrase loops.
- [x] Hard Standard narration range remains mandatory.
- [x] CJK/repetition quality checks remain mandatory.
- [x] TTS remains blocked until narration passes.
- [x] No post-TTS duration-repair loop was added.
- [x] Standard cancellation remains wired through `ollama:p1CancelStandardVision`.

## Static verification — BLOCKING
Historical static evidence remains valid only for files unchanged since the previously tested application state.

New source delta requires:
- [ ] checkout exact final PR HEAD;
- [ ] `node --check src/main/p1-standard-vision-wrapper.js`;
- [ ] `git diff --check cf31b4891d141084666c81f9324d622a51f70986..HEAD`;
- [ ] if any additional application source changes occur, rerun syntax checks for every changed application file.

PM attempted exact-head static retrieval, but the PM container cannot resolve GitHub raw hosts. Therefore automated/static is WAITING, not PASS.

## Owner manual run A — Standard/default OFF
Run only after static PASS.
- [ ] exact `git rev-parse HEAD` matches PR #48 head;
- [ ] Semantic Remix OFF/default;
- [ ] `ScriptMode=standard`;
- [ ] P1 ASR/Vision/global reasoning completes;
- [ ] severe underfill triggers `Standard duration guard`;
- [ ] first `Standard duration recompose` runs before TTS;
- [ ] if first candidate is rejected, log states retry is editing the rejected candidate rather than restarting from original short draft;
- [ ] `Standard duration quality retry` passes hard length + quality;
- [ ] `Standard duration guard PASS` appears before TTS;
- [ ] accepted narration contains no filler/repetition/unsupported claims;
- [ ] exactly one continuous full-text TTS runs;
- [ ] measured voice is materially close to source duration rather than the prior ~36.7%;
- [ ] Standard v4 artifact metadata remains correct;
- [ ] `edit_plan.json` remains non-authoritative with empty plan;
- [ ] P1->P2 unlock occurs only after valid narration/TTS artifacts.

## Owner manual run B — Semantic ON
ON HOLD until Standard PASS.
- [ ] explicitly enable Semantic Remix before Start;
- [ ] `ScriptMode=semantic-remix`;
- [ ] strategy/beat duration coherence passes;
- [ ] scene/action/CTA mappings are grounded;
- [ ] unsupported claims fail closed;
- [ ] predicted narration coverage is 70-130% of beat plan;
- [ ] inspect fresh v4 semantic artifacts if the run passes.

## Queue/regression
- [ ] failed Standard/Semantic Job does not stop the next queued P1 Job;
- [ ] manual Job browsing remains independent of processing Job;
- [ ] queued Jobs retain their snapshotted mode;
- [ ] no segmented `/api/tts-retry` narration regression;
- [ ] P2/P3 behavior unchanged.

## Gates
- Execution: PASS for source publication.
- Automated/static: WAITING on exact final head.
- Code review: PASS logic/scope for the one-file quality-retry correction, subject to static syntax confirmation.
- Owner Standard: FAIL on `cf31b489...`; corrected retest WAITING.
- Owner Semantic: ON HOLD until Standard PASS.
- Documentation synchronization: PASS once PR #48 body is aligned to the final docs head.
- Merge: BLOCKED.
