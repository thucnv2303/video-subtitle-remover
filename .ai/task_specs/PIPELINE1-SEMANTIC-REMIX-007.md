# PIPELINE1-SEMANTIC-REMIX-007

## Goal
Add an optional Semantic Remix mode to Pipeline 1 without replacing the normal script workflow.

- Default: `Kịch bản bình thường`.
- Opt-in: `Semantic Remix — phân tích & dựng lại theo cảnh`.
- P1 still owns analysis/script/TTS/artifacts only.
- P2 remains subtitle-removal only.
- P3 semantic cut/reorder remains blocked until Semantic Remix passes Owner verification.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Starting ref: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- BUG-034 remains inherited: P1 does not force narration to occupy 95–100% of the original source timeline.
- BUG-036 was confirmed by Owner v4 artifacts: incorrect beat-to-scene mapping, unsupported claims, 75s strategy vs 50s beat plan, and ~30s narration against that plan.

## Product mode contract
### Standard Script — DEFAULT
- UI preference key: `p1_semantic_remix_enabled`.
- Missing/invalid preference means `false`.
- Start snapshots `semanticRemixEnabled: false` into each idle `job.p1Config`.
- Uses the known pre-semantic multimodal reasoning contract: original-video ASR + adaptive Vision + compact global reasoning -> one normal continuous Vietnamese narration.
- It does not require video/product/customer marketing profiles or semantic remix beats.
- It does not publish an authoritative semantic cut/reorder plan for P3.
- Artifacts remain available for audit/compatibility.
- Changing the UI after Start must not mutate a running Job.

### Semantic Remix — OPT-IN
- Enabled only when the user explicitly checks the Semantic Remix control before Start.
- Start snapshots `semanticRemixEnabled: true` into each idle `job.p1Config`.
- Uses the semantic v4 path: original video -> ASR + adaptive Vision -> canonical scene inventory -> video/product/customer profiles -> strategy -> beats -> continuous narration -> P3 candidate edit plan.
- P1 does not cut/render the final video.

Runtime logs must expose `ScriptMode=standard` or `ScriptMode=semantic-remix`.

## Standard reasoning isolation
The pre-semantic reasoning implementation from the exact task starting ref is preserved as an isolated module:
- `src/main/p1-standard-vision-ipc.js` is the exact pre-semantic `p1-vision-ipc.js` blob from starting SHA `9981da...`.
- `src/main/p1-standard-vision-wrapper.js` registers only its analysis/cancel handlers under distinct Standard IPC names.
- Shared audio persistence/fit handlers remain owned by the current `p1-vision-ipc.js` and are not registered twice.

This deliberate isolation preserves known normal-script behavior without replacing or broadly rewriting the large current semantic IPC implementation.

## Vision evidence contract
Semantic mode canonicalizes Vision evidence after all chunks:
- globally unique `index`;
- `chunk_index`;
- `time_sec`;
- deterministic midpoint `start_sec` / `end_sec`;
- `visual`;
- `speech_context`;
- `purpose`.

Midpoint ranges are deterministic MVP evidence windows, not CV-accurate scene-boundary detection.

Standard mode may retain pre-semantic chunk-local scene evidence because those scenes are audit evidence only and are not authoritative P3 edit references.

## Semantic reasoning output
Semantic mode requires:

`video_profile`
- content type, primary goal, story structure, visual style, pacing, strengths, weaknesses.

`product_profile`
- product/subject, category, value proposition, features, benefits, proof points, unknowns.

`customer_profile`
- target audience, pains, desires, objections, awareness, buying motivation.
- This is a planning hypothesis; weakly supported inference must not become a hard product claim.

`remix_strategy`
- objective, angle, hook, story arc, CTA, `target_duration_sec`, rationale.

`remix_beats[]`
- `beat_index`;
- role: hook | problem | product | demo | benefit | proof | transition | cta | custom;
- `message`;
- `source_scene_indexes[]`;
- edit action: keep | trim | reorder | montage;
- `target_duration_sec`;
- `reason`.

`narration_script`
- one continuous grounded Vietnamese narration;
- newly composed from the strategy rather than literal line-by-line translation;
- must not invent unsupported process/product/health/composition claims.

`edit_notes[]`
- short production notes only.

## BUG-036 corrective layer
The semantic main-process contract still performs structural validation. A second deterministic renderer validation layer must reject semantic output before artifact persistence/TTS when runtime content is internally inconsistent.

Required renderer checks:
1. Strategy target must be positive.
2. Sum of beat target durations must match strategy target within `max(2s, 5%)`.
3. Every referenced scene must exist.
4. Process/action terms in a beat must be supported by the referenced scene evidence for guarded operations including mold/shape, steam, bake, wash/peel/soak, mix/syrup, cook/stir and filling.
5. A CTA must reference final-result evidence when such evidence exists in the late source scenes.
6. High-risk unsupported claims such as `dễ tiêu hóa`, `an toàn`, `nguyên chất`, `không pha tạp`, health/treatment claims must fail if absent from source evidence.
7. Predicted narration duration from configured character rate must be within 70–130% of the summed narrated beat target.
8. Existing deterministic CJK/repetition narration quality gate remains active in main-process semantic reasoning.

Semantic prompt is also strengthened with the same rules so the model has a chance to produce a valid plan on its normal structured reasoning attempt/retry.

