# Active PM Execution Spec

Status: SOURCE_PUBLISHED_PM_REVIEW_PASS_OWNER_RETEST_READY_AFTER_STATIC

Task: `PIPELINE1-SEMANTIC-REMIX-007`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`
Draft PR: #48
Starting SHA: `9981da334ca10fd845c971241d541894d736c13b`
Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`
Spec commit: `b0597b40e3a3411280344c94ba961644cb6c5d9a`
Source commits:
- `862e68d5c47447f0033817145757429f38cf830f` — semantic reasoning/schema/scene validation
- `4a2712c41ad26284e4ecfb2a1f955606051729e8` — v4 artifact/edit-plan persistence
PM review: `4913808619` — PASS logic/scope only

Implemented outcome:
- P1 requires video/product/customer profiles.
- P1 requires an explicit remix strategy with deliberate target duration.
- P1 requires ordered remix beats referencing canonical source scenes.
- Canonical source scenes have globally unique indexes and deterministic source windows.
- P1 writes one grounded new narration rather than using translation/summary-only as the product contract.
- Artifact contract is version 4 / `multimodal-semantic-remix-v4`.
- `edit_plan.json` maps remix beats to source scene/time ranges for later P3 cut/reorder implementation.
- BUG-034 duration responsibility is preserved; no duration-fill reasoning/TTS loop is reintroduced.

Changed application source:
- `src/main/p1-vision-ipc.js`
- `src/renderer/js/pipeline1-analysis.js`

No task-007 P2/P3/backend/dependency source change.

Verification still required before Owner semantic test:
- `git rev-parse HEAD`
- `node --check src/main/p1-vision-ipc.js`
- `node --check src/renderer/js/pipeline1-analysis.js`
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`

Owner semantic runtime after static PASS:
- rerun same/equivalent 97.57s input;
- inspect `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`;
- verify meaningful profiles, deliberate target duration, multiple beats, valid source mappings and grounded new narration;
- prove no `Narration evidence-fit` is triggered solely because voice is shorter than source.

Merge permission: BLOCKED until static + Owner semantic artifact/runtime verification + final docs recording + PM explicit approval.