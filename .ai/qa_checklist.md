# QA Checklist

## Active task
`PIPELINE1-SEMANTIC-REMIX-007 — Optional Semantic Remix with Standard Script Default`

## Review basis
- [x] Branch `review/PIPELINE1-SEMANTIC-REMIX-007`.
- [x] Draft PR #48.
- [x] Base `9981da334ca10fd845c971241d541894d736c13b`.
- [x] D-016 requires Standard to use full ASR + Vision + source duration + selected voice/speed to build grounded near-timeline narration before TTS.
- [x] BUG-037 records the latest underfilled+CJK ordering failure.
- [x] Prior candidate-retention correction: `0fb72b4f421891a20b6574564f90886f6a108356`.
- [x] Latest pre-TTS ordering correction: `c8fecb95164c39fe82cddf24711ccfc3386d23c6`.
- [x] No P2/P3/TTS-engine/dependency change in the latest correction.

## Mode routing invariants
- [x] Standard remains default / Semantic Remix OFF.
- [x] Semantic remains explicit opt-in.
- [x] Per-Job mode snapshot remains unchanged.
- [x] Standard and Semantic continue to use isolated analysis IPC paths.
- [x] Semantic BUG-036 validation behavior is unchanged.

## Latest Standard failure — verified runtime
Owner run on the prior PR #48 flow proved:
- [x] source duration ~97.57s;
- [x] voice-aware Standard budget 1529-1610 chars;
- [x] Vision + global reasoning completed;
- [x] draft quality detected `CJK_CHARACTERS`;
- [x] standalone `Narration quality` repair failed `CJK_CHARACTERS`;
- [x] grounded Standard pre-TTS recompose was never reached;
- [x] TTS did not run.

## Verified root cause
- [x] Under-min draft quality repair ran inside `p1-standard-vision-ipc.js` before analysis returned to the wrapper.
- [x] That standalone repair did not own the full transcript + Vision grounded recomposition responsibility.
- [x] Therefore quality failure could terminate Standard before D-016 duration/quality recompose.
- [x] Global prompt still implied underfill could be addressed later, conflicting with the accepted pre-TTS policy.

## Corrected source contract — `c8fecb95...`
- [x] Under-min Standard drafts do not run the standalone quality-repair request first.
- [x] Deterministic draft quality is still evaluated and returned.
- [x] Under-min draft reaches `p1-standard-vision-wrapper.js`.
- [x] Existing wrapper recompose receives the draft, full transcript and accumulated Vision evidence.
- [x] Hard Standard narration range remains mandatory before TTS.
- [x] CJK/repetition quality checks remain mandatory before TTS.
- [x] Prior retry candidate-retention behavior remains in place.
- [x] Global prompt now states under-min drafts are recomposed by the Standard pre-TTS guard before TTS.
- [x] No post-TTS duration-repair loop was introduced.
- [x] Semantic, P2, P3 and TTS engine are unchanged.

## Static verification — BLOCKING
Run on the final PR head:
- [ ] `git rev-parse HEAD` equals the exact PR #48 head.
- [ ] `node --check src/main/p1-standard-vision-ipc.js`.
- [ ] `node --check src/main/p1-standard-vision-wrapper.js`.
- [ ] `git diff --check f03ab512b25fb0193b17b3468d5ac865d3c0c2d1..HEAD`.
- [ ] No unexpected application file changed after `c8fecb95...`.

PM container currently cannot resolve GitHub, therefore local exact-head static evidence must come from the Owner worktree. Automated/static remains WAITING until command output is supplied.

## Owner manual run A — Standard/default OFF
Run only after all static commands PASS.
- [ ] exact `git rev-parse HEAD` matches PR #48 head;
- [ ] Semantic Remix OFF/default;
- [ ] `ScriptMode=standard`;
- [ ] ASR/Vision/global reasoning completes;
- [ ] if narration is under-min, log indicates standalone quality repair is deferred to Standard pre-TTS guard;
- [ ] grounded Standard recompose starts before TTS using full transcript + Vision evidence;
- [ ] if first recompose candidate is rejected, retry edits the rejected candidate rather than restarting from original short draft;
- [ ] final narration is within hard voice-aware range;
- [ ] final narration passes CJK/repetition quality checks;
- [ ] Standard duration/pre-TTS guard PASS appears before TTS;
- [ ] exactly one continuous full-text TTS runs;
- [ ] accepted narration has no filler/repetition/unsupported claims;
- [ ] measured voice is materially close to source duration;
- [ ] Standard v4 artifacts remain valid;
- [ ] P1->P2 unlock only after valid narration/TTS artifacts.

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
- Automated/static: WAITING on final exact-head command output.
- Code review: WAITING final static confirmation.
- Owner Standard: FAIL on prior flow; corrected retest WAITING after static PASS.
- Owner Semantic: ON HOLD until Standard PASS.
- Documentation synchronization: PASS once dynamic docs/bug ledger/PR body are aligned to the final docs head.
- Merge: BLOCKED.
