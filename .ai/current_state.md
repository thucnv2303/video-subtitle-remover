# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — IMPLEMENTATION AUTHORIZED / SOURCE NOT YET PUBLISHED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Starting source/docs ref: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Parent Draft PR: #47.
- New task spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`.
- Spec commit: `b0597b40e3a3411280344c94ba961644cb6c5d9a`.
- ACTIVE pointer commit: `602ce0781eed359a0145f65b0ec10c392407d320`.

## Fresh Owner requirement
The current P1 is only partially aligned with the product goal. It already uses adaptive Vision + full transcript, but the final contract is still too compact and may collapse a >90s source into a ~37–40s narration without proving whether that is a deliberate remix strategy or an accidental summary.

Owner requires P1 to explicitly analyze and derive:
1. scene-level video evidence;
2. video profile;
3. product/subject profile;
4. target-customer profile;
5. remix strategy and recommended target duration;
6. ordered remix beats;
7. a new narration grounded in transcript + Vision evidence;
8. a P3-consumable mapping from each remix beat back to source scene indexes/time ranges.

## Verified current-source gap
- Adaptive sampling/Vision is real and is not transcript-only.
- Current global reasoning schema contains compact `summary`, `insights`, one `narration_script`, `edit_plan` and notes.
- Current `insights` has only compact fields such as topic/product/audience/hook/benefits/evidence/cta.
- Current `edit_plan` only carries `{scene_index, action, reason}` and does not require beat-level narrative role/message/target duration/source ranges.
- Scene indexes are currently reused from each Vision chunk and then combined, so they are not guaranteed globally unique for a future P3 semantic edit map.
- `pipeline1-analysis.js` currently persists artifact version 3 and stores narration as one full-source segment rather than an explicit semantic remix timeline.

## Approved upgrade contract
P1 v4 becomes `multimodal-semantic-remix-v4` and must require:
- `video_profile`;
- `product_profile`;
- `customer_profile`;
- `remix_strategy` with explicit `target_duration_sec`;
- ordered `remix_beats` with source scene indexes + edit action + target duration;
- one grounded continuous `narration_script`;
- deterministic edit-plan source ranges derived from globally unique scene evidence.

Character duration remains guidance/telemetry. P1 must not reintroduce the BUG-033 duration-fill loop. BUG-034 P1/P3 duration responsibility remains inherited.

## Gates
- Execution: IN PROGRESS — implementation authorized, no source commit yet.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner semantic artifact/runtime verification: NOT STARTED.
- Documentation synchronization: PASS for task activation; final sync WAITING after source publication.
- Merge permission: BLOCKED.

## Next permitted action
Implement only the exact remote semantic-remix spec on `review/PIPELINE1-SEMANTIC-REMIX-007`, publish a separate source commit, run static verification, then PM reviews the exact diff/full files before Owner reruns the 97.57s case and inspects v4 artifacts. Do not merge parent PR #47 or the new task based on source publication alone.