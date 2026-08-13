# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
STATIC_PASS_OWNER_STANDARD_THEN_SEMANTIC_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Corrective P1 source originally reviewed at `7b217c7b73e98375bcf5ff2bcb24a92c8fa61796`.
- Voice Render PR #50 merged at `3c7d47ca08c1e7a93365223a184d47e29c2175c0`.
- Merged-head P1 review basis: `19677fbdbfe6d7910281307b387e15c007ab0282`.
- Static verification application state tested by Owner: `59925b05afef7071cdd478209d4c54732b611d78`.
- Commits after that static-tested state are documentation-only state synchronization.

## User outcome
Semantic Remix is optional, not a replacement for normal script generation.
- Default/OFF: Standard Script.
- Explicit ON: Semantic Remix by scene.

## Implemented P1 behavior
1. `p1_semantic_remix_enabled` defaults false and is snapshotted into each idle Job at Start.
2. Fresh Start clears prior duration checkpoint to prevent cross-mode resume.
3. Standard mode uses isolated pre-semantic multimodal reasoning under distinct IPC handlers.
4. Existing Stop bridge cancels both Standard and Semantic inference.
5. Standard artifacts identify `multimodal-standard-script-v4`, `semantic_remix_enabled:false`; semantic edit plan is non-authoritative and empty.
6. Semantic mode alone uses `multimodal-semantic-remix-v4` and may publish an authoritative P3 candidate scene plan.
7. BUG-036 deterministic guard rejects incoherent target/beat duration, unsupported guarded scene actions, CTA away from late final-result evidence, selected unsupported hard claims, and narration coverage outside 70-130% of beat duration.
8. Guard runs before accepted semantic artifact persistence/TTS.
9. BUG-034 remains: no hard 95-100% original-source occupancy gate and no extra LLM/TTS pass solely to fill source duration.

## Verification completed
- Execution: PASS.
- Merged-head logic/scope code review: PASS.
- Automated/static verification: PASS from Owner local run on exact application state `59925b05afef7071cdd478209d4c54732b611d78` with no reported errors for the required Node syntax checks and `git diff --check`.
- PR #48 mergeability currently reports true.
- Documentation synchronization: PASS.

## Owner runtime A — Standard/default OFF
Required next:
- control defaults OFF;
- log says `ScriptMode=standard`;
- normal continuous script/TTS completes;
- Standard v4 artifacts identify `multimodal-standard-script-v4`, `semantic_remix_enabled:false`;
- `edit_plan.json` is non-authoritative with empty `plan`;
- P1->P2 gate remains valid.

## Owner runtime B — Semantic ON
Run only after Standard gate is accepted:
- explicitly enable before Start;
- log says `ScriptMode=semantic-remix`;
- same/equivalent source;
- result either passes deterministic guard with coherent scene/timing/claim artifacts or fails closed before accepted semantic artifact/TTS/downstream unlock;
- if pass, inspect fresh `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.

## Gates
- Execution: PASS.
- Automated/static: PASS.
- Code review: PASS for merged-head logic/scope.
- Owner Standard: NOT STARTED.
- Owner Semantic: NOT STARTED after correction.
- Documentation synchronization: PASS.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.
