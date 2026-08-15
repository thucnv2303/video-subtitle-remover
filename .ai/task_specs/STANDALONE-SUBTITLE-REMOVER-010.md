# STANDALONE-SUBTITLE-REMOVER-010

## Status
READY_FOR_IMPLEMENTATION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/STANDALONE-SUBTITLE-REMOVER-010`
- Exact starting SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Parent review branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Parent Draft PR: #51

## User outcome
Add a standalone `Xoa Sub` page/tab directly below Voice Render so the Owner can remove burned-in subtitles from a video without running the main P1 -> P2 -> P3 workflow.

The standalone tool must reuse the already-working Pipeline 2 processing behavior. Do not create a second inpaint engine.

## MVP flow
1. Open `Xoa Sub` from app navigation below Voice Render.
2. Select a video independently of the main pipeline flow.
3. Preview source video/frame.
4. Choose Auto or Manual subtitle-region mode.
5. In Manual mode, draw one or more subtitle regions and retain per-region mask mode behavior.
6. Choose the existing P2 inpaint algorithm/mask controls.
7. Start removal using the existing P2/backend processing path.
8. Show processing progress/log/result preview.
9. Produce the existing clean-video output contract (`*_no_sub.mp4` / current P2 output behavior).

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

## Reuse requirements
- Reuse current Pipeline 2 backend/inpaint execution.
- Preserve existing algorithms: STTN Auto, LaMa, ProPainter, OpenCV where currently supported.
- Preserve current manual multi-region processing.
- Preserve per-region `maskMode` semantics (`region.maskMode || job.maskMode`).
- Prefer extracting/reusing a thin UI/controller boundary if needed rather than duplicating processing logic.

## Scope allowed
Primary expected areas:
- `src/renderer/index.html`
- `src/renderer/js/app.js`
- `src/renderer/styles/main.css`
- existing P2 renderer modules only if a narrow reuse adapter/extraction is required.
- `.ai/` project knowledge required for this task.

## Scope forbidden
- No new inpaint engine or duplicate backend processing implementation.
- No behavior changes to P1 AI reasoning/Standard/Semantic.
- No TTS or Voice Render behavior changes.
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
- Cancel/error must not falsely mark output finished.
- Switching pages must not accidentally trigger P1/P3.

## Acceptance criteria
1. Navigation contains `Xoa Sub` directly below Voice Render.
2. Opening it presents a standalone subtitle-removal workflow without requiring P1 artifacts.
3. Existing P2 inpaint/backend path is reused; no duplicate processing engine is introduced.
4. User can select a video and run Auto removal.
5. User can use Manual mode and draw multiple regions.
6. Per-region mask mode remains effective.
7. Manual drawing enabled => drawable preview cursor visibly becomes crosshair.
8. Drawing disabled/Auto => cursor returns to normal.
9. Region geometry remains aligned with the point where the Owner drew it; cursor change introduces no coordinate regression.
10. Existing P1, Voice Render, Settings and P3 behavior is not changed by this feature.
11. Existing clean-video output contract remains compatible with P3.

## Verification required
### Static
- Show exact branch and HEAD.
- Show changed files and diff summary.
- `git diff --check` PASS.
- Run applicable JS syntax/static checks for every changed JS file.
- Confirm no backend/inpaint-engine duplication.

### Manual Owner QA after PM code-review PASS
- Open Xoa Sub directly.
- Select a known video.
- Auto removal smoke test.
- Manual mode: enable drawing and confirm crosshair only on drawable preview.
- Draw at least two regions; verify displayed boxes remain aligned with drag positions.
- Give regions different mask modes and run removal.
- Verify progress/result/output.
- Disable drawing / switch Auto and verify normal cursor.
- Navigate to Voice Render/P1 and confirm no obvious regression.

## Gates
- Execution: NOT STARTED
- Automated/static verification: WAITING
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING
- Merge permission: BLOCKED
