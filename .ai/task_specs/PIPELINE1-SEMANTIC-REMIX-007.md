# PIPELINE1-SEMANTIC-REMIX-007

## Goal
Add an optional Semantic Remix mode to Pipeline 1 without replacing the normal Standard Script workflow, while ensuring Standard narration is long enough for the selected voice/source timeline when grounded evidence permits.

- Default: `Kịch bản bình thường`.
- Opt-in: `Semantic Remix — phân tích & dựng lại theo cảnh`.
- P1 owns analysis/script/TTS/artifacts only.
- P2 remains subtitle-removal only.
- P3 semantic cut/reorder remains blocked until Semantic Remix passes Owner verification.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- BUG-036: semantic plan safety/grounding defects.
- BUG-037: Standard accepted ~612 chars and produced ~35.82s voice for ~97.57s source despite a ~1529–1610 char voice-aware budget.
- D-016 refines Standard duration behavior without changing P3 final timeline authority.

## Product mode contract
### Standard Script — DEFAULT
- `p1_semantic_remix_enabled` defaults false.
- Start snapshots `semanticRemixEnabled:false` into the Job.
- Uses original-video full ASR + adaptive Vision + Standard multimodal reasoning.
- Produces one continuous Vietnamese narration.
- Does not publish authoritative semantic scene reorder instructions.

### Standard duration correction — D-016
The selected voice/speed plus source duration define the existing 95–100% voice-aware character budget for Standard narration writing.

Required flow:
1. Generate the normal grounded Standard draft.
2. If draft length is below `narration_budget.min_chars`, do not send it directly to TTS.
3. Run one evidence-backed AI recompose BEFORE TTS using full transcript + accumulated Vision evidence + source duration + selected voice/speed-derived speaking rate.
4. AI may expand grounded product explanation, visible process/sequence, transitions and context supported by analyzed evidence even when source speech is short.
5. Do not add filler, repeated CTA/conclusion, repeated wording, unsupported process/product/health claims or invented facts.
6. Repaired narration must enter the hard budget range and pass existing quality/evidence checks; otherwise fail closed.
7. After acceptance, run one continuous full-text TTS.
8. Do not create a repeated post-TTS LLM/TTS loop solely to chase exact duration.
9. P3 still owns final edited timeline/render alignment.

Regression expectation for the Owner ~97.57s case: an initial ~612-char draft must trigger `Standard duration guard`, be recomposed before TTS toward the ~1529–1610 char budget, then only one continuous TTS request runs.

### Semantic Remix — OPT-IN
- Explicitly enabled before Start and snapshotted per Job.
- Uses ASR + Vision -> canonical scenes -> video/product/customer profiles -> strategy -> ordered grounded beats -> continuous narration -> candidate edit plan.
- Semantic duration is validated against its own strategy/beat plan, not original-source occupancy.
- D-016 does not force Semantic narration to fill the original source duration.

## BUG-036 semantic guard
Before accepted semantic artifacts/TTS:
1. strategy target must be positive;
2. sum of beat targets must match strategy target within `max(2s, 5%)`;
3. all referenced scenes must exist;
4. guarded process/action terms must be supported by referenced scene evidence;
5. CTA must map to available late final-result evidence when applicable;
6. unsupported hard health/composition/product claims must fail;
7. predicted narration duration must be within 70–130% of summed narrated beat duration;
8. existing CJK/repetition quality checks remain active.

## Artifact contract v4
### Standard
- `artifact_version:4`;
- `analysis_mode: multimodal-standard-script-v4`;
- `semantic_remix_enabled:false`;
- `remix_script.json`: authoritative continuous narration + budget/provenance;
- `edit_plan.json`: `authoritative:false`, `plan:[]`.

### Semantic
- `artifact_version:4`;
- `analysis_mode: multimodal-semantic-remix-v4`;
- `semantic_remix_enabled:true`;
- canonical scenes/profiles/strategy/beats;
- validated candidate `edit_plan.json` may be `authoritative:true` for later P3 work only after Owner acceptance.

## Source scope allowed
- `src/main/p1-vision-ipc.js` — semantic path/shared evidence-backed fit handler.
- `src/main/p1-standard-vision-ipc.js` — isolated Standard reasoning implementation.
- `src/main/p1-standard-vision-wrapper.js` — Standard routing and D-016 pre-TTS guard/recompose.
- `src/main/main.js`, `src/main/preload.js` only for required registration/bridge.
- `src/renderer/js/pipeline1-run-config.js`, `pipeline1-analysis.js`, `pipeline1-semantic-validator.js`, `pipelines/pipeline1-ai.js` only as required by this task.
- canonical `.ai/` files.

## Forbidden scope
- No P2 implementation changes.
- No P3 semantic cut/reorder implementation here.
- No backend TTS-engine rewrite.
- No new dependency/CV scene-boundary system.
- No repeated post-TTS LLM/TTS duration loop.
- No filler/repetition/unsupported claims to satisfy duration.
- No broad unrelated refactor/UI redesign.

## Acceptance criteria
1. Semantic Remix control exists and defaults OFF.
2. Start snapshots mode per Job.
3. Standard creates v4 non-semantic artifacts and non-authoritative empty edit plan.
4. Standard severe underfill triggers exactly one grounded pre-TTS recompose; a ~612-char draft for ~97.57s must not proceed directly to TTS.
5. Recompose uses full transcript + Vision evidence + source/voice telemetry and passes hard budget + quality checks.
6. Only one continuous TTS synthesis runs after accepted narration.
7. Semantic mode alone creates profiles/beats/candidate mapping and BUG-036-invalid plans fail before accepted artifacts/TTS.
8. P2/P3 responsibilities remain unchanged.
9. Queue/mode isolation remains intact.
10. Owner verifies both Standard and Semantic modes on the final exact head.

## Required verification
Static/application source:
- previously verified unchanged files retain prior exact-source static evidence when GitHub compare proves they did not change;
- `node --check src/main/p1-standard-vision-wrapper.js` is required for the D-016 source delta;
- review exact source diff for whitespace/scope and rerun broader static if any additional application source changes.

Owner Standard retest:
- Semantic Remix OFF/default;
- same/equivalent ~97.57s source;
- log `ScriptMode=standard`;
- if first draft is short, log `Standard duration guard` then `Standard duration guard PASS` before TTS;
- one continuous TTS follows;
- resulting voice is close to source duration rather than the prior ~36.7%, subject to natural TTS variance;
- inspect `remix_script.json` and `edit_plan.json` and confirm P1->P2 gate.

Owner Semantic retest only after Standard PASS:
- explicitly enable Semantic Remix;
- verify coherent target/beat/narration timing, scene grounding, CTA mapping and no unsupported claims.

## Gates
Execution is published. Final exact-head documentation synchronization, static evidence and Owner runtime verification remain mandatory. Merge remains BLOCKED.
