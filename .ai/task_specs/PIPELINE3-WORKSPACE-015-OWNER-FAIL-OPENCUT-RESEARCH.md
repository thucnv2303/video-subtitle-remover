# PIPELINE3-WORKSPACE-015 — Owner Runtime FAIL + OpenCut Research

Status: OWNER_RUNTIME_FAIL / NEEDS_REVISION / SOURCE REBUILD FROZEN PENDING REVISED DESIGN APPROVAL

## Exact failing build
- Review branch / Draft PR: `review/PIPELINE3-WORKSPACE-015` / #57
- Owner-tested exact branch head before this evidence commit: `75b7a62fe5b7892dc2de9fb78ae60e82cc8825c9`
- Owner runtime evidence: two real-app screenshots supplied 2026-08-14.

## Owner-observed failures
1. Pipeline 3 color/tone is inconsistent with the already-approved demo and with the rest of the application.
2. Dedicated Job Management is missing. The implementation exposes only a compact Job selector and hides the compatibility Job list.
3. Final video preview uses the wrong workspace geometry/aspect presentation. The source video is visually stretched into an excessively wide/short editor region instead of being treated as an aspect-ratio-preserving logical canvas fitted inside a viewport.
4. Owner requested OpenCut research before redoing Pipeline 3.

These findings invalidate Owner acceptance for the current P3 V1. PR #57 remains useful only as prototype/source evidence and MUST NOT be merged in this state.

## Verified local source causes
- `pipeline3-workspace.css` creates a custom P3-local black/purple presentation rather than deriving its surface/card/border hierarchy from the approved P1/P2 navy-blue visual system.
- `pipeline3-workspace.js` has a top Job `<select>` but no visible Job Management panel. The legacy `#step3-job-list` is hidden for compatibility.
- The preview wrapper is sized primarily by flexible workspace height while `<video>` fills the wrapper with `object-fit: contain`; the source aspect ratio is therefore preserved only inside a wrongly shaped viewport rather than making the source canvas geometry first-class.
- `pipeline3-workspace.js` is a large all-in-one workspace module with periodic 300 ms synchronization; this is acceptable for a prototype but is not the desired architecture for the rebuild.

## OpenCut research — verified patterns
Research basis: official `OpenCut-app/OpenCut` and `OpenCut-app/opencut-classic` repositories.

### Which OpenCut source is relevant
- The current OpenCut repository states that OpenCut is being rewritten from the ground up and points users to `opencut-classic` as the usable editor while the rewrite is in progress.
- `opencut-classic` is archived, so it is a reference architecture/UI study source only; no source is to be copied wholesale.

### Editor information architecture
The classic editor page composes four explicit regions:
- left `AssetsPanel`;
- center `PreviewPanel`;
- right `PropertiesPanel`;
- bottom `Timeline` in a separately resizable vertical panel.

The upper editor itself is a resizable horizontal group. This is materially closer to the Owner's required P3 workspace than the current PR #57 form-first layout.

### Preview geometry
OpenCut's preview viewport separates logical canvas dimensions from viewport dimensions and calculates fit scale as:
`min(viewportWidth / canvasWidth, viewportHeight / canvasHeight)`.
This keeps the logical scene aspect ratio authoritative while the surrounding panel can resize independently. P3 should adopt this geometry principle for the video canvas instead of making the editor panel's arbitrary rectangle the visual reference.

### Timeline architecture
OpenCut's timeline is decomposed into timeline component, track content, playhead, ruler, snapping, resize/drag hooks, store, selection and layout helpers. The useful lesson for this project is separation of responsibilities and event-driven state; P3 does not need OpenCut's full NLE feature set.

### Engine/UI separation
The current OpenCut rewrite explicitly aims to separate the editor engine/core from the UI. For this project the equivalent rule is: keep existing P3 finalization/backend contracts as the rendering engine boundary while rebuilding the editor UI/state around them.

## Revised P3 architecture direction
Do NOT cosmetically patch PR #57. The next implementation should be a P3 editor rebuild with these regions:

1. **Job Manager / Source Bin — left**
   - visible P3-ready Job list, status, source artifacts and selection;
   - active Job is obvious;
   - no hidden Job-management authority.

2. **Player / Logical Canvas — center**
   - source video metadata defines logical canvas width/height;
   - fit-to-viewport scaling preserves aspect ratio;
   - letterbox/pillarbox around the canvas is expected;
   - subtitle drag coordinates map between viewport and logical canvas explicitly;
   - preview controls stay attached to the player, not to an arbitrary card height.

3. **Properties Inspector — right**
   - Subtitle / Audio / Export tabs;
   - current supported controls only;
   - dense but not one extremely long form; sections can collapse where appropriate.

4. **Timeline — bottom**
   - separate video / voice / subtitle / effect tracks;
   - playhead and seek synchronized from one editor state;
   - V1 remains an assembly timeline, not a free NLE.

## Theme rule for rebuild
- Use the already-approved application palette as authority: navy page background, blue-gray surfaces/borders, blue primary focus/selection, semantic green/red/orange states.
- Purple may remain only where it is already an application semantic/accent action; it must not define a separate P3 theme.
- No P3-local independent color system.

## State/implementation rule
- Replace 300 ms polling as the primary synchronization mechanism with explicit Job/editor state updates and DOM/event subscriptions where possible within the current vanilla-JS architecture.
- Split P3 responsibilities into focused modules rather than another monolith: editor/store, Job panel, preview/geometry, timeline, inspector, subtitle ASS adapter, render controller/re-render safety.
- Preserve existing P1/P2 artifacts and existing P3 finalizer/backend contracts unless a separately verified missing capability requires a new contract.

## Gate impact
- Execution: PASS only for publication of the failed prototype; product result is NEEDS_REVISION.
- Automated/static: WAITING; Owner did not provide static command output with this runtime report.
- Code review: prior source logic/scope review remains historical evidence, but current product review decision is NEEDS_REVISION.
- Owner runtime: FAIL.
- Documentation synchronization: WAITING until canonical dynamic files are updated with this result.
- Merge: BLOCKED.

## Next permitted action
1. Synchronize canonical `.ai/` and PR #57 with Owner FAIL.
2. Freeze P3 application-source changes on PR #57.
3. Produce/review a revised P3 editor specification and layout based on the architecture above.
4. Only after Owner approves that revised design/spec, create a fresh dedicated rebuild branch/task from the approved integration base. Do not use PR #57 as merge-ready source.
