# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
MERGED_HEAD_CODE_RECHECK_PASS_STATIC_AND_OWNER_TWO_MODE_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Corrective P1 source originally reviewed at `7b217c7b73e98375bcf5ff2bcb24a92c8fa61796`.
- Voice Render PR #50 merged at `3c7d47ca08c1e7a93365223a184d47e29c2175c0`.
- P1 merged-head recheck basis: `19677fbdbfe6d7910281307b387e15c007ab0282`.

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

## Completed side task
Voice Render shared-library/long-text work is merged and no longer blocks this P1 task. Accepted clone-safe default is 300 with Owner runtime PASS and static PASS.

## Merged-head review result
GitHub compare from `7b217c7...` to `19677fb...` shows P1-specific renderer/validator/Standard IPC source did not change after the prior P1 corrective review. The later application changes are the completed Voice Render side task plus docs.

`src/main/main.js` and `src/main/preload.js` were re-read because Voice Render changed them. Verified:
- semantic and Standard P1 IPC registration is still present;
- Standard/Semantic cancellation and P1 bridge methods remain present;
- new additions do not replace task-007 P1 routing.

Merged-head P1 code review: PASS logic/scope. Runtime remains required.

## Verification required now
Run on the new current exact PR #48 HEAD after this docs synchronization:
- `git rev-parse HEAD`;
- `node --check src/main/main.js`;
- `node --check src/main/preload.js`;
- `node --check src/main/p1-standard-vision-ipc.js`;
- `node --check src/main/p1-standard-vision-wrapper.js`;
- `node --check src/renderer/js/pipeline1-run-config.js`;
- `node --check src/renderer/js/pipeline1-analysis.js`;
- `node --check src/renderer/js/pipeline1-semantic-validator.js`;
- recommended `node --check src/renderer/js/pipelines/pipeline1-ai.js`;
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.

Owner runtime A — Standard/default OFF:
- control defaults OFF;
- log says `ScriptMode=standard`;
- normal continuous script/TTS completes;
- Standard v4 artifacts and non-authoritative empty semantic plan;
- P1->P2 gate remains valid.

Owner runtime B — Semantic ON:
- explicitly enable before Start;
- log says `ScriptMode=semantic-remix`;
- same/equivalent 97.57s source;
- result either passes deterministic guard with coherent scene/timing/claim artifacts or fails closed before accepted semantic artifact/TTS/downstream unlock;
- if pass, inspect fresh `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS for merged-head logic/scope.
- Owner Standard: NOT STARTED.
- Owner Semantic: NOT STARTED after correction.
- Documentation synchronization: IN PROGRESS until handoff/PR metadata match the latest docs head.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.
