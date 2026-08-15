# STANDALONE-SUBTITLE-REMOVER-010

## Status
READY_FOR_IMPLEMENTATION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/STANDALONE-SUBTITLE-REMOVER-010`
- Exact starting SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Parent review branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Parent Draft PR: #51

## Verified source findings before implementation
1. Current P2 UI already exists inside `src/renderer/index.html` as Step 2 and is driven by the active non-module controller in `src/renderer/js/app.js`.
2. Current Voice Render navigation is mounted dynamically by `src/renderer/js/voice-render.js`, with `src/main/main.js` bootstrapping that script. Do not change Voice Render behavior for this task.
3. `app.js` exposes the shared job state as `window._appState`; do not create a second P2 job store.
4. Current manual inpaint execution in `app.js::runNextPass()` sends `mask_mode: job.maskMode || 'box'` for every manual pass. Therefore per-region mask behavior is not currently honored by the active controller even though stale/modular P2 code contains `region.maskMode || job.maskMode` semantics.
5. Current region drawing already uses source/video coordinate scaling in `canvas-inner-orig`; do not rewrite this mapping for the cursor feature.

## User outcome
Add a standalone `Xoa Sub` tab directly below Voice Render so the Owner can remove burned-in subtitles from a video without running the main P1 -> P2 -> P3 workflow.

The standalone entry must reuse the already-working active Pipeline 2 UI/controller/backend path. Do not create a second inpaint engine, duplicate job store, or duplicate P2 DOM IDs.

## Required implementation direction
Use the existing Step 2 UI/controller as the single implementation.

Preferred UX behavior:
- Add a dedicated `Xoa Sub` navigation entry.
- When opened, present the existing Step 2 workspace in standalone mode and hide the P1/P2/P3 pipeline navigation chrome so the user experiences it as an independent tool.
- Reuse the same Step 2 DOM and active `app.js` handlers rather than cloning markup with duplicate IDs.
- When leaving the standalone page for Home/Voice Render/Settings, restore normal navigation/layout state.
- Ensure the Xoa Sub nav item is visually located directly below dynamically mounted Voice Render without changing Voice Render processing behavior.

## MVP flow
1. Open `Xoa Sub` from app navigation below Voice Render.
2. Select a video independently of P1 execution.
3. Preview source video/frame.
4. Choose Auto or Manual subtitle-region mode.
5. In Manual mode, draw one or more subtitle regions.
6. Assign mask mode per region when needed.
7. Choose the existing P2 inpaint algorithm.
8. Start removal using the existing active P2/backend processing path.
9. Show existing processing progress/log/result preview.
10. Produce the existing clean-video output contract (`*_no_sub.mp4` / current P2 output behavior).

## UI requirement — drawing cursor
When Manual region drawing is actively enabled, hovering the drawable source preview/canvas must show a crosshair (`cursor: crosshair`) so drawing affordance is obvious.

Required states:
- normal/non-drawing preview: normal cursor;
- Manual + drawing enabled + pointer over drawable preview: crosshair;
- while click-dragging a region: crosshair remains;
- after finishing a region, if drawing mode remains enabled: crosshair remains;
- drawing disabled or Auto mode: restore normal cursor;
- do not apply crosshair to timeline/buttons/controls outside the drawable preview.

Cursor work must not change coordinate mapping or region geometry.

## Per-region mask correction
The active manual execution path must use:

`mask_mode: region.maskMode || job.maskMode || 'box'`

for each manual pass.

The standalone Manual region list must allow the user to select/store a mask mode for each region. Existing job-level mask remains the fallback/default for new or legacy regions.

Do not change Auto-mode mask behavior.

## Reuse requirements
- Reuse current active Pipeline 2 backend/inpaint execution.
- Preserve existing algorithms: STTN Auto, LaMa, ProPainter, OpenCV where currently supported.
- Preserve current manual multi-region processing.
- Use current `window._appState` / active app controller state rather than creating duplicate state.
- Preserve current output naming and P3 compatibility.

## Scope allowed
Primary source scope:
- `src/renderer/index.html`
- `src/renderer/js/app.js`
- `src/renderer/styles/main.css`

A new very small renderer helper is allowed only if it reduces risk versus adding broad logic to `app.js`; it must not duplicate P2 processing/state.

Knowledge scope:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/qa_checklist.md`
- `.ai/task_specs/ACTIVE.md`
- this task spec
- architecture/decision/source-map files only if implementation genuinely changes those contracts.

