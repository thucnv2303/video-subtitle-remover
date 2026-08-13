# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
D016_SOURCE_STATIC_REVIEW_PASS_OWNER_STANDARD_RETEST_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Prior static-tested application state: `59925b05afef7071cdd478209d4c54732b611d78`.
- D-016 source correction: `41a4a429bfe7dfe17fbd2113f4019733656359ce`.
- Regression defect: BUG-037.

## Corrective contract
Standard remains default. If its grounded first draft is below the voice-aware minimum, one evidence-backed AI recompose runs before TTS using full transcript, accumulated Vision evidence, source duration and selected voice/speed-derived rate. Repaired narration must enter the hard budget and remain grounded; filler, repetition and unsupported claims fail closed. TTS remains one continuous synthesis with no repeated post-TTS duration loop. Semantic Remix remains opt-in and keeps its own strategy/beat duration rules.

## Verification
- Execution: PASS.
- GitHub compare proves D-016 changes only `src/main/p1-standard-vision-wrapper.js` in application source; later deltas are canonical docs.
- Full corrected wrapper reviewed from GitHub: PASS logic/scope.
- Exact corrected wrapper `node --check`: PASS.
- Unchanged application files retain prior Owner static evidence.
- Canonical D-016/BUG-037 docs and PR metadata are synchronized; PR body is updated to the final exact head after the final docs commit.

## Gates
- Execution: PASS.
- Automated/static for current application source: PASS.
- Code review: PASS logic/scope.
- Owner Standard: RETEST WAITING.
- Owner Semantic: ON HOLD until Standard PASS.
- Documentation synchronization: PASS.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.

## Next verification
Owner checks out the final exact PR head and reruns Standard with Semantic Remix OFF/default. Expected regression path: `ScriptMode=standard` -> short draft triggers `Standard duration guard` -> one evidence-backed recompose -> `Standard duration guard PASS` -> one full-text TTS. Voice should be close to source duration rather than the prior ~36.7%, while narration remains grounded and natural. Semantic retest waits for Standard PASS.
