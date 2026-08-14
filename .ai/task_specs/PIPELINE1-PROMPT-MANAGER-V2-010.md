# PIPELINE1-PROMPT-MANAGER-V2-010

Status: APPROVED FOR PM DIRECT EXECUTION — RUNTIME REVISION 2 / NEW-PROMPT ROUTING

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Exact base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch: `review/PIPELINE1-PROMPT-MANAGER-V2-010`
- Draft PR: #53
- Runtime-revision-2 starting HEAD: `2a19d71dc3456013c764ee5894e74f90295a6340`
- Bug: `BUG-040`
- `PIPELINE1-LOG-OBSERVABILITY-009` / PR #52 remains paused and OUT OF SCOPE.

## Owner requirement
Finish Prompt Manager as an isolated task before returning to log work. UI must follow the approved dark navy / blue mockup and the persistence workflow must be reliable for create/edit/delete/default/active/empty states.

## Verified legacy/product defects
1. Legacy `prompt-manager.js::getPrompts()` restored defaults whenever saved array length was 0, so an explicitly saved empty list resurrected old data after reopening/restart.
2. Legacy `p1` was hard-blocked from deletion.
3. Step 1 contained a separate hard-coded prompt list while modal/dropdown read localStorage, creating multiple UI sources of truth.
4. Legacy `pipeline1-run-config.js::_resolvePrompt()` could fall back to stale `ai_prompt` when no selected prompt was found.
5. Product default prompt was obsolete subtitle/SRT translation content instead of the proven grounded continuous Vietnamese narration / ZERO-CJK contract.

## Runtime revision 1 result
Revision 1 made Prompt Manager self-initializing and delegated the Step 1 Manage/Add launch controls. Owner then confirmed exact local HEAD `2a19d71dc3456013c764ee5894e74f90295a6340` and reported:
- Prompt Manager can now be reached;
- clicking `+ Prompt mới` does NOT expose/reset the Name/Content editor for a new draft.

This is an Owner runtime FAIL for the create-prompt entry path.

## Verified current-source routing inconsistency
Current `prompt-manager.js` has two different routes for the same new-prompt intent:
- Step 1 `#step1-btn-add-prompt` is handled by delegated document routing and calls `openModal(null, true)`;
- modal-local `#prompt-v2-new` still has its own direct listener that only calls `fillEditor(null, true)`.

Owner runtime proves the modal-local direct route is not reliable in the current renderer lifecycle. The revision-2 correction must unify it with the already delegated Step 1 new-prompt route instead of duplicating prompt persistence logic.

## Product design / state model
Prompt Manager V2 remains ONE persisted prompt store:
- `ai_prompts`: array of `{ id, name, description, content }`; explicitly saved `[]` is authoritative;
- `ai_active_prompt_id`: prompt used by next P1 run;
- `ai_default_prompt_id`: preferred replacement/default prompt;
- `ai_prompt`: compatibility mirror of active content only, never independent authority;
- `ai_prompts_v2_initialized=true`: V2 migration marker.

### CRUD behavior
- Create starts a clean draft; Save creates a new ID.
- Edit Save updates only selected prompt.
- Delete allows deleting any prompt, including seeded/default.
- Delete active: select valid default, otherwise first remaining; if none remain, clear active/default/`ai_prompt`.
- Delete all persists `[]`, clears active/default/`ai_prompt`, and remains empty after reload.
- Set default is explicit and unique.
- `Sử dụng Prompt này` sets active and mirror.
- Reorder persists array order.
- Name/content required; description optional.

### Step 1 integration
- Step 1 rows, modal and compatibility dropdown all read the same store.
- Empty store shows no phantom/default prompt.
- P1 run config resolves only a real stored prompt and must not resurrect stale `ai_prompt`.

## Runtime revision 2 implementation design
Avoid another GitHub contents-API rewrite of CRLF `prompt-manager.js` for a two-line event-routing correction. Instead add a narrow LF compatibility bridge loaded through existing LF `pipeline1-run-config.js`.

Authorized source for revision 2:
- new `src/renderer/js/components/prompt-manager-new-flow.js`;
- `src/renderer/js/pipeline1-run-config.js` only to import that bridge.

Bridge requirements:
1. Install exactly one document capture listener for modal-local `#prompt-v2-new`.
2. Intercept only that button.
3. Prevent its unreliable direct target listener from running for this click.
4. Forward the intent through the existing `#step1-btn-add-prompt` delegated path so the canonical private `openModal(null, true)` state transition runs.
5. If the Step 1 Add element is temporarily absent, create a temporary hidden proxy with the same id, dispatch its click, then remove it; do not persist any extra UI/state.
6. Do NOT implement create/save/localStorage logic in the bridge. Persistence remains solely in Prompt Manager V2.
7. Do not touch modal close/save/delete/default/use/reorder behavior.
8. Do not change log routing, backend, P2/P3, AI/TTS processing, `app.js`, `index.html`, dependencies, or prompt quality gates.

## Full task application scope
- `src/renderer/js/components/prompt-manager.js`
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/styles/prompt-manager-v2.css`
- `src/renderer/js/components/prompt-manager-new-flow.js` (revision-2 compatibility bridge)

## Forbidden changes
- no log routing / PR #52 source
- no P2/P3/backend/TTS engine
- no AI/Vision algorithms or quality guards
- no dependencies
- no `app.js` or `index.html` changes
- no unrelated formatting
- no force push/history rewrite

## Verification
Required source review for revision 2:
- revision-2 source diff is exactly the new bridge + one import in `pipeline1-run-config.js`;
- bridge matches only `#prompt-v2-new`;
- one modal-local click produces exactly one forwarded Step 1 Add click;
- no prompt/localStorage CRUD code exists in the bridge;
- prompt-manager persistence/state code remains unchanged;
- log/P2/P3/backend source unchanged.

Executable checks on exact latest checkout:
```text
node --check src/renderer/js/components/prompt-manager-new-flow.js
node --check src/renderer/js/components/prompt-manager.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner runtime acceptance
1. Cold-start app; `Quản lý` opens Prompt Manager V2.
2. Click modal-local `+ Prompt mới`: Name/Description/Content become a clean new draft and state pill shows `Prompt mới`.
3. Enter valid Name + Content and Save: exactly one new prompt is created and remains after close/reopen.
4. Full restart preserves created/edited/reordered prompts.
5. Any prompt including seeded/default can be deleted.
6. Delete all -> close -> reopen -> restart remains empty; old prompt does not return.
7. Active/default state is consistent in modal, Step 1 and dropdown.
8. Empty prompt list blocks P1 start until a valid prompt exists.

## Gates
- Execution: revision 2 authorized.
- Automated/static: prior revision evidence superseded for changed files; revision-2 static WAITING.
- Code review: revision-2 WAITING.
- Owner runtime: FAIL on exact `2a19d71...`; revision-2 RETEST WAITING.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
