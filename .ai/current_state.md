# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — OPT-IN MODE + BUG-036 CORRECTIVE SOURCE PUBLISHED / STATIC + OWNER TWO-MODE RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Exact task spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Latest corrective application source head before docs sync: `643d8d4aba616512554fe27e3c2535806d80b024`.

## Owner product decision
Semantic Remix is optional and defaults OFF.

Two P1 modes now exist:
- Standard Script: normal multimodal script generation; no authoritative semantic cut/reorder plan.
- Semantic Remix: explicit opt-in; video/product/customer profiling + remix strategy/beats + P3 candidate scene mapping.

The selected mode is persisted in `p1_semantic_remix_enabled` and snapshotted into each idle Job as `job.p1Config.semanticRemixEnabled` at Start. UI changes after Start must not mutate the running Job.

## Published source behavior
### Standard Script
- Uses an isolated exact copy of the known pre-semantic P1 reasoning implementation from starting SHA `9981da...`.
- Distinct IPC names prevent handler collision with Semantic Remix.
- Artifacts use `artifact_version: 4`, `analysis_mode: multimodal-standard-script-v4`, `semantic_remix_enabled: false`.
- `edit_plan.json` is non-authoritative and has an empty plan.
- Preview narration timing remains source-duration compatible.

### Semantic Remix
- Continues to use current semantic reasoning path and canonical globally indexed scenes.
- Prompt is strengthened against the exact BUG-036 failures seen in Owner Job `kkx59hfu0`.
- New renderer deterministic guard rejects before artifact persistence/TTS when:
  - strategy target and summed beat durations disagree beyond `max(2s,5%)`;
  - beat process/action terms are unsupported by referenced scene evidence;
  - CTA ignores available late final-result evidence;
  - high-risk unsupported product/health/composition claims appear;
  - predicted narration duration is outside 70–130% of the summed beat target.
- The prior 75s strategy / 50s beat plan / ~30s narration Owner artifact would now fail closed rather than publish an edit plan.

## Preserved architecture
- BUG-034 remains: P1 does not force narration to occupy 95–100% of original source duration and does not run another LLM/TTS pass solely to fill source duration.
- P2 remains subtitle-removal only.
- P3 semantic cut/reorder is not implemented in task 007 and remains blocked until Semantic Remix Owner PASS.

## Known verification limits
- Exact-head Node syntax and `git diff --check` have not yet been supplied; GitHub has no configured status checks.
- The new Standard/semantic switch has not yet been observed in the real app.
- Semantic corrective guard is source-reviewed only; Owner must prove a new semantic run either produces coherent artifacts or fails closed with a specific guard error.
- PR mergeability is currently reported false by GitHub and remains an additional merge blocker until rechecked/resolved; no merge action is permitted regardless.

## Gates
- Execution: PASS for corrective source publication.
- Automated/static verification: WAITING.
- Code review: WAITING final corrective review.
- Owner Standard mode verification: NOT STARTED.
- Owner Semantic mode verification: NOT STARTED after correction.
- Documentation synchronization: IN PROGRESS until all affected canonical files are updated.
- Merge permission: BLOCKED.
- P3 semantic cut/reorder progression: BLOCKED.

## Next permitted action
Finish canonical docs sync and PM diff/full-file review. Then Owner tests exact final head in two runs: first with Semantic Remix OFF/default, then explicitly ON using the same/equivalent 97.57s source. Do not merge.