# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
STANDARD_DURATION_CORRECTION_PUBLISHED_STATIC_AND_OWNER_RETEST_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Latest Standard duration source correction: `41a4a429bfe7dfe17fbd2113f4019733656359ce`.
- Owner duration decision recorded in D-016.

## Owner runtime finding
Standard/default OFF completed technically but accepted ~612 chars and generated ~35.82s voice for ~97.57s source (~36.7%) despite a 1529-1610 char voice-aware budget.

## Corrective contract
1. Standard Script remains default; Semantic Remix remains opt-in.
2. Standard first pass still uses the isolated multimodal reasoning implementation.
3. The selected voice/speed plus source duration define the existing 95-100% narration character budget.
4. If first-pass Standard narration is below the minimum, perform one evidence-backed AI recompose BEFORE TTS.
5. Recompose receives full transcript + accumulated Vision evidence + source duration + selected voice/speed-derived rate.
6. AI may expand grounded explanation, sequencing and transitions from analyzed video evidence even when original speech is short.
7. Filler, repetition and unsupported claims remain forbidden; existing quality/evidence checks fail closed.
8. Repaired narration must land inside the hard target range before TTS.
9. No second TTS pass is added by this correction.
10. Semantic BUG-036 guards remain unchanged.

## Verification status
- Execution: PASS for source publication.
- Direct PM full-file/diff review: PASS logic/scope for the bounded one-file correction.
- Automated/static verification: WAITING on final exact head.
- Owner Standard runtime: WAITING fresh retest.
- Owner Semantic runtime: ON HOLD until Standard PASS.
- Documentation synchronization: IN PROGRESS until handoff + PR body are updated and reverified.
- Merge permission: BLOCKED.

## Required next verification
Static on final docs/head application state:
- `git rev-parse HEAD`
- `node --check src/main/p1-standard-vision-wrapper.js`
- recommended regression syntax for `src/main/p1-standard-vision-ipc.js`, `src/renderer/js/pipeline1-analysis.js`, `src/renderer/js/pipelines/pipeline1-ai.js`
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`

Owner Standard retest after static PASS:
- Semantic Remix OFF/default;
- first short draft must log `Standard duration guard`;
- exactly one evidence-backed recompose happens before TTS;
- narration reaches the hard target character range without filler/repetition/unsupported claims;
- one continuous TTS then runs;
- measured voice should be close to source duration rather than ~36.7%;
- P1->P2 gate remains valid only after successful narration/TTS artifacts.
