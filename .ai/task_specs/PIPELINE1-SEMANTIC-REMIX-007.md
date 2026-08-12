# PIPELINE1-SEMANTIC-REMIX-007

## Goal
Add an optional Semantic Remix mode to Pipeline 1 without replacing the normal script workflow.

Default behavior remains normal script generation. Semantic Remix is used only when the user explicitly enables it for the run.

When enabled, P1 analyzes the original video scene-by-scene, understands the video/product/customer, creates a grounded remix strategy, writes a new narration, and emits a P3-consumable beat-to-source-scene edit plan.

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Starting ref: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- BUG-034 duration behavior is inherited: P1 does not force voice to occupy 95–100% of the original timeline; P3 owns final timeline/voice fitting.
- Fresh Owner v4 artifact review identified BUG-036 semantic grounding/timeline defects that must be corrected before Semantic Remix can pass.

## Product mode contract
### Standard Script — DEFAULT
- User-facing label: `Kịch bản bình thường`.
- Default for new runs and when no saved preference exists.
- P1 still uses its normal original-video analysis inputs and creates one continuous Vietnamese narration.
- It does NOT publish an authoritative semantic scene-reorder plan for P3.
- It does NOT require video/product/customer marketing profiles or semantic remix beats as user-facing/runtime authority.
- The result remains compatible with current P1 -> P2 -> P3 flow.
- Turning Semantic Remix off must not silently change a saved prompt or mutate another queued Job.

### Semantic Remix — OPT-IN
- User-facing label: `Semantic Remix — phân tích & dựng lại theo cảnh`.
- Enabled only when the user explicitly selects it before starting the run.
- The selection is snapshotted into each idle Job at Start and must not be read live from the UI while a Job is already running.
- P1 may reorder/remove source scenes only through the emitted remix plan; P1 itself still does not render final video.
- P3 semantic cut/reorder remains blocked until the semantic artifact contract passes Owner verification.

### Persistence
- UI preference key: `p1_semantic_remix_enabled`.
- Default when missing/invalid: `false`.
- Per-job immutable run snapshot: `job.p1Config.semanticRemixEnabled`.
- Runtime logs must state `ScriptMode=standard` or `ScriptMode=semantic-remix`.

## Owner Semantic Remix requirement
Semantic Remix is NOT a translation/summarization feature. It must use grounded evidence from the original video:
- visual scenes/actions/objects/product shots;
- source ASR/subtitle/voice content and timestamps;
- scene order and pacing;
- user prompt/preset intent.

From that evidence Semantic Remix must derive:
1. video profile;
2. product/subject profile;
3. target-customer profile;
4. remix strategy and recommended target duration;
5. ordered remix beats;
6. beat-level narration provenance;
7. a new coherent continuous narration;
8. a source-scene/time-range mapping P3 can later cut/reorder/mix.

A short narration is acceptable only when it is a deliberate consequence of the remix plan. It must not be an unexplained summary accident.

## Vision stage
Adaptive Vision stays chunked/bounded. Each keyframe scene remains evidence, not a script.

Canonical scene evidence must keep:
- globally unique `index` assigned by code, never reset per chunk;
- `chunk_index`;
- `time_sec`;
- deterministic `start_sec` / `end_sec` source window derived from neighboring scene timestamps;
- `visual`;
- `speech_context`;
- `purpose`.

Vision scene descriptions used for semantic validation should be concise Vietnamese where possible. Raw source-language text may remain only as source evidence; it must not be copied into Vietnamese narration as stray CJK.

No CV scene-boundary dependency is added. Midpoint windows are an MVP editing map around sampled evidence points.

## Semantic Remix global reasoning contract
When `semanticRemixEnabled === true`, global reasoning receives:
- full timestamped transcript;
- compact canonical scene inventory;
- Vision evidence/conflicts;
- original source duration;
- selected TTS voice/speed;
- user prompt/preset.

The output requires:

`video_profile`
- `content_type`
- `primary_goal`
- `story_structure`
- `visual_style`
- `pacing`
- `strengths[]`
- `weaknesses[]`

`product_profile`
- `product_or_subject`
- `category`
- `value_proposition`
- `features[]`
- `benefits[]`
- `proof_points[]`
- `unknowns[]`

`customer_profile`
- `target_audience`
- `pains[]`
- `desires[]`
- `objections[]`
- `awareness_level`
- `buying_motivation`

Customer profile is a planning hypothesis, not a factual demographic claim. Weakly supported inferences must be expressed cautiously and must not become hard product claims in narration.

`remix_strategy`
- `objective`
- `angle`
- `hook`
- `story_arc`
- `cta`
- `target_duration_sec`
- `rationale`

`remix_beats[]`
- `beat_index`
- `role`: hook | problem | product | demo | benefit | proof | transition | visual_only | cta | custom
- `message`
- `narration_text` — exact narration owned by this beat; may be empty only for `visual_only`
- `source_scene_indexes[]`
- `edit_action`: keep | trim | reorder | montage
- `target_duration_sec`
- `evidence_basis`
- `reason`

`narration_script`
- compatibility field only in semantic mode;
- code-derived concatenation of non-empty beat `narration_text` is authoritative for TTS/artifacts;
- must not be a literal translation of the source transcript.

`edit_notes[]`
- short production notes only.

