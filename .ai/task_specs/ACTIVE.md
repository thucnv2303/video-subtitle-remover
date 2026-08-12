# Active PM Execution Spec

Status: IMPLEMENTATION_AUTHORIZED

Task: `PIPELINE1-SEMANTIC-REMIX-007`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`
Starting SHA: `9981da334ca10fd845c971241d541894d736c13b`
Exact spec: `.ai/task_specs/PIPELINE1-SEMANTIC-REMIX-007.md`
Spec commit: `b0597b40e3a3411280344c94ba961644cb6c5d9a`

Goal:
Upgrade Pipeline 1 from compact multimodal rewrite into a semantic remix planner. P1 must derive explicit video/product/customer profiles, remix strategy, ordered remix beats and a P3-consumable beat-to-source-scene/time-range edit plan before TTS.

Source scope allowed:
- `src/main/p1-vision-ipc.js`
- `src/renderer/js/pipeline1-analysis.js`
- `src/renderer/js/pipelines/pipeline1-ai.js` only if semantic target telemetry requires it
- canonical `.ai/` files affected by the task

Source scope forbidden:
- No P2 changes.
- No P3 cut/reorder implementation in this task.
- No backend TTS-engine rewrite.
- No new dependency.
- No CV scene-boundary library.
- No extra Ollama duration-fill retry.
- No broad UI redesign.

Implementation authority:
- Executor must `git fetch origin` first.
- Executor must read `origin/review/PIPELINE1-SEMANTIC-REMIX-007:.ai/task_specs/ACTIVE.md` and the exact spec before editing.
- Remote spec is authority; local stale specs are not.
- Unexpected source/spec conflict => STOP and report, do not broaden scope.

Verification required:
- `node --check src/main/p1-vision-ipc.js`
- `node --check src/renderer/js/pipeline1-analysis.js`
- if changed: `node --check src/renderer/js/pipelines/pipeline1-ai.js`
- `git diff --check 9981da334ca10fd845c971241d541894d736c13b..HEAD`
- changed-file list and exact source commit SHA
- no P2/P3/backend/dependency changes

Owner runtime and semantic artifact verification remain mandatory after PM code review. Merge permission: BLOCKED.