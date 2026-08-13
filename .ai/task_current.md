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
- Owner underfill defect: BUG-037.

## Required Standard behavior
1. Standard remains default; Semantic Remix remains opt-in.
2. Standard first pass uses full ASR + adaptive Vision grounded reasoning.
3. Source duration + selected voice/speed define the existing voice-aware narration budget.
4. A first draft below the minimum must trigger one evidence-backed AI recompose BEFORE TTS.
5. Recompose uses full transcript + accumulated Vision evidence + source duration + selected voice/speed-derived rate.
6. AI may add grounded explanation, visible sequence and transitions when original speech is short.
7. Filler, repetition and unsupported claims remain forbidden; invalid output fails closed.
8. Repaired narration must enter the hard budget range before TTS.
9. TTS remains one continuous full-text synthesis; no repeated post-TTS LLM/TTS duration loop.
10. Semantic BUG-036 guards remain unchanged and Semantic duration follows its own strategy/beat plan.

## Verification completed
- Execution: PASS.
- GitHub compare proves only `src/main/p1-standard-vision-wrapper.js` changed in application source after the earlier static-tested app state; all other later changes are `.ai/` documentation.
- Full corrected wrapper re-read from GitHub.
- Exact corrected wrapper `node --check`: PASS (silent success in PM container).
- PM logic/scope review for the D-016 one-file source delta: PASS.
- Unchanged application files retain prior Owner static evidence.

## Owner Standard retest — required next
- checkout final exact PR head;
- Semantic Remix OFF/default;
- log `ScriptMode=standard`;
- for severe underfill, log `Standard duration guard`;
- exactly one evidence-backed recompose before TTS;
- log `Standard duration guard PASS` before TTS;
- accepted narration inside hard target without filler/repetition/unsupported claims;
- one continuous TTS;
- measured voice close to source duration rather than prior ~36.7%;
- Standard v4 artifacts correct and P1->P2 gate valid.

## Owner Semantic retest
ON HOLD until Standard PASS. Then explicitly enable Semantic and verify BUG-036 strategy/beat/scene/claim guards and fresh v4 artifacts.

## Gates
- Execution: PASS.
- Automated/static for current application source: PASS.
- Code review: PASS logic/scope.
- Owner Standard: RETEST WAITING.
- Owner Semantic: ON HOLD until Standard PASS.
- Documentation synchronization: WAITING only for final PR body/head alignment.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.
