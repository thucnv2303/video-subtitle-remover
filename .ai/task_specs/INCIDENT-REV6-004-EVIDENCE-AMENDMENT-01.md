# INCIDENT-REV6-004 — Evidence Amendment 01

Date: 2026-08-09
Status: ACTIVE

## Purpose
This amendment is the authoritative correction scope after PM review of Draft PR #37 at evidence head `b669132740e7083f2e4fb6f9dcb02712a30c22c1`.

Do not repair product code. Do not touch `src/` or the contaminated REV6 branch.

## Required corrections
Only files under `.ai/incidents/INCIDENT-REV6-004/` may be updated.

### 1. execution-transcript.txt
Replace the current prose summary with a VERBATIM command/action transcript for the contaminated REV6 retry.

Include actual commands/actions in execution order, including where present:
- every `git diff --check` and `git diff --cached --check`;
- every `git reset --hard` and `git reset HEAD`;
- every `git restore`;
- every `git checkout <path>` / `git checkout HEAD ...`;
- every `git add .`, exact-path staging, and `git add --renormalize`;
- every `git rm --cached`;
- `.gitattributes` creation/removal;
- `git config core.autocrlf ...` and `git config core.whitespace ...`;
- every `git apply` / `git apply --check` and every `--whitespace=fix` use;
- patch generation/regeneration commands;
- `git stripspace`;
- creation and execution of `patch_index.py`;
- source commit command;
- `git commit --amend --no-edit`;
- docs commit command;
- push command.

Do not paraphrase shell commands. Do not use ambiguous wording such as "git clone or copied files". Editor/create-file actions must be recorded distinctly from shell commands.

### 2. verification-evidence.txt
Correct the EOL section. `git diff --cached --check` is a whitespace check, not an EOL-classification check.

If an actual EOL-classification command such as `git ls-files --eol` was run, include the verbatim command and output. Otherwise record:
`EOL classification check: NOT RUN`

Separate evidence into:
- ACTUAL COMMAND OUTPUT
- EXECUTOR SUMMARY/CLAIM
- PM INFERENCE

For each required REV6 / Amendment-01 gate, record `RUN / FAILED / PASSED / NOT RUN` truthfully, including:
- pre-edit EOL classification;
- pre-edit canonical blob/hash verification;
- candidate patch scope;
- patch-size thresholds;
- exact authorized `git apply --check ... --ignore-space-change --whitespace=error-all` gate;
- post-apply `git diff --check`;
- post-apply EOL classification;
- stat/numstat acceptance;
- complete diff inspection;
- exactly five top-level Settings cards;
- every required hard ID exactly once;
- Gemini visibility;
- DeepSeek visibility;
- Ollama visibility;
- provider-specific API-key isolation;
- provider-specific model isolation;
- blank-model clearing;
- legacy migration initial-load condition;
- no migration/resurrection on provider switching;
- no normal global `ai_api_key` writes;
- no global `ai_model` authority;
- forbidden/dead keys absent;
- diagnostics approved `window.api` methods only;
- no direct Settings diagnostics `fetch`;
- CPU-only neutral/non-error handling;
- TTS/voice-clone preservation;
- P1/P2/P3 boundary preservation;
- JS syntax check;
- applicable Settings test discovery/execution.

### 3. local-artifact-manifest.txt
If it still exists, add an explicit directory/worktree entry for:
`E:\Project AI\Video-sub-remove-clean-REV6-2`

Record path, type, timestamp if available, and exclusion reason. Existing file hashes must be preserved.

### 4. README.md
Adjust only if needed so it truthfully states:
- evidence correction only;
- no repair attempted;
- REV6 source/docs remain INVALIDATED;
- Owner test NOT AUTHORIZED;
- Merge BLOCKED.

## Publication controls
Before staging, record `git status --short`.

Stage only `.ai/incidents/INCIDENT-REV6-004/` with exact-path staging. `git add .` and `git add -A` are forbidden.

Inspect:
- `git diff --cached --name-only`
- full `git diff --cached`

Create one new evidence-correction commit. No amend, rebase, force push, reset, restore, checkout, or source edits.

Before push, fetch and verify the remote incident branch still equals the execution startup authority. Fast-forward push only to `incident/RECOVERY-007E-SETTINGS-V1-001-REV6-004`.

Keep PR #37 OPEN + DRAFT. Do not mark Ready and do not merge.

Owner manual app verification: NOT AUTHORIZED.
Merge permission: BLOCKED.
