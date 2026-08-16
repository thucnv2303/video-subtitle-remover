# PIPELINE3-INSPECTOR-LAYOUT-020

## Goal
Promote Pipeline 3 Finalize/Inspector to the primary editing surface on desktop by giving it materially more horizontal space while preserving enough Preview/Timeline width for accurate subtitle placement.

## Starting authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch: `review/PIPELINE3-INSPECTOR-LAYOUT-020`
- Starting SHA: `fff244caab7edd1d05bd0c6e94f83831f84354d3`
- Parent P3 Draft PR: #58 remains unmerged and unchanged by this task.

## Verified UI problem
Owner screenshot shows the right `3. Hoàn thiện Final` inspector compressed into a narrow sidebar while Preview dominates the workspace. Current Rev4 runtime CSS caps the inspector around 340-390px, causing dense controls and poor primary-action hierarchy.

## Product decision
Desktop hierarchy:
1. Job Manager remains a narrow secondary rail.
2. Preview/Timeline remains large enough for precise subtitle placement but no longer owns all remaining width.
3. Finalize Inspector becomes a first-class editing panel, approximately 30-35% of usable P3 workspace at common wide desktop sizes.

## Scope
Application source change only in the existing effective layout authority:
- `src/renderer/js/pipeline3/runtime-fix-rev4.js`

Do not create another CSS override layer. Do not modify render logic, subtitle engine, P1/P2, TTS, backend, dependencies, or P3 artifact contracts.

## Layout requirements
- Wide desktop: inspector target about 500-600px, capped responsively rather than fixed at ~390px.
- Preview center column may shrink, but retain a practical minimum for portrait/landscape placement.
- Job rail stays near 200-230px.
- Two-column inspector controls remain two columns when space permits; collapse to one column before clipping.
- No horizontal clipping/scrolling in inspector.
- Render CTA remains fully visible.

## Acceptance
1. At Owner's current window size, `3. Hoàn thiện Final` is visibly wider than before and all style controls are readable without clipping.
2. Preview remains usable and video canvas geometry/aspect behavior is unchanged.
3. Timeline remains usable.
4. Inspector nested two-column controls render cleanly; at narrower widths they collapse gracefully.
5. No P3 logic/runtime behavior changes beyond layout.
6. Static: `node --check src/renderer/js/pipeline3/runtime-fix-rev4.js` and `git diff --check fff244caab7edd1d05bd0c6e94f83831f84354d3..HEAD`.

## Gates
Execution WAITING; automated/static WAITING; code review WAITING; Owner UI verification NOT STARTED; docs sync PARTIAL; merge BLOCKED.
