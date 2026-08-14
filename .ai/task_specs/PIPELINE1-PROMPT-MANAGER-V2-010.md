# PIPELINE1-PROMPT-MANAGER-V2-010

Status: APPROVED FOR PM DIRECT EXECUTION — RUNTIME REVISION 1

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Exact base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch: `review/PIPELINE1-PROMPT-MANAGER-V2-010`
- Draft PR: #53
- Runtime-revision-1 starting HEAD: `3430fc166c39beed1f44815faad7efe8e60dd59b`
- Bug: `BUG-040`
- `PIPELINE1-LOG-OBSERVABILITY-009` / PR #52 remains paused and OUT OF SCOPE.

## Owner requirement
Finish Prompt Manager as an isolated task before returning to log work. UI must follow the approved dark navy / blue mockup and the persistence workflow must be redesigned, not patched superficially.

## Verified defects
1. Legacy `prompt-manager.js::getPrompts()` restored defaults whenever saved array length was 0, so an explicitly saved empty list resurrected old data after reopening/restart.
2. Legacy `p1` was hard-blocked from deletion.
3. Step 1 contained a separate hard-coded prompt list while modal/dropdown read localStorage, creating multiple UI sources of truth.
4. Legacy `pipeline1-run-config.js::_resolvePrompt()` could fall back to stale `ai_prompt` when no selected prompt was found.
5. Product default prompt was obsolete subtitle/SRT translation content instead of the proven grounded continuous Vietnamese narration / ZERO-CJK contract.

## Owner runtime failure — 2026-08-14 / revision 1
Owner successfully launched the exact task worktree after dependency installation, but clicking Prompt Management / Quản lý does not open the Prompt Manager modal. Backend health, WebSocket, GPU and application startup are otherwise healthy.

### Verified wiring gap
- `src/renderer/js/app.js` performs a one-shot delayed module initialization after only 100 ms:
  - if `window.initPromptManager` exists, it calls it;
  - otherwise it only emits a console warning;
  - there is no retry, yet the app continues and logs `App khởi động thành công.`.
- Prompt Manager V2 currently depends on `initPromptManager()` to build the modal and attach launch handlers.
- Therefore a cold ES-module load that is not ready inside that 100 ms window can leave Prompt Manager uninitialized while the rest of the app appears healthy.
- This task will NOT edit `app.js`; the Prompt Manager module must become self-initializing and launch wiring must tolerate dynamically replaced Step 1 buttons.

## Product design
Prompt Manager V2 uses ONE persisted prompt store and explicit UI states.

### Layout
- Large two-column modal matching approved dark navy / blue design.
- Left: prompt count, `+ Prompt mới`, prompt cards, active/default badges, reorder controls, `Xóa tất cả`, empty state.
- Right: selected/draft prompt editor with Name, optional Description, Prompt Content, character counts, save/default/delete actions.
- Footer: `Đóng` and primary `Sử dụng Prompt này`.
- Destructive actions red; primary/selected actions blue; active state green.

### State model
Persist in existing compatibility keys:
- `ai_prompts`: array of `{ id, name, description, content }`; explicitly saved `[]` remains authoritative.
- `ai_active_prompt_id`: prompt used by next P1 run.
- `ai_default_prompt_id`: preferred replacement/default prompt.
- `ai_prompt`: compatibility mirror of active content only, never independent authority.
- `ai_prompts_v2_initialized=true`: records V2 initialization/migration.

### Initialization / migration
- If `ai_prompts` is absent, seed one corrected Standard prompt and persist it once.
- If `ai_prompts` exists and parses to an array, preserve the user list, including `[]`.
- On first V2 migration only, replace exactly the untouched legacy single seed (`id=p1` + old subtitle-translation content). Preserve customized or multi-item lists.
- Never use `array.length === 0` as a signal to restore defaults.
- Normalize invalid/missing active/default IDs against actual stored items.

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
- Replace hard-coded prompt rows dynamically from the same store.
- Step 1 selected state follows `ai_active_prompt_id`.
- Add/Edit/Delete operate on the same V2 store/modal.
- Existing `#ai-prompt-select` dropdown renders from the same store for compatibility.
- Empty store shows an empty state and no phantom/default prompt.

