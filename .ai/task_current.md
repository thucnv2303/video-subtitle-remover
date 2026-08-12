# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
CORRECTIVE_SOURCE_PUBLISHED_PM_REVIEW_PASS_STATIC_AND_OWNER_TWO_MODE_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Corrective source reviewed at `7b217c7b73e98375bcf5ff2bcb24a92c8fa61796`.
- PM review `4915748131` — PASS logic/scope only.

## User outcome
Semantic Remix is a user-selected advanced feature, not a replacement for normal script generation.

- Default/OFF: Standard Script.
- Explicit ON: Semantic Remix by scene.

## Implemented
1. P1 has a compact Semantic Remix checkbox and preference `p1_semantic_remix_enabled`, default false.
2. Start snapshots the mode into each idle Job as `job.p1Config.semanticRemixEnabled`.
3. Fresh Start clears prior duration checkpoint to prevent cross-mode analysis resume.
4. Standard mode uses the exact pre-semantic multimodal reasoning implementation from the starting ref, isolated under distinct IPC handlers.
5. Existing Stop bridge cancels both Standard and Semantic inference.
6. Standard artifacts use `multimodal-standard-script-v4`, `semantic_remix_enabled:false`; semantic edit plan is non-authoritative and empty.
7. Semantic mode alone uses `multimodal-semantic-remix-v4` and may publish an authoritative P3 candidate scene plan.
8. BUG-036 prompt now explicitly requires coherent target/beat/narration timing and correct action-to-scene grounding.
9. Renderer semantic guard rejects target/beat duration mismatch, nonexistent or semantically unsupported scene mappings for guarded actions, CTA away from available final-result evidence, selected unsupported hard claims and narration coverage outside 70–130% of beat duration.
10. Guard runs before semantic artifact persistence/TTS, so known-bad semantic plans fail closed.
11. BUG-034 remains: no hard 95–100% original-source occupancy gate and no extra LLM/TTS pass solely to fill source duration.
12. P2/P3/TTS engine/dependencies remain untouched by corrective source.

## Verification required
Exact final head must be shown with:
- `git rev-parse HEAD`;
- `node --check src/main/main.js`;
- `node --check src/main/preload.js`;
- `node --check src/main/p1-standard-vision-ipc.js`;
- `node --check src/main/p1-standard-vision-wrapper.js`;
- `node --check src/renderer/js/pipeline1-run-config.js`;
- `node --check src/renderer/js/pipeline1-analysis.js`;
- `node --check src/renderer/js/pipeline1-semantic-validator.js`;
- recommended regression `node --check src/renderer/js/pipelines/pipeline1-ai.js`;
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.

Owner runtime A — Standard/default OFF:
- control defaults OFF;
- log says `ScriptMode=standard`;
- normal continuous script/TTS completes;
- artifacts identify standard v4 and non-authoritative empty semantic plan;
- P1→P2 gate remains valid.

Owner runtime B — Semantic ON:
- explicitly enable before Start;
- log says `ScriptMode=semantic-remix`;
- same/equivalent 97.57s source;
- result either passes deterministic guard with coherent scene/timing/claim artifacts or fails closed before accepted semantic artifact/TTS/downstream unlock;
- if pass, inspect four fresh v4 JSON artifacts.

## Known limits
- Semantic lexical guard reduces known BUG-036 failure classes but cannot prove all marketing/visual interpretation correctness; Owner artifact review remains required.
- Scene windows are midpoint evidence windows, not CV scene boundaries.
- GitHub currently reports PR mergeable false; merge remains blocked independently of other gates.
- No CI/status checks are configured.

## Gates
Execution PASS; automated/static WAITING; code review PASS logic/scope; Owner Standard NOT STARTED; Owner Semantic NOT STARTED after correction; documentation synchronization PASS; P3 semantic cut/reorder BLOCKED; merge BLOCKED.