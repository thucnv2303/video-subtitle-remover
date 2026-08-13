# QA Checklist

## Active task
`PIPELINE1-SEMANTIC-REMIX-007 — Optional Semantic Remix with Standard Script Default`

## Review basis
- [x] Branch `review/PIPELINE1-SEMANTIC-REMIX-007`.
- [x] Draft PR #48.
- [x] Base `9981da334ca10fd845c971241d541894d736c13b`.
- [x] Standard duration defect recorded as BUG-037.
- [x] Owner duration behavior recorded as D-016.
- [x] D-016 source correction changes only `src/main/p1-standard-vision-wrapper.js` from prior stable app state.
- [x] No P2/P3/TTS-engine/dependency change in D-016 correction.

## Mode routing
- [x] Semantic preference key is `p1_semantic_remix_enabled`.
- [x] Missing preference defaults OFF.
- [x] Start snapshots `semanticRemixEnabled` per Job.
- [x] Runtime log exposes `ScriptMode=standard` or `ScriptMode=semantic-remix`.
- [x] Standard and Semantic reasoning use separate IPC names.
- [x] Shared audio handlers are not double-registered.

## Standard Script — D-016 source review
- [x] Standard first pass still uses full ASR + adaptive Vision + isolated normal reasoning.
- [x] Existing voice-aware narration budget remains derived from source duration + selected voice/speed.
- [x] If first narration is below the minimum budget, wrapper invokes one evidence-backed recompose before TTS.
- [x] Recompose receives full transcript + accumulated Vision evidence + source duration + selected voice/speed-derived rate.
- [x] Repaired narration must be inside hard budget before acceptance.
- [x] Existing quality/evidence failure remains fail-closed.
- [x] TTS remains one continuous full-text synthesis after narration acceptance.
- [x] No repeated post-TTS LLM/TTS duration-fit loop was added.
- [x] Standard artifacts remain `multimodal-standard-script-v4`, `semantic_remix_enabled:false`.
- [x] `edit_plan.authoritative:false` and `plan:[]` remain required.

## BUG-037 regression
Owner prior failure:
- source ~97.57s;
- Standard OFF/default;
- voice-aware budget ~1529–1610 chars;
- accepted first narration ~612 chars;
- generated voice ~35.82s / ~36.7%.

Required corrected behavior:
- [ ] same/equivalent short first draft logs `Standard duration guard`;
- [ ] evidence-backed recompose happens before TTS;
- [ ] log shows `Standard duration guard PASS` before TTS;
- [ ] accepted narration enters the hard character range without filler/repetition/unsupported claims;
- [ ] exactly one continuous TTS then runs;
- [ ] measured voice is close to source duration rather than ~36.7%, subject to natural TTS variance.

## Semantic Remix / BUG-036 source review
- [x] Semantic mode remains explicit opt-in.
- [x] Canonical global scene inventory remains active.
- [x] Profiles/strategy/beats/narration remain required.
- [x] Strategy target vs summed beats tolerance is `max(2s, 5%)`.
- [x] Missing referenced scenes are rejected.
- [x] Guarded process/action mappings require supporting scene evidence.
- [x] CTA uses available late final-result evidence when applicable.
- [x] Selected unsupported hard claims are rejected.
- [x] Predicted narration duration must be 70–130% of summed beat target.
- [x] Guard runs before semantic artifact persistence/TTS.
- [x] D-016 does not force Semantic narration to fill original-source duration.

## Static verification
Historical application state `59925b05afef7071cdd478209d4c54732b611d78` passed the required Node syntax checks and `git diff --check` by Owner. GitHub compare from that state through the D-016 correction proves the only application-source delta is `src/main/p1-standard-vision-wrapper.js`; later changes are canonical documentation.

D-016 delta:
- [x] Full corrected wrapper re-read from GitHub after publication.
- [x] `node --check` on exact corrected wrapper content: PASS (silent success in PM container).
- [x] Logic/scope review of one-file source delta: PASS.
- [ ] Owner runtime Standard retest on final exact head.
- [ ] Owner runtime Semantic retest after Standard PASS.
- [ ] GitHub CI/status: none configured; absence is not PASS.

If any additional application source changes after source commit `41a4a429bfe7dfe17fbd2113f4019733656359ce`, all affected static checks must be rerun.

## Owner manual run A — Standard/default OFF
- [ ] checkout exact final PR head and confirm `git rev-parse HEAD`;
- [ ] Semantic Remix control OFF/default;
- [ ] `ScriptMode=standard`;
- [ ] P1 ASR/Vision/global reasoning completes;
- [ ] severe underfill triggers D-016 pre-TTS recompose;
- [ ] narration quality/grounding remains natural and non-repetitive;
- [ ] one continuous TTS completes;
- [ ] Standard v4 artifact metadata correct;
- [ ] `edit_plan.json` non-authoritative with empty plan;
- [ ] P1->P2 unlock remains valid.

## Owner manual run B — Semantic ON
Run only after Standard PASS.
- [ ] explicitly enable Semantic Remix before Start;
- [ ] `ScriptMode=semantic-remix`;
- [ ] canonical scene inventory globally indexed;
- [ ] strategy target approximately equals beat target sum;
- [ ] predicted narration coverage is within 70–130% of beat plan;
- [ ] action/CTA scene mapping is semantically correct;
- [ ] no unsupported claims;
- [ ] invalid semantic result fails before accepted artifact/TTS/downstream unlock;
- [ ] inspect fresh `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json` on pass.

## Queue/regression
- [ ] failed Job does not stop next queued P1 Job;
- [ ] manual Job browsing remains independent of processing Job;
- [ ] queued Standard/Semantic Jobs retain their own snapshotted modes;
- [ ] no segmented `/api/tts-retry` narration regression;
- [ ] P2/P3 behavior unchanged.

## Gates
- Execution: PASS.
- Automated/static for current application source: PASS using prior unchanged-source static evidence + exact corrected-wrapper syntax check.
- Code review: PASS logic/scope for D-016 source delta.
- Owner Standard: RETEST WAITING.
- Owner Semantic: ON HOLD until Standard PASS.
- Documentation synchronization: PASS after canonical D-016/BUG-037 files and PR #48 metadata were aligned; final PR body is updated again after the last docs commit to its exact head.
- Merge: BLOCKED.
