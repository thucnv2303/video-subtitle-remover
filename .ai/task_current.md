# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
CORRECTIVE_SOURCE_PUBLISHED_STATIC_AND_OWNER_TWO_MODE_RETEST_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Corrective source head before docs sync: `643d8d4aba616512554fe27e3c2535806d80b024`.

## Owner outcome
Semantic Remix must be optional. If the user does not enable it, P1 creates a normal script as before. If enabled, P1 performs the richer video/product/customer/scene remix analysis.

## Implemented
1. New compact Semantic Remix checkbox is injected into Pipeline 1 run configuration.
2. Preference key `p1_semantic_remix_enabled` defaults to false.
3. Start snapshots `semanticRemixEnabled` into every idle Job; running Jobs do not read live UI state.
4. Standard mode uses the exact pre-semantic multimodal reasoning implementation from starting SHA `9981da...`, isolated under distinct IPC handlers.
5. Standard artifacts use `multimodal-standard-script-v4`, `semantic_remix_enabled:false`; semantic edit plan is `authoritative:false` and empty.
6. Semantic mode alone uses `multimodal-semantic-remix-v4` and may publish an authoritative P3 candidate edit plan.
7. BUG-036 semantic prompt now explicitly requires strategy/beat/narration coherence and correct action-to-scene grounding.
8. New renderer semantic validator rejects inconsistent target/beat duration, unsupported process-to-scene mappings, CTA mapped away from available final scenes, selected unsupported hard claims, and narration coverage outside 70–130% of beat target duration.
9. Bad semantic output fails before artifact persistence/TTS rather than unlocking P2 with a misleading plan.
10. No P2/P3/TTS-engine/dependency change was made.

## Preserved behavior
- One continuous narration/TTS.
- BUG-034: no hard 95–100% original-source narration occupancy requirement and no second LLM/TTS pass solely to fill source duration.
- Existing P1 queue/error isolation remains unchanged by task-007 routing.
- P3 semantic cut/reorder implementation remains out of scope and blocked.

## Required verification
Static on exact final head:
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/main/p1-standard-vision-ipc.js`
- `node --check src/main/p1-standard-vision-wrapper.js`
- `node --check src/renderer/js/pipeline1-run-config.js`
- `node --check src/renderer/js/pipeline1-analysis.js`
- `node --check src/renderer/js/pipeline1-semantic-validator.js`
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`

Owner manual verification on exact final head must cover two runs:
- Standard/default OFF: normal continuous script/TTS completes; artifacts identify standard mode; semantic edit plan empty/non-authoritative.
- Semantic ON: same/equivalent 97.57s source; output either passes all guards with coherent scene mapping/timing/claims or fails closed with a specific semantic guard error. If it passes, inspect all four v4 JSON artifacts again.

## Gates
- Execution: PASS for corrective source publication.
- Automated/static: WAITING.
- Code review: WAITING final corrective PM review.
- Owner Standard mode: NOT STARTED.
- Owner Semantic mode: NOT STARTED after correction.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
- P3 semantic cut/reorder: BLOCKED.