No extra LLM pass is added solely to fill duration. If a semantic plan still fails the renderer guard, the Job fails closed rather than publishing a misleading edit plan.

## Duration semantics
### Standard mode
- No semantic target duration is authoritative.
- Preview SRT remains source-duration compatible.
- Underlength relative to source remains non-blocking under BUG-034.

### Semantic mode
- `remix_strategy.target_duration_sec` is the intended final remix duration.
- Sum of beat target durations must reconcile with that target.
- Current task-007 contract treats all accepted beats as narrated plan beats; explicit visual-only beat semantics are deferred rather than inferred silently.
- Predicted narration duration is checked against summed beat duration, not against original source occupancy.
- P3 remains final duration/voice alignment authority after semantic editing is approved.

## Artifact contract v4
### Standard Script
- `artifact_version: 4`.
- `analysis_mode: multimodal-standard-script-v4`.
- `semantic_remix_enabled: false`.
- `scenes.json`: audit evidence.
- `multimodal_timeline.json`: transcript + sampling/scene provenance + compact standard insights.
- `remix_script.json`: authoritative continuous narration + standard metadata.
- `edit_plan.json`: `authoritative: false`, `plan: []`.
- `remix_script.srt`: source-duration compatible preview.

### Semantic Remix
- `artifact_version: 4`.
- `analysis_mode: multimodal-semantic-remix-v4`.
- `semantic_remix_enabled: true`.
- `scenes.json`: canonical globally indexed evidence + source windows.
- `multimodal_timeline.json`: transcript/provenance + video/product/customer profiles + validation telemetry.
- `remix_script.json`: strategy + beats + narration + target/predicted-duration telemetry.
- `edit_plan.json`: `authoritative: true` candidate plan with source indexes/ranges.
- `remix_script.srt`: semantic-target preview timing.

## Source scope allowed
- `src/main/p1-vision-ipc.js` — existing semantic path; no broad rewrite required for opt-in routing.
- `src/main/p1-standard-vision-ipc.js` — exact isolated pre-semantic Standard reasoning blob.
- `src/main/p1-standard-vision-wrapper.js` — distinct Standard IPC registration.
- `src/main/main.js` — register Standard wrapper.
- `src/main/preload.js` — expose Standard analysis/cancel IPC bridge.
- `src/renderer/js/pipeline1-run-config.js` — compact opt-in control + persistence + per-Job snapshot.
- `src/renderer/js/pipeline1-analysis.js` — route modes + mode-specific artifact authority.
- `src/renderer/js/pipeline1-semantic-validator.js` — deterministic BUG-036 guard.
- `src/renderer/js/pipelines/pipeline1-ai.js` only if a later checkpoint-signature fix proves necessary.
- canonical `.ai/` files.

## Source scope forbidden
- No P2 changes.
- No P3 cut/reorder implementation in task 007.
- No backend TTS-engine rewrite.
- No new dependencies.
- No CV scene-boundary dependency.
- No extra reasoning pass solely for duration.
- No broad UI redesign.
- No unrelated formatting/refactor.

## Acceptance criteria
1. Semantic Remix control exists and defaults OFF.
2. Start snapshots the selected mode per idle Job.
3. Standard mode runs the isolated normal-script reasoning path, creates one continuous narration/TTS, and emits `multimodal-standard-script-v4` with non-authoritative empty semantic edit plan.
4. Semantic mode alone emits `multimodal-semantic-remix-v4` profiles/beats/P3 candidate mapping.
5. Bad semantic plans like Owner Job `kkx59hfu0` must fail before artifact publication/TTS because target 75s vs beat sum 50s and incorrect mold/CTA scene mappings violate deterministic guards.
6. Unsupported claims exposed by the Owner artifact must not pass the guard.
7. Semantic narration predicted duration must plausibly cover the beat plan.
8. BUG-034 remains: no 95–100% original-source occupancy gate and no second LLM/TTS pass solely to fill source duration.
9. Existing queue isolation/retry behavior remains intact.
10. P2/P3 source behavior remains unchanged.
11. UI mode changes after Start do not alter an already-running Job.

## Required verification
Static, on exact final head:
- `node --check src/main/main.js`.
- `node --check src/main/preload.js`.
- `node --check src/main/p1-standard-vision-ipc.js`.
- `node --check src/main/p1-standard-vision-wrapper.js`.
- `node --check src/renderer/js/pipeline1-run-config.js`.
- `node --check src/renderer/js/pipeline1-analysis.js`.
- `node --check src/renderer/js/pipeline1-semantic-validator.js`.
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.

Owner manual verification must cover BOTH modes on exact HEAD.

Standard mode:
- Semantic Remix OFF/default.
- P1 completes with normal continuous narration/TTS.
- Artifacts say `multimodal-standard-script-v4` / `semantic_remix_enabled:false`.
- `edit_plan.json` is non-authoritative and empty.

Semantic mode:
- Explicitly enable Semantic Remix.
- Rerun same/equivalent 97.57s source.
- Inspect `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.
- Verify coherent target/beat/narration timing, correct action-to-scene mapping, final CTA mapping and no unsupported claims.
- Exact tested `git rev-parse HEAD` is mandatory.

## Gates
Current corrective source is published but unverified. Automated/static verification, PM full code review, Owner Standard PASS, Owner Semantic artifact/runtime PASS, documentation synchronization and explicit PM merge approval remain mandatory. Merge remains BLOCKED.