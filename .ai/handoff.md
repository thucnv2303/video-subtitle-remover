# AgentOS Handoff Status

## Active task
`PIPELINE3-FINAL-COMPOSITION-017`

## Status
RUNTIME FIX REV4 SOURCE PUBLISHED / PM CODE REVIEW PASS / EXACT STATIC WAITING / OWNER RE-VERIFY WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Rev4 starting HEAD: `92deaf8fa72094fbad3f84c75c716967acbc509d`
- Reviewed Rev4 application-source HEAD: `d5aae15c5471f0e23f35ac3ae7cc205fc47b0fe3`
- Amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-RUNTIME-FIX-REV4.md`

## Owner runtime evidence that invalidated the previous build
- P3 right inspector clipped/hid settings data.
- Remove Vocal was checked but original vocal remained audible.
- Export had no output destination picker or real quality selection.

Decision: pre-Rev4 Owner runtime FAIL / `NEEDS_REVISION`.

## Rev4 reviewed source behavior
- inspector containment/wrapping is added without changing P1/P2 layout logic;
- style category chips wrap instead of showing the clipped horizontal-scroll treatment;
- output folder + filename are saved per Job;
- final output cannot overwrite source/P2 clean video;
- quality presets map to actual H.264 libx264 CRF/preset values;
- new Electron P3 FFmpeg bridge handles video retime and final ASS burn with the selected quality;
- Remove Vocal + background > 0 accepts only Demucs no-vocals output;
- weak fallback methods block the render instead of being mixed as if removal succeeded;
- final ASS is rebuilt from exact final SRT after voice timing adjustment before HQ burn;
- subtitle burn failure now fails the P3 render instead of reporting final success with an intermediate video.

## Rev4 source scope
- `src/main/p3-export-bridge.js` — new;
- `src/main/preload.js`;
- `src/renderer/js/pipeline1-run-config.js` — one Rev4 import;
- `src/renderer/js/pipeline3/editor-store.js`;
- `src/renderer/js/pipeline3/runtime-fix-rev4.js` — new;
- `src/renderer/js/pipelines/pipeline3-finalize.js`.

No backend Python, P2, TTS, dependency or P1 execution change.

## Required exact-checkout verification
```text
node --check src/main/p3-export-bridge.js
node --check src/main/preload.js
node --check src/renderer/js/pipeline3/runtime-fix-rev4.js
node --check src/renderer/js/pipeline3/editor-store.js
node --check src/renderer/js/pipelines/pipeline3-finalize.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 92deaf8fa72094fbad3f84c75c716967acbc509d..HEAD
```

PM sandbox could not perform raw-download syntax verification because outbound DNS is unavailable; this is environment evidence only and automated verification remains WAITING.

## Owner acceptance focus
1. same screenshot-sized window: no clipped inspector data;
2. output folder + filename selection;
3. quality preset reflected in render log and output;
4. Remove Vocal ON + background > 0: Demucs success materially removes original vocal, otherwise render blocks explicitly;
5. subtitle timing/style remains correct in final output;
6. second render still restarts from P2 clean video.

## Local safety
Reuse only `E:\Project AI\Video-sub-remove-owner-test-LONG012`. `git status --short` must be empty before switching. Dirty => STOP. No reset/restore/clean and no new clone/worktree.

## Gates
- Execution: PASS.
- Automated/static: WAITING exact checkout.
- Code review: PASS logic/scope.
- Owner runtime: FAIL pre-Rev4 / WAITING Rev4.
- Documentation synchronization: PASS pre-runtime after ACTIVE/PR sync.
- Merge: BLOCKED.

## Next permitted action
Synchronize ACTIVE/PR to Rev4, verify live PR head/checks/comments, then Owner tests exact head. No merge.