### P1 run safety
`pipeline1-run-config.js` resolves prompt exclusively from `ai_prompts` + active/select ID. It must NOT use stale `ai_prompt` as fallback when store is empty or selection invalid. Starting P1 with no valid prompt must fail with the existing prompt-required error.

## Corrected seeded Standard prompt
Seed only when `ai_prompts` is absent or during exact untouched-legacy-seed migration. It must require:
- analyze the whole source video using transcript + visual evidence;
- one coherent natural Vietnamese narration;
- grounded source evidence, no unsupported claims;
- no SRT-format narration contract;
- no copied CJK in final narration; translate/paraphrase to Vietnamese/Latin or omit uncertain source text;
- flowing narration rather than bullet list;
- concise natural TTS; deterministic P1 quality guards remain authoritative.

## Runtime revision 1 implementation requirements
Only `src/renderer/js/components/prompt-manager.js` may change for this runtime correction.
1. Prompt Manager module self-initializes when its ES module is evaluated. If DOM is still loading, initialize once on `DOMContentLoaded`; otherwise schedule initialization immediately.
2. Existing exported `initPromptManager()` remains idempotent so the legacy `app.js` call is harmless when it arrives before/after self-init.
3. Launch wiring uses one delegated document-level click handler for:
   - `#btn-manage-prompts` → open current/active prompt;
   - `#step1-btn-edit-prompt` → open current/active prompt;
   - `#step1-btn-add-prompt` → open clean new-prompt draft.
4. Delegated launcher must survive `renderStep1PromptBox()` replacing its child buttons.
5. Remove duplicate direct add/edit/manage launch bindings so one click cannot double-open/re-render.
6. Step 1 delete may remain locally bound or be delegated once, but must not duplicate.
7. If modal shell is absent, fail safely without affecting the rest of app.
8. No app/backend/log/P2/P3 changes.

## Authorized application source
Final task scope remains:
- `src/renderer/js/components/prompt-manager.js`
- `src/renderer/js/pipeline1-run-config.js`
- `src/renderer/styles/prompt-manager-v2.css`

Runtime revision 1 modifies only `prompt-manager.js`.

## Forbidden changes
- no log routing / PR #52 source
- no P2/P3/backend/TTS engine
- no AI/Vision algorithms or quality guards
- no dependencies
- no `app.js` or `index.html` changes
- no unrelated formatting
- no force push/history rewrite

## Verification
Required source review:
- revision-1 source diff limited to `prompt-manager.js`;
- self-init is idempotent and does not create duplicate modal handlers;
- delegated launch survives Step 1 DOM replacement;
- one click produces one open action;
- persistence/state behavior from V2 remains unchanged;
- log/P2/P3 source unchanged.

Executable checks on exact latest checkout:
```text
node --check src/renderer/js/components/prompt-manager.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner runtime acceptance
1. Clicking `Quản lý` or the compatibility `Quản lý` button always opens Prompt Manager V2 after cold app startup.
2. `+ Prompt mới` opens a clean new draft.
3. UI matches approved dark navy / blue hierarchy.
4. Create/edit/save/reorder persists after close/reopen and full restart.
5. Delete any prompt works, including initially seeded/default.
6. Delete all -> close -> reopen -> restart stays empty; old prompt does not return.
7. Active/default badge/action is consistent in modal, Step 1 and dropdown.
8. Delete active selects a valid replacement or clears active when empty.
9. P1 refuses to start when prompt list is empty; after selecting a valid prompt it snapshots exactly that content.

## Gates
- Execution: revision 1 authorized.
- Automated/static: prior source PASS; revision-1 static WAITING.
- Code review: revision-1 WAITING.
- Owner runtime: FAIL on prior source / RETEST WAITING.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
