# PIPELINE1-PROMPT-MANAGER-V2-010

Status: APPROVED FOR PM DIRECT EXECUTION

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Exact base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch: `review/PIPELINE1-PROMPT-MANAGER-V2-010`
- Bug: `BUG-040`
- `PIPELINE1-LOG-OBSERVABILITY-009` / PR #52 is intentionally paused and OUT OF SCOPE.

## Owner requirement
Finish Prompt Manager as an isolated task before returning to log work. UI must follow the approved dark navy / blue mockup and the persistence workflow must be redesigned, not patched superficially.

## Verified defects
1. `prompt-manager.js::getPrompts()` returns `DEFAULT_PROMPTS` whenever saved array length is 0. Therefore an explicitly saved empty list resurrects old defaults after reopening/restart.
2. Legacy `p1` is hard-blocked from deletion.
3. Step 1 contains a separate hard-coded prompt list while modal/dropdown read localStorage, creating multiple UI sources of truth.
4. `pipeline1-run-config.js::_resolvePrompt()` can fall back to stale `ai_prompt` when no selected prompt is found.
5. Product default prompt is obsolete subtitle/SRT translation content, while proven Standard behavior requires grounded continuous Vietnamese narration and zero CJK leakage.

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
- `ai_prompts`: array of `{ id, name, description, content }` and an explicitly saved `[]` remains authoritative.
- `ai_active_prompt_id`: prompt used by next P1 run.
- `ai_default_prompt_id`: preferred prompt when an active prompt must be re-established.
- `ai_prompt`: compatibility mirror of the current active prompt content only; never an independent authority.
- `ai_prompts_v2_initialized=true`: records that V2 initialization/migration occurred.

### Initialization / migration
- If `ai_prompts` exists and parses to an array, preserve it exactly, including `[]`.
- If `ai_prompts` is absent, seed one corrected Standard prompt and persist it once.
- Never use `array.length === 0` as a signal to restore defaults.
- Normalize invalid/missing active/default IDs against the actual store.

### CRUD behavior
- Create starts a clean draft; Save creates a new ID.
- Edit Save updates only selected prompt.
- Delete allows deleting any prompt, including the seeded/default prompt.
- Delete active prompt: select default if still valid, otherwise first remaining prompt; if none remain, clear active/default/`ai_prompt`.
- Delete all persists `[]`, clears active/default/`ai_prompt`, and remains empty after reload.
- Set default is explicit and unique.
- `Sử dụng Prompt này` sets active and compatibility mirror.
- Reorder persists array order.
- Name/content required; description optional.

### Step 1 integration
- Replace hard-coded prompt rows dynamically from the same store.
- Step 1 selected state follows `ai_active_prompt_id`.
- Add/Edit/Delete buttons operate on the same V2 store/modal.
- Existing `#ai-prompt-select` dropdown is also rendered from the same store for compatibility.
- When store is empty, show an empty state and no phantom/default prompt.

### P1 run safety
`pipeline1-run-config.js` must resolve prompt exclusively from `ai_prompts` + active/select ID. It must NOT use stale `ai_prompt` as an independent fallback when the store is empty or selection is invalid. Starting P1 with no valid prompt must fail with the existing clear prompt-required error.

## Corrected seeded Standard prompt
Seed only on first initialization when no `ai_prompts` key exists. The seed must require:
- analyze the entire source video using available transcript + visual evidence;
- produce one coherent, natural Vietnamese narration for the whole video;
- remain grounded in source evidence and not invent unsupported process/product claims;
- do not output SRT formatting instructions as the narration contract;
- do not copy CJK characters from source into final narration; translate/paraphrase into Vietnamese/Latin text or omit uncertain source text;
- prefer flowing narration rather than bullet-list output;
- keep concise enough for natural TTS; runtime deterministic quality guards remain authoritative.

## Authorized application source
Exactly:
- `src/renderer/js/components/prompt-manager.js`
- `src/renderer/js/pipeline1-run-config.js`
- new `src/renderer/styles/prompt-manager-v2.css`

No `index.html` replacement is required; modal and Step 1 prompt UI may be rebuilt dynamically to avoid CRLF formatting churn.

## Forbidden changes
- no log routing / PR #52 source
- no P2/P3/backend/TTS engine
- no AI/Vision algorithms or prompt-quality deterministic guards
- no dependencies
- no broad `app.js` or `index.html` rewrite
- no unrelated formatting
- no force push/history rewrite

## Verification
Required source review:
- source diff limited to the three authorized files;
- explicit `[]` remains empty after reload path;
- no protected undeletable prompt;
- active/default cleanup is deterministic;
- Step 1 hard-coded rows are replaced dynamically;
- dropdown and modal share store;
- `_resolvePrompt()` cannot resurrect stale `ai_prompt`;
- corrected seeded prompt is continuous narration / ZERO-CJK compatible;
- log/P2/P3 source unchanged.

Executable checks when exact checkout is available:
```text
node --check src/renderer/js/components/prompt-manager.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

## Owner runtime acceptance
1. UI matches approved dark navy / blue Prompt Manager V2 hierarchy.
2. Create/edit/save/reorder prompt persists after close + reopen and full app restart.
3. Delete any prompt works, including initially seeded/default prompt.
4. Delete all -> close -> reopen -> restart stays empty; old prompt must not return.
5. Active badge/use action is consistent in modal, Step 1 and dropdown.
6. Delete active selects a valid replacement or clears active when list becomes empty.
7. Set default persists and remains unique.
8. P1 refuses to start when prompt list is empty; after selecting a valid prompt it snapshots exactly that content.

## Gates
- Execution: authorized.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: NOT STARTED.
- Documentation synchronization: WAITING.
- Merge: BLOCKED.