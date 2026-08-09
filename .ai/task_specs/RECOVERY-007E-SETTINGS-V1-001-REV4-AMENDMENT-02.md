# RECOVERY-007E-SETTINGS-V1-001-REV4 — PM Amendment 02

Date: 2026-08-09
Status: ACTIVE

## Review basis
Draft PR #35 was reviewed at head `ec63fc8b861cf37c7a8595c7a776a87010222e9f`.

Amendment 01 execution produced source commit `150ca386fe709ee089ec3439165bd275fadc8a4e` and docs commit `ec63fc8b861cf37c7a8595c7a776a87010222e9f`.

Code review remains NEEDS_REVISION.
Owner test remains NOT STARTED / NOT AUTHORIZED.
Merge remains BLOCKED.

## Required source corrections

### 1. Ollama model UI
For provider `ollama`:
- hide API-key input/group;
- keep `ai-model` input/group visible;
- load/store `ai_model_ollama` through the same `ai_model_<provider>` convention;
- keep `ai-endpoint` visible and backed by canonical `ai_endpoint`.

Do not use the API-key field as Ollama model authority.

### 2. One-time legacy key migration
Legacy `ai_api_key` may be considered only during the initial persisted cloud-provider load for this Settings session.

After the initial migration/load step:
- provider switching must use only `ai_api_keys_<provider>`;
- returning to the initial provider must not cause legacy `ai_api_key` to reappear if provider-specific storage is empty;
- normal save must not write or synchronize legacy `ai_api_key`.

Implement an explicit one-time migration/load path or consumed flag. Do not make general provider UI refresh call an unrestricted legacy fallback path.

### 3. Model clearing
Saving provider A must write the current `ai_model_A` value even when blank.

If the user clears the model and saves, stale model storage must not remain authoritative.

### 4. Preserve all previously accepted behavior
Keep:
- exactly five product Settings sections;
- unique hard-gate DOM IDs;
- no `p1_default_ai_model` or `p1_default_tts_voice` persistence;
- no `ai_endpoint_deepseek`;
- provider-specific API key isolation;
- diagnostics only via `window.api.health()`, `window.api.gpuInfo()`, `window.api.getTTSStatus()`;
- no direct diagnostic fetch fallback;
- CPU-only GPU state valid/non-error;
- existing TTS/voice-clone contracts and Pipeline boundaries.

## Documentation repair
The docs commit at `ec63fc8...` is NOT acceptable documentation synchronization.

Repair exactly:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

Requirements:
- preserve useful canonical history and prior governance/runtime facts from the pre-`ec63fc8` versions;
- restore the high-level REV3 INVALIDATED context;
- retain canonical baseline, task authority, review branch, and gate context;
- update source/docs SHAs only after source correction succeeds;
- record exact verification results;
- code review must remain WAITING until PM re-review;
- Owner test NOT STARTED — WAITING FOR PM CODE REVIEW;
- merge BLOCKED;
- remove all control-character corruption;
- do not use whole-file `Set-Content`, echo redirection, or equivalent destructive replacement of dynamic docs;
- use targeted editor changes or a PM-authorized unified diff workflow;
- preserve readable Markdown formatting and terminology.

## Editing-method authority
Amendment 01 deterministic patch exception remains active for source and documentation corrections:
- unified diff only;
- inspect complete patch;
- `git apply --check` before `git apply`;
- one application attempt per patch;
- patch file, if any, remains outside repository;
- no Python/Node.js/PowerShell/sed/perl rewrite/string-replacement scripts.

Do not use `Set-Content` to replace any canonical `.ai` file.

## Required verification before source commit
Run and record actual outputs:
1. `node --check src/renderer/js/components/settings.js`
2. applicable existing Settings tests, otherwise `NONE FOUND`
3. `git diff --check`
4. `git diff --stat`
5. `git diff --numstat`
6. inspect full source diff
7. verify no forbidden/generated/scratch files in repository
8. verify hard-gate DOM IDs exactly once
9. verify Ollama: API key hidden, model visible, endpoint visible
10. verify `ai_model_gemini`, `ai_model_deepseek`, `ai_model_ollama` load/save
11. verify blank model save clears/writes blank for current provider
12. verify initial persisted Gemini legacy migration once
13. verify initial persisted DeepSeek legacy migration once
14. verify switch to provider with no provider-specific key stays blank
15. verify switching away and back cannot resurrect legacy key
16. verify saving A does not mutate B
17. verify normal save does not write legacy `ai_api_key`
18. verify no `p1_default_ai_model`, `p1_default_tts_voice`, `ai_endpoint_deepseek`
19. verify no direct diagnostic `fetch()`
20. verify CPU-only is non-error.

Any failed required check => STOP. No self-repair or bypass.

## Commit and publication
- New source correction commit: approved source paths only, normal hooks.
- Then one documentation-repair commit containing exactly the three dynamic `.ai` files.
- Before push, fetch origin and verify remote branch has not moved from startup basis.
- Fast-forward push only to `review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
- Update existing Draft PR #35 only.
- Do not mark Ready.
- Do not merge.

## Final executor report
Return exact:
- startup remote HEAD;
- source correction SHA;
- docs repair SHA;
- final remote HEAD;
- exact changed files;
- diff stat/numstat;
- verbatim verification command results sufficient to substantiate each gate;
- executor GUI PASS or NOT AVAILABLE;
- Owner test NOT STARTED;
- merge BLOCKED;
- NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR.
