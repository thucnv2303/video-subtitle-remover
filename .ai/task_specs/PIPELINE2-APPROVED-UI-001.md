# PIPELINE2-APPROVED-UI-001

Status: ACTIVE
Date: 2026-08-10

## Goal
Rebuild Pipeline 2 UI to the Owner-approved demo while preserving the existing subtitle-removal engine and the accepted P1→P2/P2→P3 state boundaries.

## Authority / stacked basis
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/PIPELINE2-APPROVED-UI-001`
- Exact starting SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`
- This branch is intentionally stacked on the current unmerged P1 checkpoint PR #41 so the Owner can continue runtime testing with the accepted P1 functional checkpoint present.
- PR #41 remains unmerged. This task does not authorize merging or modifying P1 functionality.

## Owner-approved visual authority
The approved Pipeline 2 demo dated 2026-08-10 is authoritative.
Pipeline 2 must use the same dark navy / blue visual language, card system, typography, spacing, responsive behavior, queue density and Console style established by the accepted Pipeline 1 UI.

Required screen structure:
1. `Điều khiển & Thuật toán`.
2. `Job Queue` — dominant fixed-height/available-height queue with internal vertical scroll and support for many jobs.
3. `Chi tiết job đang chọn` — original video and cleaned/result preview, selected-job metadata and P2 actions.
4. `Hành động` — central run/pause/refresh-or-add-from-P1/delete-selected controls.
5. `Console / Log` — readable internal-scroll log panel.
6. A compact read-only `Kết quả từ Pipeline 1` summary may appear under the control card for source/artifact readiness only.

## Pipeline responsibility boundary
Pipeline 2 input is the ORIGINAL source video of a job that has successfully completed Pipeline 1.
Pipeline 2 may only detect/remove burned-in subtitles and produce the clean-video result.
Pipeline 2 MUST NOT:
- run ASR/OCR reasoning as Pipeline 1 work;
- AI rewrite text;
- generate TTS;
- modify P1 artifacts;
- perform final remix/render;
- accept a direct file upload/drop bypass around the P1 handoff gate.

## Existing handoff contract — preserve exactly
- New P1 job: P2 locked.
- P1 error/cancel: P2 locked.
- P1 successful completion: exact matching job becomes P2 ready.
- P2 success: P3 ready.
- P2 start remains subtitle-removal-only (`extractSrt=false`, `asrFallback=false`, `aiRewrite=false`, `ttsGenerate=false`).

