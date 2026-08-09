# RECOVERY-007E-SETTINGS-V1-001-REV7

Status: READY_FOR_EXECUTION
Date: 2026-08-09

## Goal
Implement Settings V1 from trusted source after INCIDENT-REV6-004. This is a fresh implementation. Do not reuse any invalidated REV2/REV3/REV4/REV5/REV6 implementation source, patch, candidate, stash, scratch artifact, or invalidated worktree.

## Trusted basis
- Canonical source basis: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Trusted project-state basis: `b88ffc62aec35cb28de7adf7ce70750f478b29f5`
- Review branch: `review/RECOVERY-007E-SETTINGS-V1-001-REV7`
- INCIDENT-REV6-004 evidence: PASS / RESOLVED; PR #37 closed unmerged.

GitHub verification confirms `b88ffc62...` differs from canonical `cf20a02...` only in `.ai` files and contains no source changes.

## Allowed source scope
Only:
- `src/renderer/index.html`
- `src/renderer/js/components/settings.js`

No CSS/API changes in REV7. If either file is insufficient, STOP and report BLOCKED.

## Required Settings structure
Exactly five top-level `.settings-card` sections inside Settings:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

Required IDs exactly once:
- `output-dir-text`
- `btn-output-dir`
- `ai-provider`
- `ai-api-key`
- `ai-model`
- `ai-endpoint`
- `tts-status-chip`
- `btn-save-ai`
- `backend-status-chip`
- `gpu-status-chip`
- `btn-refresh-diagnostics`

## Provider behavior
Gemini / DeepSeek:
- API key visible
- model visible
- endpoint hidden

Ollama:
- API key hidden
- model visible
- endpoint visible

Storage authority:
- cloud API keys: `ai_api_keys_<provider>`
- provider models: `ai_model_<provider>`
- Ollama endpoint: `ai_endpoint`

Rules:
- blank model save must persist blank for current provider;
- saving provider A must not mutate provider B;
- no normal global `ai_model` authority;
- no normal global `ai_api_key` write;
- no `ai_endpoint_deepseek`;
- no `p1_default_ai_model`;
- no `p1_default_tts_voice`.

## Legacy migration
Legacy `ai_api_key` may migrate only on initial load of the persisted Gemini/DeepSeek provider when that provider's own key list is missing/empty. Ordinary provider switching must never migrate or resurrect legacy data.

## Diagnostics
Use only:
- `window.api.health()`
- `window.api.gpuInfo()`
- `window.api.getTTSStatus()`

No direct `fetch` for Settings diagnostics.
CPU-only (`cuda_available === false`) is a valid neutral/non-error state.

Preserve existing TTS/voice-clone contracts and P1/P2/P3 boundaries.

## REV7 execution method
Use a NEW isolated clean worktree from the exact current remote REV7 authority HEAD.

Before editing, record:
- `git status --short`
- `git ls-files --eol src/renderer/index.html src/renderer/js/components/settings.js`
- `git hash-object src/renderer/index.html`
- `git hash-object src/renderer/js/components/settings.js`

The source blobs must match canonical source basis. If not, STOP.

Edit tracked files directly with the normal editor only. Do not use external candidate directories or generated patches.

Edit ONE source file at a time.

After editing `index.html`, before touching `settings.js`, run:
- `git diff --check -- src/renderer/index.html`
- `git diff --numstat -- src/renderer/index.html`
- inspect complete diff for `src/renderer/index.html`

Hard gate for `index.html`:
- no warning/error;
- no EOL-only/full-file churn;
- additions + deletions <= 160;
- Settings DOM is structurally coherent;
- if gate fails, STOP. Do not repair in the same execution.

Then edit `settings.js`.

After editing `settings.js`, run:
- `node --check src/renderer/js/components/settings.js`
- `git diff --check -- src/renderer/js/components/settings.js`
- `git diff --numstat -- src/renderer/js/components/settings.js`
- inspect complete diff for `src/renderer/js/components/settings.js`

Hard gate for `settings.js`:
- no warning/error;
- no EOL-only/full-file churn;
- additions + deletions <= 220;
- if gate fails, STOP. Do not repair in the same execution.

## Forbidden actions
- reuse/mining of invalidated implementation source or scratch artifacts;
- external candidate/baseline-copy workflow;
- `git apply` or generated patch files;
- Python/Node/PowerShell/sed/perl source rewrite/string-replacement scripts;
- generated source-helper scripts;
- line-ending normalization/conversion;
- changing `core.autocrlf`, `core.whitespace`, or `.gitattributes` to alter source handling;
- `git checkout <path>`;
- `git restore`;
- `git reset`;
- `git clean`;
- rebase/amend/force push/history rewrite;
- `git add .`;
- `git add -A`;
- `git add --renormalize`;
- `git rm --cached` for source handling;
- `--no-verify`;
- shell fallbacks that mask failures.

First unexpected required warning/error/nonzero gate => STOP. Do not self-repair after a failed required gate.

## Final verification before commit
Only after both per-file gates pass:
1. `node --check src/renderer/js/components/settings.js`
2. inspect `package.json` / test locations read-only; if no applicable Settings tests, record `Applicable Settings tests: NONE FOUND`
3. `git diff --check` => exit 0 / no output
4. `git ls-files --eol src/renderer/index.html src/renderer/js/components/settings.js` => classifications must match pre-edit and no new mixed state
5. `git diff --stat`
6. `git diff --numstat`
7. inspect complete combined source diff
8. exactly five top-level Settings cards
9. every required hard ID exactly once
10. provider visibility: Gemini / DeepSeek / Ollama
11. provider-specific key isolation
12. provider-specific model isolation and blank clearing
13. legacy migration initial-load condition only; no switch resurrection
14. no normal global `ai_api_key` write
15. no global `ai_model` authority
16. forbidden/dead keys absent
17. diagnostics approved `window.api` methods only; no direct fetch
18. CPU-only neutral/non-error
19. TTS/voice-clone preserved
20. P1/P2/P3 boundaries preserved

Any failed condition => STOP without commit/push.

## Publication
Only after all source gates PASS:
- stage exact changed source paths only;
- inspect `git diff --cached --name-only` and complete cached diff;
- one source commit with normal hooks;
- minimally update exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`;
- separate docs commit;
- fetch origin; remote REV7 must still equal startup authority;
- fast-forward push only;
- open Draft PR to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`;
- do not mark Ready;
- do not merge.

Owner manual app verification: NOT STARTED / NOT AUTHORIZED until PM GitHub code-review PASS.
Merge permission: BLOCKED.
