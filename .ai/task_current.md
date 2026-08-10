# Current Task

## Task ID
PIPELINE2-MANUAL-REGION-REVISION-002

## Name
Pipeline 2 Manual ROI Geometry, Per-Region Mask, and Compact Inpaint Log

## Status
OWNER_SINGLE_JOB_PASS_MULTI_JOB_RETEST_PENDING

## Authority
- Parent: `review/PIPELINE2-APPROVED-UI-001@39c2ac7254977c44d2cedb79cabd914fe124c3a7`.
- Review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`.
- Draft PR: #43.
- Current source commit: `0e20fc0c6300240276da8e4bef16f67186a08889`.
- Owner-test intake basis: authorized PR #43 head `b43f16837202051bcebb1e74900b010b4266869e`; GitHub head unchanged when result was received.

## Scope
Changed application source only:
- `src/renderer/js/pipeline2-runtime.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`

Do not change backend/STTN algorithm, preload/python bridge, `pipeline-state.js`, P1, P3, Settings or dependencies.

## Implemented behavior
1. Manual ROI uses the actual rendered `canvas-original` rectangle and letterbox offsets.
2. Manual capture blocks legacy wrapper drawing, including clicks that begin in letterbox space.
3. Runtime observers reassert corrected region UI/overlays immediately after legacy DOM rendering.
4. New regions store the current global mask selector value as their own `maskMode`.
5. Each region can independently select Box/Tight/Soft; legacy region fallback remains supported.
6. Active manual request uses the current region mask.
7. P2 visible Console suppresses successful frame/poll traffic and expected preview 404 while preserving real errors/progress/completion.
8. Existing realtime preview, runtime backend discovery and P3 success-only unlock remain intact.

## Verification
PASS:
- exact published runtime blob `f2b39abb2a948eb14e21665f6e0f234a1bef6ae1` == local tested blob; `node --check` PASS;
- exact published `pipeline2-remove.js` blob `67340ba29825ced3b4e5e5c583b591cba0ed2510` == local tested blob; `node --check` PASS;
- deterministic letterbox ROI simulation <=1 CSS px, latest max error 0.25 px;
- mask resolution `box`, `tight`, legacy fallback `soft`;
- log filter keeps preview 500/completion visible while hiding frame 200/expected preview 404;
- GitHub final source scope limited to the two approved source files;
- exact unchanged `app.js` blob `99c2cafa509ba2038b98f135156b34271da58c70` reconstructed byte-identical; `node --check` PASS;
- exact changed-file parent→current reconstruction: `git diff --check` PASS;
- GitHub CI is not configured, so no CI status is claimed.

## Owner runtime result — 2026-08-10
- PASS for the single-job Pipeline 2 path tested by Owner; Owner reported the run completed and generally everything observed was correct.
- No new runtime defect was reported in that single-job run.
- Multi-job/batch behavior was not tested and remains WAITING.
- Do not infer individual unchecked QA assertions beyond the Owner's stated observation.

## Controlled publication incident
PM accidentally created `.ai/.pm_probe_should_not_exist` in `78252c198e6790722e92877c17bfee62312877a0`, then removed it in `cec184210ab9a622c5c62163712ff0f44a9ffe5c` without force/history rewrite. Compare from the pre-probe docs head `d84d8092f1dcb7f816c890fe1b38da0cbb942a0f` to cleanup head shows zero final file differences. Treat this as contained but recorded evidence.

## Gates
- Execution: PASS.
- Automated verification: PASS.
- Code review: PASS.
- Owner manual app verification: PARTIAL PASS — SINGLE-JOB PASS; MULTI-JOB NOT TESTED.
- Documentation synchronization: PASS for current result intake.
- Merge permission: BLOCKED pending multi-job/batch regression coverage or explicit PM determination that it is outside the release gate.

## Merge rule
No merge until required verification, PM code review, sufficient fresh Owner runtime coverage, owner-result documentation sync and explicit PM approval are complete.