## Scope forbidden
- No new inpaint engine or duplicate backend processing implementation.
- No second P2 job store.
- No duplicated P2 DOM with duplicate IDs.
- No behavior changes to P1 AI reasoning/Standard/Semantic.
- No TTS or Voice Render processing behavior changes.
- No P3/finalize behavior changes.
- No changes to inpaint model internals unless an actual blocker is proven and PM explicitly expands scope.
- No broad renderer refactor, dependency churn, unrelated formatting, or cleanup.
- Do not fix BUG-039 or BUG-040 inside this task.
- No direct push to `dev`, parent review branches, or main/canonical branches.

## Edge cases / states
- No video selected: Start disabled or safely rejected with clear feedback.
- Backend unavailable: existing error/status behavior remains visible and no false success.
- Auto mode must not expose drawing crosshair.
- Manual mode with no regions must preserve current safe P2 behavior; do not silently invent region coordinates.
- Multiple regions must remain ordered/processable as current P2 expects.
- A region without explicit `maskMode` uses job-level mask fallback.
- Cancel/error must not falsely mark output finished.
- Switching pages must not accidentally trigger P1/P3.

## Acceptance criteria
1. Navigation contains `Xoa Sub` directly below Voice Render.
2. Opening it presents the existing P2 workspace as a standalone tool without requiring P1 artifacts.
3. Existing active P2 inpaint/backend path is reused; no duplicate processing engine/state/DOM is introduced.
4. User can select a video and run Auto removal.
5. User can use Manual mode and draw multiple regions.
6. Region list exposes mask selection per region.
7. Manual execution sends each region's own mask mode, falling back to job mask only when region mask is absent.
8. Manual drawing enabled => drawable preview cursor visibly becomes crosshair.
9. Drawing disabled/Auto => cursor returns to normal.
10. Region geometry remains aligned with the point where the Owner drew it; cursor/UI changes introduce no coordinate regression.
11. Existing P1, Voice Render, Settings and P3 behavior is not changed by this feature.
12. Existing clean-video output contract remains compatible with P3.

## Verification required
### Static
- Show exact branch and HEAD.
- Show changed files and diff summary.
- `git diff --check` PASS.
- Run applicable JS syntax/static checks for every changed JS file.
- Confirm no backend/inpaint-engine duplication.
- Confirm manual `runNextPass` uses `region.maskMode || job.maskMode || 'box'`.
- Confirm Auto path still uses job-level mask behavior.

### Manual Owner QA after PM code-review PASS
- Open Xoa Sub directly.
- Confirm it appears directly below Voice Render.
- Select a known video without running P1.
- Auto removal smoke test.
- Manual mode: enable drawing and confirm crosshair only on drawable preview.
- Draw at least two regions; verify displayed boxes remain aligned with drag positions.
- Give the two regions different mask modes and run removal.
- Verify progress/result/output.
- Disable drawing / switch Auto and verify normal cursor.
- Navigate to Voice Render/P1 and confirm no obvious regression.

## Executor stop rules
- Fetch remote branch and read remote `ACTIVE.md` + this exact spec before editing.
- If active P2 implementation differs materially from the verified findings above: STOP and report evidence.
- If implementing standalone mode requires duplicating P2 DOM or backend: STOP; do not improvise.
- If unexpected unrelated dirty changes are present and task hunks cannot be isolated: STOP.
- No force push, reset, restore, clean, wildcard rewrite, or broad formatting.

## Gates
- Execution: NOT STARTED
- Automated/static verification: WAITING
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING
- Merge permission: BLOCKED
