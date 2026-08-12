# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — OPTIONAL MODE CORRECTION PUBLISHED / PM LOGIC-SCOPE REVIEW PASS / STATIC + OWNER TWO-MODE RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact task spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Latest corrective source reviewed at `7b217c7b73e98375bcf5ff2bcb24a92c8fa61796`.
- PM corrective review: `4915748131` — PASS logic/scope only, not release PASS.

## Owner product decision
Semantic Remix is optional and defaults OFF.

Two P1 modes now exist:
- Standard Script: normal multimodal script generation; no authoritative semantic cut/reorder plan.
- Semantic Remix: explicit opt-in; video/product/customer profiling + remix strategy/beats + P3 candidate scene mapping.

The selected mode is persisted in `p1_semantic_remix_enabled` and snapshotted into each idle Job as `job.p1Config.semanticRemixEnabled` at Start. Fresh Start clears any duration checkpoint so a Job cannot accidentally resume analysis from the other mode. UI changes after Start do not mutate a running Job.

## Published source behavior
### Standard Script
- Uses an isolated exact copy of the known pre-semantic P1 reasoning implementation; `src/main/p1-standard-vision-ipc.js` has blob SHA `230b1f156b9861f8daf4bbcdcac099b555030ce9`, identical to the starting-ref P1 reasoning blob.
- Distinct IPC names prevent handler collision with Semantic Remix.
- Existing Stop bridge cancels both Standard and Semantic inference so current callers do not need mode-specific stop logic.
- Artifacts use `artifact_version: 4`, `analysis_mode: multimodal-standard-script-v4`, `semantic_remix_enabled: false`.
- `edit_plan.json` is non-authoritative and has an empty plan.
- Preview narration timing remains source-duration compatible.

### Semantic Remix
- Uses current semantic reasoning path and canonical globally indexed scenes.
- Prompt is strengthened against the exact BUG-036 failures seen in Owner Job `kkx59hfu0`.
- Renderer deterministic guard rejects before artifact persistence/TTS when:
  - strategy target and summed beat durations disagree beyond `max(2s,5%)`;
  - beat process/action terms are unsupported by referenced scene evidence;
  - CTA ignores available late final-result evidence;
  - selected high-risk unsupported product/health/composition claims appear;
  - predicted narration duration is outside 70–130% of the summed beat target.
- The prior 75s strategy / 50s beat plan / ~30s narration Owner artifact would fail closed rather than publish an edit plan.

## Preserved architecture
- BUG-034 remains: P1 does not force narration to occupy 95–100% of original source duration and does not run another LLM/TTS pass solely to fill source duration.
- P2 remains subtitle-removal only.
- P3 semantic cut/reorder is not implemented in task 007 and remains blocked until Semantic Remix Owner PASS.

## Verification facts
- GitHub compare shows task branch is 41 commits ahead of exact base and not behind it; corrective diff contains no P2/P3/dependency source file changes.
- Standard reasoning file blob identity has been verified against starting ref.
- PR review threads: none unresolved at final corrective review time.
- GitHub status checks: none configured; absence is not PASS.
- Exact-head Node syntax and `git diff --check` output are still WAITING.
- New Standard/Semantic UI and runtime routing have not yet been Owner-observed.
- GitHub currently reports PR `mergeable:false`; this remains an independent merge blocker pending later recheck/resolution.

## Gates
- Execution: PASS for corrective source publication.
- Automated/static verification: WAITING.
- Code review: PASS logic/scope (`4915748131`), not release PASS.
- Owner Standard mode verification: NOT STARTED.
- Owner Semantic mode verification: NOT STARTED after correction.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
- P3 semantic cut/reorder progression: BLOCKED.

## Next permitted action
Owner first provides exact-head static checks, then tests two runs on that same exact head: Standard with Semantic Remix OFF/default, then Semantic Remix explicitly ON using the same/equivalent 97.57s source. If Semantic passes, inspect the four fresh v4 JSON artifacts again. If a guard rejects it, capture the exact error and confirm downstream was not unlocked as a valid semantic result. Do not merge.