## BUG-036 corrective validation
Semantic mode must fail closed before artifact persistence/TTS when any of these occur:
- no remix beats;
- duplicate/invalid beat indexes;
- beat references nonexistent scenes;
- non-visual beat has empty narration text;
- visual-only beat contains narration text;
- invalid/non-positive beat duration;
- strategy target duration is invalid or materially exceeds source duration;
- sum of beat target durations does not reconcile with strategy target duration within a narrow tolerance;
- narration predicted duration is materially shorter/longer than the summed duration of narrated beats;
- process/action terms in a beat (for example mold/steam/bake/fry/wash/mix) are not supported by the referenced scene evidence;
- CTA/final-product beat is mapped only to early/mid process footage when final-result evidence exists later;
- high-risk product/health/composition claims appear without evidence support;
- narration is empty or fails deterministic language/repetition quality gates.

The validator must prefer rejecting a weak semantic plan over publishing a structurally valid but misleading edit plan.

No second LLM pass may be added solely to fill duration. The existing one reasoning retry for malformed/invalid structured output may correct a rejected semantic plan using the same evidence.

## Timeline semantics
For Semantic Remix:
- `source_duration_sec` = original source duration.
- `remix_strategy.target_duration_sec` = intended final remix duration.
- `sum(remix_beats[].target_duration_sec)` must approximately equal the strategy target.
- `visual_only` beats explicitly represent footage/music-only time.
- `narrated_target_duration_sec` = sum of non-visual beat target durations.
- narration predicted duration is checked against narrated target, NOT against original source occupancy.

For Standard Script:
- no semantic remix target is authoritative;
- preview/script timeline stays source-compatible;
- P3 receives no semantic cut/reorder authority from P1.

## Derived artifacts
### Standard Script
- `artifact_version: 4`.
- `analysis_mode: multimodal-standard-script-v4`.
- `scenes.json`: evidence inventory for audit/compatibility.
- `multimodal_timeline.json`: source transcript + sampling/scene provenance + compact standard insights.
- `remix_script.json`: authoritative continuous narration + standard metadata; `semantic_remix_enabled: false`.
- `edit_plan.json`: `semantic_remix_enabled: false`, empty/non-authoritative semantic plan.
- `remix_script.srt`: source-compatible preview timing.

### Semantic Remix
- `artifact_version: 4`.
- `analysis_mode: multimodal-semantic-remix-v4`.
- `semantic_remix_enabled: true` in all relevant artifacts.
- `scenes.json`: canonical global scene indexes + source windows.
- `multimodal_timeline.json`: source transcript/provenance + video/product/customer profiles.
- `remix_script.json`: strategy + ordered beats + code-derived narration + target/narrated duration telemetry.
- `edit_plan.json`: ordered P3 candidate plan with source scene indexes/ranges and beat narration provenance.
- P3 must be able to consume the plan later without rediscovering scene evidence.

## Source scope allowed
- `src/renderer/js/pipeline1-run-config.js` — add/persist/snapshot opt-in control.
- `src/renderer/js/pipeline1-analysis.js` — route artifact mode and preserve standard behavior.
- `src/main/p1-vision-ipc.js` — mode-aware reasoning contract + BUG-036 validation.
- `src/renderer/js/pipelines/pipeline1-ai.js` only if needed for mode-safe checkpoint/signature/logging.
- canonical `.ai/` files.

## Source scope forbidden
- No P2 changes.
- No P3 cut/reorder implementation in task 007.
- No backend TTS-engine rewrite.
- No new dependencies.
- No CV scene-boundary library.
- No extra Ollama pass solely for duration.
- No broad UI redesign; only one compact P1 script-mode control.
- No unrelated formatting/refactor.

## Acceptance criteria
1. Semantic Remix control exists in Pipeline 1 settings and defaults OFF.
2. Start snapshots the selected mode per idle Job.
3. Standard mode remains usable without semantic profile/beat authority and produces one normal continuous script/TTS.
4. Standard artifacts clearly identify `multimodal-standard-script-v4`; semantic edit plan is disabled/empty.
5. Semantic mode alone produces `multimodal-semantic-remix-v4` profiles/beats/P3 mapping.
6. Canonical scene indexes are globally unique in semantic mode.
7. Every semantic beat maps to valid source scenes and semantically supported process/action evidence.
8. Semantic target duration reconciles with summed beat durations; visual-only time is explicit.
9. Authoritative semantic narration is derived from beat narration provenance and has plausible coverage of narrated beat duration.
10. Unsupported process/product/health/composition claims are rejected or omitted.
11. BUG-034 remains: no hard P1 95–100% original-video occupancy gate and no second duration-fill LLM/TTS pass.
12. P2 unchanged; P3 semantic cut/reorder remains blocked until Owner semantic PASS.
13. Changing the UI mode after Start does not alter an already-running Job.
14. Existing queue isolation/retry behavior remains intact.

## Required verification
- `node --check src/main/p1-vision-ipc.js`.
- `node --check src/renderer/js/pipeline1-run-config.js`.
- `node --check src/renderer/js/pipeline1-analysis.js`.
- If changed: `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.
- PM review of complete changed files + diff.

Owner manual verification must cover BOTH modes on exact HEAD:

### Standard mode
- Semantic Remix OFF/default.
- Run representative source.
- P1 completes with normal continuous narration/TTS.
- Artifacts say `multimodal-standard-script-v4` and semantic edit plan is not authoritative.

### Semantic mode
- Explicitly enable Semantic Remix.
- Rerun same/equivalent 97.57s source.
- Inspect `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.
- Verify meaningful profiles, correct scene mapping, coherent strategy/beat/narration timeline and no unsupported claims.
- Exact tested `git rev-parse HEAD` is mandatory.

## Gates
Current candidate is `NEEDS_REVISION` due BUG-036. Implementation may proceed on the dedicated review branch. Static verification, PM code review, Owner standard-mode PASS, Owner semantic artifact/runtime PASS, documentation synchronization and explicit PM merge approval remain mandatory. Merge remains BLOCKED.