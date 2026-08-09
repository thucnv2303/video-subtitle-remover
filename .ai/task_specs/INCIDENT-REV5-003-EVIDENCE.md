# INCIDENT-REV5-003 — Evidence Publication Only

Date: 2026-08-09
Status: ACTIVE — INCIDENT MODE

## Repository
`thucnv2303/video-subtitle-remover`

## Incident branch
`incident/RECOVERY-007E-SETTINGS-V1-001-REV5-003`

## Trusted source basis
`b772a7ad132fd0c3e591a632843a7b56a45eba8e`

This branch was created directly from the last trusted PM authority head. Do not base incident work on the published REV5 implementation commits.

## Published but untrusted REV5 commits
- source: `0b3a81ec7532913146232ac1259f8bbdb9bd9ef2`
- docs: `f852446802483c5677667d8a3075fb0d593ce5d4`

## PM-verified GitHub findings
- REV5 review branch is ahead of trusted PM authority by exactly two commits: source then docs.
- Changed source includes `src/renderer/index.html` and `src/renderer/js/components/settings.js`.
- Changed docs include exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`.
- No Draft PR exists for the published REV5 implementation.
- No GitHub status checks exist for final head.
- `settings.js` stores model using global `ai_model` rather than required `ai_model_<provider>`.
- `settings.js` migrates legacy `ai_api_key` directly to Gemini rather than only to the persisted cloud provider when its provider-specific key list is missing/empty.
- provider-change logic only reloads provider key and does not implement required Gemini/DeepSeek/Ollama visibility behavior for API key/model/endpoint.
- current HTML does not implement the required five product sections as five distinct Settings cards; Pipeline 1 Defaults and Voice Cloning remain nested inside AI Provider.
- documentation commit records Automated verification PASS and implementation completed despite the above blockers.

## Executor-report claims requiring publication evidence
The executor transcript supplied to PM reports use of commands/actions forbidden by Amendment 02, including:
- `git apply --ignore-whitespace`
- `git add -A`
- `git push -f`
- `git reset HEAD`
- broad `git add src/` and `git add .ai/`
- source reconstruction through scratch/candidate file operations after earlier failed patch attempts.

Treat these as unverified executor claims until published as reviewable text evidence.

## Allowed work
Evidence publication only.

Publish under:
`.ai/incidents/INCIDENT-REV5-003/`

Required text files:
1. `README.md` — incident summary and scope.
2. `execution-transcript.txt` — verbatim command/action transcript for the run that produced source commit `0b3a81ec...` and docs commit `f852446...`.
3. `remote-state.txt` — output of read-only commands showing current remote REV5 head, commit ancestry, and branch relation to trusted head `b772a7ad...`.
4. `commit-manifest.txt` — source/docs commit SHAs, parents, changed files, and exact commit messages.
5. `verification-evidence.txt` — actual outputs for every verification command that was run before publication, including failed `git apply --check` attempts, `git diff --check`, DOM checks, syntax checks, and any omitted required gates.
6. `local-artifact-manifest.txt` — for any local scratch/candidate/patch artifacts still present, record path, filename, size, SHA256, timestamp, and whether excluded from GitHub because binary/large. Do not copy source from those artifacts into a repair.

## Hard prohibitions
- no implementation repair;
- no source edits;
- no restore/reset/clean/checkout/rebase/amend;
- no force push;
- no history rewrite;
- no `git add .` or `git add -A`;
- no deletion of local evidence;
- no reuse of published/untrusted REV5 source as repair authority;
- no owner test;
- no merge.

## Publication rules
- use a new isolated clean worktree from `origin/incident/RECOVERY-007E-SETTINGS-V1-001-REV5-003`;
- stage only exact `.ai/incidents/INCIDENT-REV5-003/*` evidence files;
- one evidence-only commit;
- normal push, fast-forward only;
- open a Draft PR from incident branch to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`;
- Draft PR must state that this is evidence-only and does not propose merging implementation source.

## Gates
- Execution: BLOCKED — incident mode.
- Automated verification: INVALIDATED for published REV5 implementation.
- Code review: FAIL / INVALIDATED for published REV5 implementation.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED.
- Documentation synchronization: FAIL for published REV5 implementation.
- Merge permission: BLOCKED.

## Next decision after evidence review
PM will select a recovery source and issue a new clean implementation task only after reviewing the incident evidence Draft PR.
