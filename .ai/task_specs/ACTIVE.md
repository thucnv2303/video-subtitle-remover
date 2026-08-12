# Active PM Execution Spec

Status: PM_DIRECT_EDIT_SOURCE_PUBLISHED_STATIC_AND_OWNER_RUNTIME_WAITING

Task: `VOICE-RENDER-TAB-008`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/VOICE-RENDER-TAB-008-demo`
Starting parent: `review/PIPELINE1-SEMANTIC-REMIX-007@0b3ee3a63f06d17334b2c295491c50039326febb`
Exact spec: `.ai/task_specs/VOICE-RENDER-TAB-008.md`

## Execution authority
Owner has directed the Project Manager to perform GitHub source work directly and not dispatch Anti for current/future implementation work unless the Owner later changes that instruction.

No external executor is assigned to this task.
Do not generate or use an Anti execution prompt as task authority.

All direct application-source edits must remain on a dedicated review branch, be re-read/reviewed from GitHub, and remain blocked from merge until required gates pass.

## Current product contract
Voice Render is a standalone OmniVoice utility directly below Home and before Settings.

It may:
- accept text;
- select language;
- use OmniVoice default or a saved clone reference;
- choose an output WAV path;
- call the existing `POST /api/tts/generate` contract;
- preview/open the generated audio.

It must not:
- create or mutate video Jobs;
- read/write P1/P2/P3 status or gates;
- attach audio to video automatically;
- change P1/P2/P3 artifacts;
- modify backend TTS routing/engine for this demo;
- add dependencies.

## Current source scope
Application source currently approved/changed only:
- `src/main/preload.js`;
- `src/renderer/js/voice-render.js`;
- `src/renderer/styles/voice-render.css`.

Latest application-source correction before docs sync:
`8f50811e6578f41119714ce157eb3987d3b1ce63`

## Next permitted action
Project Manager must:
1. finish documentation synchronization;
2. open a Draft PR against `review/PIPELINE1-SEMANTIC-REMIX-007`;
3. verify exact final HEAD, changed files and diff;
4. run/obtain static syntax and diff-check evidence where available;
5. review the final source directly;
6. only then permit Owner real-app test if no blocker exists.

## Required Owner runtime after code review
- sidebar order Home → Voice Render → Settings;
- navigation leaves only one page active;
- default OmniVoice renders short Vietnamese text to selected WAV path;
- generated audio plays and file opens;
- saved clone voice path works when available;
- P1/P2/P3 Job/status state remains unchanged before and after render.

## Parent task
PR #48 / `PIPELINE1-SEMANTIC-REMIX-007` remains an independent upstream review with its own unresolved static and Owner runtime gates. This task does not satisfy those gates.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: WAITING.
- Code review: IN PROGRESS.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS until final re-read.
- Merge permission: BLOCKED.
