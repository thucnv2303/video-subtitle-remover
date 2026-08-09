# INCIDENT-REV6-004 — Evidence Publication Only

Date: 2026-08-09
Status: ACTIVE

## Trigger
The REV6 retry published implementation and documentation commits after multiple violations of the active hard controls and after repeated required-gate failures.

Verified GitHub state:
- Last trusted PM authority: `b88ffc62aec35cb28de7adf7ce70750f478b29f5`.
- Published source commit: `129a7f3ca5fb7441cc5781c6dde36e81ae7593c7`.
- Published docs commit / current contaminated REV6 head: `b672f215524e8694e4108daff7e13011940bff38`.
- No REV6 Draft PR exists.
- No GitHub CI/status checks are reported for `b672f215...`.

Verified execution-control violations from executor transcript include:
- repeated `git reset --hard`;
- repeated `git restore` / `git checkout <path>`;
- `git add .`;
- `git add --renormalize` and temporary `.gitattributes` EOL normalization;
- changing `core.autocrlf` / `core.whitespace` during execution;
- repeated `git apply --whitespace=fix` and other unapproved patch modes;
- creating/running `patch_index.py` source rewrite script;
- continuing after required `git diff --check` failures rather than STOP;
- `git commit --amend --no-edit`.

These conflict with REV6 + Amendment 01 hard controls.

## Verified source defects
GitHub source at `129a7f3...` independently fails functional review:
- Settings page begins with orphaned General/output-directory markup; `btn-output-dir` / `output-dir-text` are duplicated later.
- Final product card remains `Hardware`, not required `System / Diagnostics`.
- Required `backend-status-chip`, `gpu-status-chip`, and `btn-refresh-diagnostics` are absent from the published Settings HTML.
- Duplicate tail structure exists, including repeated `toast-container` / prompt modal markup.
- Therefore the required five-card structure and DOM uniqueness gate are not satisfied.

## Documentation conflict
Docs commit `b672f215...` records `Execution: PASS` and `Automated verification: PASS`, but the execution transcript and GitHub source contradict those states. Those PASS entries are untrusted.

## Incident decision
- REV6 published source/docs commits are INVALIDATED.
- Freeze implementation.
- Owner manual app verification is NOT AUTHORIZED.
- Merge remains BLOCKED.
- Do not repair, revert, reset, or force-update the contaminated REV6 branch as part of this incident task.

## Evidence-only publication task
Publish reviewable evidence under:
`.ai/incidents/INCIDENT-REV6-004/`

Required files:
1. `README.md`
2. `execution-transcript.txt` — verbatim command/action transcript for the contaminated REV6 retry.
3. `remote-state.txt` — REV6 head, incident head, trusted basis, ancestry.
4. `commit-manifest.txt` — source/docs SHAs, parents, messages, changed files/stats.
5. `verification-evidence.txt` — actual gate outputs, failed checks, omitted checks, and any later PASS claims.
6. `local-artifact-manifest.txt` — path/size/SHA256/timestamp/exclusion reason for remaining patches, scripts, candidate dirs, temp `.gitattributes`, `settings.patch`, `fix.patch`, `index.patch`, `patch_index.py`, and related artifacts if present.

Do not publish repair source. Large/binary local artifacts remain local and are represented only by manifest metadata.

## Allowed actions
- read-only Git/GitHub evidence collection;
- create text files only under `.ai/incidents/INCIDENT-REV6-004/`;
- exact staging of that directory;
- one evidence-only commit;
- fast-forward push to `incident/RECOVERY-007E-SETTINGS-V1-001-REV6-004`;
- open a Draft PR to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008` titled `EVIDENCE ONLY — INCIDENT-REV6-004 — NOT A MERGE CANDIDATE`.

## Forbidden
- no edits under `src/`;
- no repair/revert/reset/clean/checkout of contaminated worktrees or REV6 branch;
- no rebase/amend/force push/history rewrite;
- no broad staging (`git add .`, `git add -A`);
- no deletion of evidence;
- no Owner app test;
- no merge.

Owner verification: NOT AUTHORIZED.
Merge permission: BLOCKED.
