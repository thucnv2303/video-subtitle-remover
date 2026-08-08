# RECOVERY-007E-SETTINGS-V1-001-REV3

## Objective
Implement Settings V1 cleanly from the post-governance canonical baseline, preserving Pipeline 1/2/3 boundaries and current working TTS/voice-clone behavior.

This REV3 supersedes all earlier Settings implementation attempts as execution authority.

## Canonical source basis
- Base branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Exact source basis SHA: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Owner runtime ancestor: `14807ee8f716a131a0565c0c77e5cb8f8e8cca29`
- Governance hook correction from PR #34 is already merged into the source basis.

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV3`

## Invalidated / forbidden recovery sources
Do not use as implementation input:
- PR #32 / original Settings V1 implementation;
- PR #33 / REV1 implementation;
- earlier REV2 local working tree changes;
- any stash made from REV2;
- commits `bd6730840cb609b4e0c3d47d78aee7ceee0637cd`, `8c2a90204a20718a577100df22f65cd5cb3695db`, `56159e667b34b2736b617bb6650941dd62cffabb`;
- scratch scripts, patches, backup copies, normalized files, copied hunks, or local forensic artifacts from invalidated attempts.

Earlier PRs may be read only as historical evidence of defects to avoid. They are not code authority.

## Allowed source scope
Only these files may be modified:
- `src/renderer/index.html`
- `src/renderer/styles/main.css`
- `src/renderer/js/components/settings.js`
- `src/renderer/js/api.js` only if a narrow wrapper around an already-existing endpoint is genuinely required

No other application source file is authorized.

## Forbidden source scope
Do not modify:
- `api/**`
- Pipeline 1 implementation files
- Pipeline 2 implementation files
- Pipeline 3 implementation files
- `src/renderer/js/app.js`
- Electron main/preload files
- package/dependency files
- tests/media fixtures outside an existing directly applicable Settings test
- scratch/patch/backup files

No backend endpoint additions are authorized.

## Required Settings sections
The Settings page must expose these five sections without replacing unrelated application UI:
1. General
2. AI Provider
3. Pipeline 1 Defaults
4. Voice Cloning
5. System / Diagnostics

Keep existing application visual language. Do not introduce a new design system.

## General section
Use the existing output-directory picker contract only.

Requirements:
- current directory remains visible;
- long path is truncation-safe / narrow-window safe;
- choose-directory button remains usable;
- no horizontal page overflow caused by the path row.

Use targeted layout/CSS such as `min-width: 0`, bounded flexible text, and ellipsis/wrapping where appropriate. Do not broadly restyle unrelated rows.

## AI Provider section
Supported providers:
- Gemini
- DeepSeek
- Ollama

Canonical persistence keys:
- selected provider: `ai_provider`
- provider API keys: `ai_api_keys_<provider>`
- provider model: `ai_model_<provider>`
- Ollama endpoint: `ai_endpoint`
- prompt: `ai_prompt`

Do not introduce persisted `ai_cloud_model`, `ai_ollama_model`, or another parallel model authority.
DOM element IDs may contain descriptive cloud/ollama names; the prohibition applies to persistence/state authority.

### Provider-key isolation
`ai_api_keys_<provider>` is authoritative for cloud-provider key storage.

Legacy `ai_api_key` compatibility is allowed only as a narrow migration path:
- during initial load, determine the currently persisted `ai_provider` first;
- if that current provider is Gemini or DeepSeek and its provider-specific key list is absent/empty, legacy `ai_api_key` may populate/migrate only that same current provider;
- switching to another cloud provider whose `ai_api_keys_<provider>` is absent/empty must show an empty API-key field;
- never display another provider's legacy/global key when switching providers;
- saving provider A must not mutate provider B's key/model values.

Ollama:
- no API key field is required/authoritative;
- endpoint uses `ai_endpoint`;
- model uses `ai_model_ollama` through the generic `ai_model_<provider>` contract.

## Pipeline 1 Defaults section
Expose Settings controls only for existing defaults/contracts already used by the application.
Do not change Pipeline 1 execution architecture, routes, ASR/OCR behavior, subtitle-removal behavior, rendering, or finalization.

Settings must not cause Pipeline 1 to invoke Pipeline 2 or Pipeline 3 responsibilities.

## Voice Cloning section
Preserve existing working TTS and voice-clone contracts.
Do not refactor voice cloning, TTS generation, audio mixing, or existing renderer/backend APIs.
Settings may present/configure existing controls only.

## System / Diagnostics section
Use only real existing renderer API calls:
- `window.api.health()`
- `window.api.gpuInfo()`
- `window.api.getTTSStatus()`

Do not add fake health checks or backend routes.

Required interpretation:
- Backend diagnostic uses its own response semantics.
- GPU diagnostic specifically uses `gpu_available`, `gpu_name`, and `cuda_version`.
- `gpu_available === false` is a valid CPU-only state, not a failed backend call.
- TTS diagnostic uses its own response/status shape.
- do not use one generic success predicate across incompatible payloads.

Each diagnostic needs explicit loading, success/valid-state, and error display contained inside Settings.

## UI preservation
Preserve existing IDs/functions/contracts used by active renderer code.
Do not rename unrelated controls.
Do not delete working voice/TTS controls.
Do not alter app navigation outside the minimum Settings integration already present.

## Editing safety
Edits must be targeted.

Forbidden:
- whole-file rewrite scripts;
- broad Python/PowerShell/sed/perl replacement scripts;
- line-ending conversion/normalization;
- broad trailing-whitespace cleanup;
- formatting unrelated regions;
- copying a full invalidated source file over the canonical file.

If normal editor changes produce a diff suggesting whole-file CRLF/LF churn or broad whitespace changes, STOP. Do not attempt to repair the diff with a normalization script.

## Required static verification before source commit
Run exactly applicable checks:
1. `node --check src/renderer/js/components/settings.js`
2. `node --check src/renderer/js/api.js` only if `api.js` changed
3. existing renderer/settings-specific automated tests if present; if none are present, report `NONE FOUND`
4. `git diff --check`
5. targeted search/inspection confirming model persistence uses `ai_model_<provider>` and no new persisted `ai_cloud_model` / parallel authority was introduced
6. inspect `git diff --stat`
7. inspect `git diff --numstat`
8. inspect full diff for each changed source file

Hard churn gate:
- if a small Settings change appears as broad/full-file line replacement, CRLF/LF conversion, or unrelated whitespace cleanup: STOP and report; do not self-repair with scripts.

## Source commit gate
Stage only exact changed source files by explicit path.
Do not stage `.ai` files with source.

Before commit:
- `git diff --cached --name-only`
- `git diff --cached`

Commit normally with hooks enabled.
The adopted pre-commit hook should allow source-only commits.

If hook or commit fails unexpectedly:
- STOP immediately;
- do not retry with bypass flags;
- do not modify the hook;
- do not self-repair outside this spec.

## Executor runtime verification
A GUI/Electron Settings smoke by the executor is OPTIONAL in REV3 because executor environments may not provide a reliable interactive GUI.

If a real GUI is available without unsafe/destructive setup, Anti may record a Settings-only smoke result.
If GUI is unavailable, report `EXECUTOR GUI: NOT AVAILABLE` and continue publication after static gates PASS.

Do not fabricate visual verification.
Do not install remote-control, display, browser, or GUI dependencies for this task.

Owner real-app verification remains mandatory later and is separate from executor verification.

## Canonical documentation update
After successful source commit, update exactly these dynamic files with minimal targeted edits:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

They must agree on:
- task ID `RECOVERY-007E-SETTINGS-V1-001-REV3`;
- exact source commit SHA;
- static verification results;
- executor GUI result (`PASS` if actually run, otherwise `NOT AVAILABLE`);
- code review `WAITING`;
- Owner app verification `NOT STARTED — WAITING FOR PM CODE REVIEW`;
- documentation synchronization status;
- merge `BLOCKED`.

Preserve useful historical context. Do not replace the files with shortened whole-document summaries.

Stage all three dynamic docs together by exact path. The adopted hook requires the three to remain synchronized.
Inspect staged filenames and staged diff before committing normally with hooks enabled.

## Pre-push hard gate
Compare against exact source basis `cf20a02f1e7491fddf7f05dab98fae12050460bb`.
Allowed diff only:
- PM task-spec changes already present on REV3 branch;
- approved Settings source files actually changed;
- the three dynamic `.ai` files.

Must satisfy:
- forbidden application files: NONE;
- scratch/patch/backup/test-media: NONE;
- secrets: NONE;
- required static verification: PASS;
- no broad EOL/format churn;
- source and docs commits separated;
- canonical dynamic docs agree;
- Owner test remains NOT STARTED.

Failure => `STOP — PUSH NOT AUTHORIZED`.

## Publication
Push only:
`review/RECOVERY-007E-SETTINGS-V1-001-REV3`

Open Draft PR with:
- head: `review/RECOVERY-007E-SETTINGS-V1-001-REV3`
- base: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Do not target `main` or `dev`.
Do not mark ready for review.
Do not merge.

## Owner-test gate
Owner test is NOT authorized until PM reviews the GitHub source diff and returns code-review PASS.

After PM code-review PASS, Owner will test the real app and report observations directly.
Only after Owner PASS may Anti record that result in canonical `.ai` files through a documentation-only commit.

## Hard execution controls
Never:
- `git reset --hard`
- `git clean`
- destructive restore/checkout
- force push
- rebase/amend/history rewrite
- `git add .`
- `git add -A`
- `git commit --no-verify`
- `HUSKY=0` or equivalent hook bypass
- stash apply/pop from previous Settings attempts
- whole-file rewrite scripts
- line-ending normalization
- continue after first unexpected required-command/hook/gate failure

## Final executor report
Return only:

STATUS: IMPLEMENTATION_COMPLETE / WAITING_EVIDENCE / BLOCKED / IMPLEMENTATION_FAILED
Repository:
Branch:
Execution-spec remote HEAD:
Source-basis SHA:
Source commit SHA:
Docs commit SHA:
HEAD SHA:
Draft PR URL:
Draft PR base:
Changed source files:
Changed knowledge files:
Diff stat:
Verification commands/results:
Existing renderer/settings tests: PASS / NONE FOUND / NOT APPLICABLE
Executor GUI verification: PASS / NOT AVAILABLE / FAILED
Known gaps:
Owner test: NOT STARTED
Merge: BLOCKED
NEXT ACTION: WAIT_FOR_CHATGPT_SUPERVISOR
