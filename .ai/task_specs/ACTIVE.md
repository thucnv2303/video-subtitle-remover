# Active PM Execution Spec

Status: PM_CODE_REVIEW_PASS_OWNER_RUNTIME_READY

Task: `VOICE-RENDER-TAB-008`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/VOICE-RENDER-TAB-008-demo`
Draft PR: #49
Starting parent: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`
Exact spec: `.ai/task_specs/VOICE-RENDER-TAB-008.md`
Latest application-source commit: `dabac98867fc82c090fc5b3809a083085654b839`

## Execution authority
Owner has directed the Project Manager to perform GitHub implementation directly and not dispatch Anti/external executors unless the Owner later changes this instruction.

All application changes remain subject to dedicated review branches, exact GitHub evidence, code review, Owner runtime verification where applicable, canonical `.ai/` synchronization and explicit merge approval.

## Current product contract
Voice Render is a standalone OmniVoice utility directly below Home and before Settings.

It may:
- accept text;
- select language;
- use OmniVoice default or a saved clone reference;
- choose a WAV output path;
- call existing `POST /api/tts/generate`;
- preview/open generated audio;
- display actual OmniVoice/backend availability.

It must not:
- create or mutate video Jobs;
- read/write P1/P2/P3 status or gates;
- attach audio to video automatically;
- change P1/P2/P3 artifacts;
- modify backend TTS routing/engine for this demo;
- add dependencies.

## Current application source scope
- `src/main/preload.js`;
- `src/renderer/js/voice-render.js`;
- `src/renderer/styles/voice-render.css`.

No additional application-source file is authorized for this task without a new PM review decision.

## PM verification
- PR #49 source/full-file/patch scope reviewed directly from GitHub.
- Navigation isolation defect found and corrected.
- Misleading static engine-ready badge found and corrected.
- Node syntax `src/main/preload.js`: PASS.
- Node syntax `src/renderer/js/voice-render.js`: PASS.
- Review threads: none unresolved.
- GitHub workflow/status runs: none configured.
- Exact repository `git diff --check` remains WAITING because the verification container cannot clone/fetch GitHub due DNS resolution. Do not infer PASS.

## Next permitted action — OWNER REAL-APP TEST
Owner may now test PR #49 branch in the actual app:
1. Home → Voice Render → Settings sidebar order.
2. Voice Render/Home/Settings navigation leaves exactly one active page.
3. Engine badge reflects real backend/OmniVoice availability.
4. Default OmniVoice renders short Vietnamese text to selected WAV path.
5. Result plays and Open file works.
6. Existing saved clone voice renders correctly when available.
7. P1/P2/P3 job/status state remains unchanged.

After Owner result, Project Manager records PASS/FAIL in canonical `.ai/`, performs any required revision, and only then reassesses merge gates.

## Parent task
PR #48 / `PIPELINE1-SEMANTIC-REMIX-007` remains an independent upstream review with unresolved static and Owner runtime gates. This task does not satisfy those gates.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING/PARTIAL — Node syntax PASS, exact diff-check missing.
- Code review: PASS logic/scope.
- Owner visual/runtime verification: NOT STARTED — READY.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
