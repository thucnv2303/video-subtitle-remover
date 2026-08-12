# Active PM Execution Spec

Status: CORRECTIVE_SOURCE_PUBLISHED_PM_REVIEW_PASS_STATIC_AND_OWNER_TWO_MODE_WAITING

Task: `PIPELINE1-SEMANTIC-REMIX-007`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`
Draft PR: #48
Starting/base SHA: `9981da334ca10fd845c971241d541894d736c13b`
Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`

## Current product contract
Semantic Remix is optional and defaults OFF.

### Standard Script — DEFAULT/OFF
- preference `p1_semantic_remix_enabled` defaults false;
- Start snapshots `job.p1Config.semanticRemixEnabled=false` for each idle Job;
- uses isolated pre-semantic multimodal reasoning under distinct Standard IPC handlers;
- produces one normal continuous narration/TTS;
- artifacts use `artifact_version: 4`, `analysis_mode: multimodal-standard-script-v4`, `semantic_remix_enabled:false`;
- `edit_plan.json` is non-authoritative with an empty plan.

### Semantic Remix — explicit ON
- uses the semantic v4 scene/profile/strategy/beat path;
- artifacts use `analysis_mode: multimodal-semantic-remix-v4`, `semantic_remix_enabled:true`;
- BUG-036 deterministic validation runs before accepted semantic artifact persistence/TTS;
- invalid target/beat timing, guarded action-to-scene mismatches, CTA/final-scene mismatches, selected unsupported claims, or narration coverage outside 70–130% of summed beat duration fail closed.

BUG-034 remains inherited: P1 does not force narration to occupy 95–100% of original source duration and does not add another LLM/TTS pass solely to fill source duration.

P2 remains subtitle-removal only. P3 semantic cut/reorder remains blocked/not implemented in task 007.

## Review state
- Corrective source has been published on this review branch.
- PM logic/scope review is PASS; this is not release PASS.
- Canonical review basis records latest corrective source review through `7b217c7b73e98375bcf5ff2bcb24a92c8fa61796`.
- No new application-source edit is authorized by this ACTIVE routing file.

## Next executor action — VERIFICATION ONLY
After `git fetch origin`, read this file and the exact spec directly from `origin/review/PIPELINE1-SEMANTIC-REMIX-007`.
The supervisor prompt must provide the exact expected remote HEAD. If the fetched remote HEAD differs, STOP and report the mismatch.

Do not edit source or `.ai/` files. Do not commit or push.

Run and report exactly:
- `git rev-parse HEAD`
- `node --check src/main/main.js`
- `node --check src/main/preload.js`
- `node --check src/main/p1-standard-vision-ipc.js`
- `node --check src/main/p1-standard-vision-wrapper.js`
- `node --check src/renderer/js/pipeline1-run-config.js`
- `node --check src/renderer/js/pipeline1-analysis.js`
- `node --check src/renderer/js/pipeline1-semantic-validator.js`
- recommended regression: `node --check src/renderer/js/pipelines/pipeline1-ai.js`
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`

On any unexpected condition or failed command: STOP. Do not self-repair, patch, restore, reset, clean, amend, rebase, or invent another command.

## Owner verification after static PASS
A. Standard/default OFF:
- control defaults OFF;
- runtime log shows `ScriptMode=standard`;
- normal continuous narration/TTS completes;
- artifacts identify Standard v4;
- `edit_plan.json` is non-authoritative and empty;
- normal P1 -> P2 gate remains valid.

B. Semantic ON:
- explicitly enable before Start;
- runtime log shows `ScriptMode=semantic-remix`;
- use the same/equivalent 97.57s source;
- result either passes the deterministic guard with coherent scene/timing/claim artifacts or fails closed before accepted semantic artifact/TTS/downstream unlock;
- if it passes, inspect fresh `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, and `edit_plan.json`.

## Gates
- Execution: PASS for published corrective source.
- Automated/static verification: WAITING.
- Code review: PASS logic/scope only.
- Owner Standard verification: NOT STARTED.
- Owner Semantic verification: NOT STARTED after correction.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED until all required gates PASS and PM explicitly approves merge.
