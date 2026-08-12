# QA Checklist

## Active task
`PIPELINE1-SEMANTIC-REMIX-007 — Optional Semantic Remix with Standard Script Default`

## Review basis
- [x] Branch `review/PIPELINE1-SEMANTIC-REMIX-007`.
- [x] Draft PR #48.
- [x] Base `9981da334ca10fd845c971241d541894d736c13b`.
- [x] Exact task spec synchronized to optional-mode design.
- [x] No P2/P3/TTS-engine/dependency change in corrective source.

## Mode routing — source review
- [x] Semantic preference key is `p1_semantic_remix_enabled`.
- [x] Missing preference defaults OFF.
- [x] Start snapshots `semanticRemixEnabled` into each idle Job.
- [x] Runtime log exposes `ScriptMode=standard` or `ScriptMode=semantic-remix`.
- [x] Standard and Semantic main-process reasoning use separate IPC names.
- [x] Shared audio handlers are not double-registered by Standard wrapper.

## Standard Script — source review
- [x] Standard reasoning module is exact pre-semantic starting-ref implementation.
- [x] Standard mode still uses ASR + adaptive Vision + global reasoning.
- [x] Standard mode produces one continuous narration.
- [x] Artifacts use `artifact_version:4` / `multimodal-standard-script-v4`.
- [x] `semantic_remix_enabled:false`.
- [x] `edit_plan.authoritative:false` and `plan:[]`.
- [x] Preview SRT remains source-duration compatible.

## Semantic Remix — source review
- [x] Only explicit opt-in routes to Semantic reasoning.
- [x] Canonical global scene inventory remains active.
- [x] Profiles/strategy/beats/narration remain required by main-process schema.
- [x] Semantic prompt explicitly rejects translation-only behavior and current BUG-036 failure modes.
- [x] Existing CJK/repetition quality checks remain upstream.
- [x] Artifacts use `multimodal-semantic-remix-v4` / `semantic_remix_enabled:true`.
- [x] Semantic edit plan is marked authoritative only after renderer guards pass.

## BUG-036 deterministic renderer guard
- [x] Strategy target vs summed beat target tolerance is max(2s,5%).
- [x] Missing referenced scenes are rejected.
- [x] Guarded action terms include mold/shape, steam, bake, wash/peel/soak, mix/syrup, cook/stir and filling.
- [x] CTA must map to late final-result evidence when available.
- [x] Selected unsupported health/composition/product claims are rejected.
- [x] Predicted narration duration must be 70–130% of summed beat duration.
- [x] Empty normalized evidence tokens are ignored; non-Latin terms cannot accidentally make a rule always PASS.
- [x] Guard executes before semantic artifact persistence/TTS.
- [x] Owner Job `kkx59hfu0` 75s strategy vs 50s beat sum would fail the current duration guard.

## BUG-034 regression invariants
- [x] No hard 95–100% ORIGINAL-source narration occupancy minimum restored.
- [x] No second LLM/TTS call added solely to fill source duration.
- [x] P3 remains final timeline/voice-fit authority.
- [x] P2 remains subtitle-removal only.

## Exact static checks — BLOCKING
- [ ] `git rev-parse HEAD` matches exact PR #48 head.
- [ ] `node --check src/main/main.js`.
- [ ] `node --check src/main/preload.js`.
- [ ] `node --check src/main/p1-standard-vision-ipc.js`.
- [ ] `node --check src/main/p1-standard-vision-wrapper.js`.
- [ ] `node --check src/renderer/js/pipeline1-run-config.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `node --check src/renderer/js/pipeline1-semantic-validator.js`.
- [ ] Recommended regression: `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`.
- [ ] GitHub CI/status: none configured; absence is not PASS.

## Owner manual run A — Standard/default OFF
- [ ] Semantic Remix control appears and defaults OFF on clean preference.
- [ ] Start log says `ScriptMode=standard`.
- [ ] P1 ASR/Vision/global reasoning completes.
- [ ] One continuous narration/TTS is produced.
- [ ] `remix_script.json` says `multimodal-standard-script-v4` and `semantic_remix_enabled:false`.
- [ ] `edit_plan.json` has `authoritative:false` and empty plan.
- [ ] P1→P2 unlock works when normal artifacts/TTS are valid.
- [ ] Toggling UI after Start does not change that running Job mode.

## Owner manual run B — Semantic ON
Use same/equivalent ~97.57s source.
- [ ] Explicitly enable Semantic Remix before Start.
- [ ] Start log says `ScriptMode=semantic-remix`.
- [ ] Canonical scene inventory is globally indexed.
- [ ] Strategy target approximately equals beat target sum.
- [ ] Predicted narration coverage is within 70–130% of beat plan.
- [ ] Molding/shape/fill/CTA beats map to semantically correct source scenes.
- [ ] Final-result scenes are used when script/CTA claims final result.
- [ ] No unsupported `nướng`, health, purity/safety or composition claims.
- [ ] If any deterministic guard fails, Job fails before accepted artifact/TTS and downstream must not be unlocked as valid semantic output.
- [ ] If pass, inspect fresh `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`.

## Queue/regression
- [ ] Failed semantic Job does not stop next queued P1 Job.
- [ ] Manual Job browsing remains independent of processing Job.
- [ ] Standard and Semantic Jobs queued together retain their own snapshotted modes.
- [ ] No segmented `/api/tts-retry` narration regression.
- [ ] P2/P3 behavior unchanged.

## Gates
Execution PASS for corrective publication; automated/static WAITING; final corrective code review WAITING; Owner Standard NOT STARTED; Owner Semantic NOT STARTED after correction; documentation synchronization IN PROGRESS until final bug/PR state sync; merge BLOCKED.