## Product source scope
Allowed source files:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css` (new file)

No other application-source file is authorized in this UI task.

Forbidden source changes:
- `src/renderer/js/app.js`
- `src/renderer/js/pipeline-state.js`
- `src/renderer/index.html`
- `src/renderer/js/api.js`
- `src/renderer/js/pipelines/pipeline2-remove.js`
- all backend/Python files
- all P1/P3/Settings source
- package/dependency files

If the approved UI cannot be implemented while preserving current P2 runtime contracts inside the allowed source set, STOP and report the exact missing contract. Do not broaden scope.

## Implementation strategy
Use the same safe adapter pattern as the approved P1 UI:
- `pipeline.js` must synchronously mount/reorganize the Step 2 DOM before legacy `app.js` binds its listeners.
- Preserve existing P2 business logic and existing runtime DOM contracts.
- Add `pipeline2-approved.css` and have the Step 2 adapter load it.
- Do not rewrite the subtitle-removal engine.
- Do not reformat or rewrite unrelated P1 code already present in `pipeline.js`; add an isolated P2 section/functions only.

## Mandatory pre-edit audit
Before editing, inspect the exact remote starting SHA and record:
1. all Step 2 IDs in `src/renderer/index.html`;
2. all Step 2 IDs/functions read by `src/renderer/js/app.js`;
3. all P2 selectors/state used by `src/renderer/js/pipeline-state.js`;
4. existing selected-job, preview, progress, start/stop/cancel and log contracts.

Create a required-ID manifest in the final report. Every runtime ID required by existing P2 logic must exist exactly once after mounting.

Known contracts that must remain present when currently used include at least:
- `job-list`
- `btn-start`
- `btn-open-file` (may remain hidden compatibility control; MUST NOT provide direct P2 upload)
- `drop-zone` (may remain hidden compatibility node; MUST NOT accept P2 drop)
- `algo-select`
- `mask-mode`
- `meta-name`, `meta-res`, `meta-fps`, `meta-dur`
- `canvas-original`, `canvas-result`
- `subtitle-overlay`
- `result-placeholder`
- `timeline-orig`, `timeline-result`
- existing original/result playback controls used by `app.js`

This list is not a substitute for the mandatory source audit; preserve every additional current P2 runtime ID discovered.

## Required UI behavior
### Job Queue
- Shows only P2-eligible jobs from the existing handoff state.
- Supports 0, 1 and 10+ jobs.
- Internal vertical scrolling; queue growth must never push the Actions panel out of the app viewport.
- Rows show selected state, filename, P1 source marker, P2 status and progress.
- Status labels visually distinguish ready / queued / processing / finished / error.
- Clicking a row selects that exact job and drives the detail panel/actions.
- No destructive per-row delete/action clutter.

### Controls / Algorithm
- Keep existing algorithm and mask runtime values/options; this task may reorganize their presentation but must not invent unsupported engine options.
- Auto/manual controls are presentation-only unless an existing runtime contract already supports them.
- P1 result summary is read-only and must not imply P2 consumes TTS/remix content for subtitle removal.

### Selected Job Detail
- Show metadata from the selected job.
- Original preview uses the original source.
- Result area shows existing processed/result preview when available; otherwise a clear placeholder.
- Do not fake a cleaned preview before engine output exists.
- Actions such as mask/frame preview may only be enabled when an existing handler/contract actually exists; unsupported demo-only buttons must be disabled/omitted rather than fake-functional.

### Actions
- Primary Start acts on the selected eligible job using the existing P2 start handler/state gate.
- Stop/Pause/Cancel behavior must use existing runtime handlers only; do not invent engine cancellation semantics.
- `+ Thêm job` means refresh/sync eligible jobs from the P1 handoff state, NOT direct file upload.
- Delete selected may only remove an eligible non-processing UI/job entry through an existing safe state path. If the existing code does not expose a safe contract, leave the control disabled and report it rather than editing `app.js`.

### Console / Log
- Same tone/density as P1.
- Internal scrolling and readable font.
- Reuse existing logs; do not duplicate backend logs or generate fake engine events.

## Responsive requirements
- Fullscreen uses available app width and height without large dead margins.
- Desktop layout: control column + queue column + detail/log column matching approved demo proportions.
- Queue and log scroll internally.
- At narrower widths, columns may stack/reflow without hiding primary actions.
- No hard `100vh` calculation that lets Windows taskbar/system chrome cover the bottom controls; fit to the actual app content box using flex/min-height:0 patterns already proven in P1.

## Verification required before publication
1. Exact changed application source set equals:
   - `src/renderer/js/pipeline.js`
   - `src/renderer/styles/pipeline2-approved.css`
2. No P1/P3/Settings/backend/dependency source diff.
3. `node --check src/renderer/js/pipeline.js` PASS on the exact staged/published content.
4. Required-ID manifest: every P2 runtime ID discovered in pre-edit audit exists exactly once in the mounted Step 2 DOM.
5. Static assertions:
   - no direct P2 upload/drop UX;
   - queue has internal-scroll class/structure;
   - Actions remains separate from Job rows;
   - P2 adapter contains no AI/TTS/final-render logic.
6. If practical, run existing renderer/static tests that cover DOM/runtime contracts. Record exact command/output.
7. Inspect `git diff --cached` before each commit; source and docs commits must be separate.

## Dirty-tree / execution safety
Use a NEW isolated clean worktree from exact remote `review/PIPELINE2-APPROVED-UI-001` authority HEAD.
Never use the Owner's dirty main worktree for implementation.
Never use `git add .` or `git add -A`.
Never reset/clean/restore/checkout over dirty files, force push, amend/rebase, rewrite history or run broad rewrite scripts.
On unexpected error or inability to isolate the allowed source diff: STOP. Do not self-repair.

## Documentation before WAITING_REVIEW
Update affected canonical state on the same review branch:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/decisions.md` only if a real architecture/product decision changes
- `.ai/bugs.md` only for newly discovered defects

Do not claim Owner PASS before Owner runs the real app.

## Publication
- Source commit first.
- Documentation commit second.
- Push `review/PIPELINE2-APPROVED-UI-001` normally.
- Open/update a Draft PR stacked on `review/BUG-005-P1-FULL-CHAIN` while PR #41 remains unmerged.
- PR body must state the dependency explicitly and keep Merge BLOCKED.

## Owner acceptance after PM code review PASS
Owner tests:
- visual parity with approved P2 demo and P1 tone;
- 0 / 1 / 10+ eligible jobs;
- queue internal scroll with Actions always visible;
- selected-job detail drives correct original/result panes;
- P2 contains no direct upload path;
- only P1-unlocked jobs appear;
- Start uses existing P2 subtitle-removal route;
- responsive/fullscreen fit;
- Console readability.

Owner test is NOT AUTHORIZED until PM reviews the published GitHub diff and returns PASS.
Merge permission: BLOCKED.
