# Active PM Execution Spec

Status: PM_CODE_REVIEW_PASS_EXACT_STATIC_WAITING_OWNER_RUNTIME_NOT_STARTED

Task: `VOICE-RENDER-SHARED-LIBRARY-009`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/VOICE-RENDER-SHARED-LIBRARY-009`
Draft PR: #50
Base: `review/VOICE-RENDER-TAB-008-demo@3164b6f625e06d4d8f4d88009fb9dea5c335198f`
Exact spec: `.ai/task_specs/VOICE-RENDER-SHARED-LIBRARY-009.md`
Latest PM-reviewed application-source commit: `066a7cc9b369abf992dd0840c336ad0edb17022a`

## Execution authority
Owner instructed Project Manager to implement directly on GitHub. Do not dispatch Anti/external executors unless Owner explicitly changes this instruction.

## Current product contract
Voice Render:
- matches current app navy/blue UI;
- shares the existing common voice library with Settings/Pipeline selectors;
- supports clone voice creation into existing `localStorage.tts_voices`;
- previews each voice independently from selection;
- renders long text through deterministic bounded sequential chunks;
- merges successful chunks into one WAV using the constrained preload FFmpeg bridge;
- exposes its own bounded Log card;
- places real App/Backend/TTS/GPU/CPU/RAM status in the persistent left sidebar;
- never creates/mutates video Jobs or P1/P2/P3 gates/artifacts.

## Application source authority
Changed application source in PR #50 is exactly:
- `src/main/preload.js`;
- `src/renderer/js/voice-render.js`;
- `src/renderer/styles/voice-render.css`.

No further application-source edit is authorized unless PM review finds a defect or Owner reports a runtime failure.

## Verification required now
Use final PR #50 exact HEAD in `E:\Project AI\Video-sub-remove-owner-test-P1`.

Required static commands:
```text
node --check src/main/preload.js
node --check src/renderer/js/voice-render.js
git diff --check 3164b6f625e06d4d8f4d88009fb9dea5c335198f..HEAD
```

A silent `node --check` / `git diff --check` command with exit code 0 is PASS. Any error => STOP; do not self-repair in the Owner-test worktree.

After static PASS, Owner runtime verifies:
1. persistent sidebar status across tabs;
2. current-app visual consistency;
3. scrollable voice list and independent previews;
4. explicit voice selection;
5. clone save -> shared Settings/Pipeline selectors without restart;
6. short render;
7. several-thousand-word sequential chunk render -> one merged WAV;
8. Stop-after-current behavior;
9. Log behavior;
10. no P1/P2/P3 state/gate/artifact mutation.

## Parent task caveat
PR #48 / P1 Semantic Remix remains independently unverified. This Voice Render task does not satisfy its gates.

## Gates
- Execution: PASS.
- Automated/static verification: WAITING.
- Code review: PASS logic/scope.
- Owner visual/runtime verification: NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
