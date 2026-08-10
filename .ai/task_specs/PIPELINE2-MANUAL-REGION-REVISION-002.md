# PIPELINE2-MANUAL-REGION-REVISION-002

Status: AUTHORIZED FOR ANTI EXECUTION

## Objective
Fix only the remaining Pipeline 2 manual-region correctness and visible-log defects found in the Owner retest, while preserving the now-working backend bridge, realtime result preview, STTN processing behavior, P1→P2 gate, and P3 unlock behavior.

User outcome:
1. A manual subtitle rectangle stays exactly on the pixels the user dragged.
2. Every manual region can choose and retain its own mask mode.
3. During inpaint, the visible Console shows useful progress/errors rather than successful frame-request noise.

## Authority
Anti must read this file from the exact remote authority ref supplied by Project Manager after `git fetch origin`. Local copies are not authority.

Starting authority branch:
`origin/review/PIPELINE2-APPROVED-UI-001`

Required review branch:
`review/PIPELINE2-MANUAL-REGION-REVISION-002`

## Allowed source files
Only:
- `src/renderer/js/app.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`
- `src/renderer/js/pipeline2-runtime.js`
- `src/renderer/styles/pipeline2-approved.css`

## Allowed knowledge files
Only:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/bugs.md`
- `.ai/qa_checklist.md`

Do not modify this spec or ACTIVE during source implementation unless Project Manager explicitly issues a later documentation-only instruction.

## Forbidden source / behavior
- no `api/server.py` changes;
- no `src/main/python-bridge.js` or `src/main/preload.js` changes;
- no `pipeline-state.js` changes;
- no P1/P3/Settings source changes;
- no subtitle-removal algorithm rewrite;
- no dependency changes;
- no changes to P2 upload/drop policy;
- no broad UI redesign;
- no unrelated formatting or line-ending churn;
- no `git add .`, `git add -A`, `git reset`, `git restore`, `git checkout` over dirty files, `git clean`, force push, rebase, amend, wildcard rewrite scripts, or invented repair scripts.

ON ANY UNEXPECTED ERROR OR OUT-OF-SPEC CONDITION:
STOP IMMEDIATELY.
DO NOT SELF-REPAIR.
DO NOT INVENT AN ALTERNATIVE SCRIPT/PATCH/RECOVERY PATH.

## A. Manual ROI geometry
Current defect: draw/save math uses `canvas-inner` as the display coordinate space, but approved P2 CSS makes that wrapper fill the preview while the actual video canvas is aspect-ratio constrained and centered. Letterbox offsets therefore shift/scales the ROI.

Required implementation:
- use `canvas-original.getBoundingClientRect()` as the authoritative rendered video rectangle for pointer mapping;
- convert mouse coordinates to the rendered canvas coordinate system, clamped to `[0,width] x [0,height]`;
- map rendered canvas coordinates to source-video coordinates using `videoInfo.width / renderedCanvasWidth` and `videoInfo.height / renderedCanvasHeight`;
- persist only source-video pixel coordinates in region state;
- ensure the preview drag rectangle and saved `subtitle-overlay` rectangles are positioned relative to the actual rendered canvas rectangle, including left/top letterbox offset inside the wrapper;
- recompute overlay geometry after frame load and on resize/layout changes that alter the rendered canvas rectangle;
- changing timeline/frame must not move a saved ROI relative to source-video pixels.

Do not solve this by stretching the video canvas to fill its wrapper or distorting aspect ratio.

## B. Per-region mask mode
Required region state:
- newly created manual region stores `maskMode`, initialized from the current job/global mask selector;
- `renderRegionsList()` exposes a compact mask select for each region with `box`, `tight`, `soft`;
- changing one region's select updates only that region;
- the existing global `mask-mode` control remains the default for new regions and the auto-mode/job fallback;
- changing the global selector must NOT retroactively overwrite existing region mask selections;
- old region objects without `maskMode` must remain valid and fall back to `job.maskMode || 'box'`.

Manual multi-pass payload:
`mask_mode: region.maskMode || job.maskMode || 'box'`

Each manual pass must therefore use that pass region's own mask.

## C. Compact visible P2 inpaint log
Preserve the one live progress row and meaningful diagnostics.

During an active P2 job only:
- suppress visible successful Uvicorn access lines for `/api/frame/...`;
- continue suppressing successful status/preview/health/gpu-info polling lines;
- suppress expected early `/api/preview` 404 access lines before a live preview exists;
- do not suppress unexpected 4xx/5xx errors generally;
- do not suppress fatal backend/STTN errors, warnings, pass start, accelerator information, completion, output path, or final P2→P3 state.

Do not change backend logging globally. This task concerns visible renderer Console coalescing only.

## D. Preserve working runtime behavior
Must remain unchanged in behavior:
- realtime result preview from real `/api/preview` frames;
- linked-worktree backend reference discovery;
- P1→P2 eligibility/start gate;
- subtitle-removal-only P2 boundary;
- current STTN algorithm/device behavior;
- P3 unlock only after successful P2 completion.

## Required deterministic verification
Run exactly these static commands:
1. `node --check src/renderer/js/app.js`
2. `node --check src/renderer/js/pipelines/pipeline2-remove.js`
3. `node --check src/renderer/js/pipeline2-runtime.js`
4. `git diff --check`

Also produce deterministic evidence for:

### ROI mapping
Use a portrait source `720x960` in a wider display wrapper where the rendered canvas is centered with horizontal letterbox space. Demonstrate at minimum top-left, center, bottom-right, and one arbitrary ROI that pointer→source→rendered-overlay round-trips within <=1 CSS pixel per edge.

### Region masks
Create/simulate two manual regions:
- Region 1 mask `box`
- Region 2 mask `tight`
Show that pass 1 payload resolves `box` and pass 2 resolves `tight`.
Then show a legacy region without `maskMode` resolves to job/global fallback.

### Log filter
Show that during active P2 processing:
- `/api/frame/...` 200 access line => hidden;
- expected `/api/preview` 404 => hidden;
- `/api/preview` 500 or explicit backend/STTN error => remains visible;
- progress/completion line => remains visible.

No broad new test framework is authorized. Use existing test facilities if already present and within scope; otherwise report the deterministic simulation/output without adding unrelated files.

## Git / publication
1. Start only after remote authority/head preflight passes.
2. Create/use `review/PIPELINE2-MANUAL-REGION-REVISION-002` from the exact authority head.
3. Stage only approved hunks/files.
4. Inspect `git diff --cached` and changed-file list before commit.
5. Source commit must contain only approved source files.
6. Documentation commit must contain only approved knowledge files and accurately record tests/gates.
7. Push normally; no force push.
8. Open a Draft PR against `review/PIPELINE2-APPROVED-UI-001`.

Pre-push hard gate:
- unexpected changed file: STOP;
- forbidden file changed: STOP;
- required static check fails: STOP;
- remote authority head moved from the expected PM-dispatch SHA: STOP;
- diff contains broad line-ending/format churn: STOP.

## Final report
Return:
- task ID;
- authority branch + exact starting remote SHA;
- review branch + exact pushed head SHA;
- Draft PR URL/number;
- source commit SHA;
- docs commit SHA;
- exact changed source files;
- exact changed knowledge files;
- all static command outputs/exit codes;
- ROI mapping simulation evidence;
- per-region mask payload evidence;
- log-filter evidence;
- confirmation forbidden source unchanged;
- Owner retest status: NOT STARTED;
- Merge permission: BLOCKED.

Do not report PASS or MERGE READY. Project Manager must review GitHub evidence first.
