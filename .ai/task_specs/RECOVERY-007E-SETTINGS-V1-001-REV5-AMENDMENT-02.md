# RECOVERY-007E-SETTINGS-V1-001-REV5 — PM Amendment 02

Date: 2026-08-09
Status: ACTIVE

## Review basis
The second local REV5 attempt started from PM authority `41b7d11e0eb80621bc51f11c3d832bb901b2b353` and used the Amendment 01 unified-diff exception.

GitHub verification confirms the remote branch remained unchanged at that authority state: no source commit, no docs commit, no push, and no Draft PR.

The second local attempt is INVALIDATED for execution-control and verification reasons:
1. The final mandatory DOM uniqueness verification failed: required IDs including `tts-status-chip`, `backend-status-chip`, `gpu-status-chip`, and `btn-refresh-diagnostics` were absent from the candidate worktree.
2. The transcript used `git reset --hard`, `git clean -fd`, `git restore .`, and `git add .` while constructing scratch Git repositories. These commands are explicitly forbidden by the active REV5 hard controls; the prohibition is not limited to the product worktree.
3. The transcript ran `npm run test || echo "NONE FOUND"`. Canonical `package.json` has no `test` script. The npm command therefore necessarily produces an npm error and the shell fallback masks that failure, contrary to the rule that any required warning/error/failure must STOP rather than be bypassed.
4. Candidate implementation input was copied from an existing scratch path (`C:\Users\thucn\.gemini\antigravity\scratch\rev5\...`). The provenance of that scratch implementation is not accepted as fresh REV5 source authority.

## Invalidated local artifacts
Do not reuse, modify, clean, restore, or mine implementation source from:
- `E:\Project AI\Video-sub-remove-clean-3`
- `E:\Project AI\Video-sub-remove-clean-5`
- `C:\Users\thucn\.gemini\antigravity\scratch\rev5\`
- `C:\Users\thucn\.gemini\antigravity\scratch\rev5_clean\`
- any patch/candidate/source copy created by either failed REV5 attempt.

These may be preserved for forensic reference only. They are not implementation input.

## Retry authority
The remote REV5 task remains valid because GitHub source was not modified by either failed local attempt.

Retry must begin from a NEW isolated clean worktree created from the CURRENT remote REV5 head after reading the base spec, Amendment 01, Amendment 02, and ACTIVE.md.

All original REV5 functional requirements remain unchanged.

## Fresh candidate rule
If a unified-diff workflow is used for this retry:
- create a NEW candidate workspace outside the repository;
- copy baseline source only from the NEW clean worktree created from the current remote REV5 head;
- do not copy candidate/source content from any previous scratch/worktree/patch;
- do not initialize a Git repository in the candidate workspace;
- do not run reset, clean, restore, checkout, broad staging, or history-rewrite commands there;
- edit only fresh candidate copies using the normal editor;
- a patch may be manually authored or generated with a read-only diff operation from fresh baseline/candidate copies;
- patch file must remain outside the repository;
- inspect the complete patch before application;
- `git apply --check` must exit 0 before one `git apply` attempt;
- immediately run `git diff --check`, stat, numstat, full diff, and the required functional/static checks.

No Python/Node.js/PowerShell/sed/perl rewrite or string-replacement scripts are authorized.

## Test-discovery rule
Canonical `package.json` contains no `test` script.

Therefore:
- do NOT run `npm test` or `npm run test` merely to prove tests are absent;
- inspect `package.json` read-only;
- if no Settings test command/file is found, record `Applicable Settings tests: NONE FOUND` without executing a nonexistent script;
- never use `||`, `; echo`, or another shell fallback to convert a failing command into a PASS/`NONE FOUND` result.

## Hard STOP
After any failed required check or any warning/error from a required verification command:
- STOP immediately;
- leave the task worktree untouched;
- do not edit again;
- do not checkout/restore/reset/clean/revert;
- do not commit or push;
- report exact evidence.

Forbidden throughout this retry:
- reuse of invalidated implementation artifacts;
- `git checkout <path>`;
- `git restore`;
- `git reset`;
- `git clean`;
- rebase/amend/force push/history rewrite;
- `git add .` / `git add -A`;
- hook bypass / `--no-verify`;
- line-ending normalization/conversion;
- source rewrite scripts or patch-helper scripts.

## Required source checks
All base REV5 checks remain required, including:
- JS syntax checks;
- clean `git diff --check`;
- narrow stat/numstat/full diff;
- exactly five Settings product sections;
- every required hard-gate DOM ID exactly once;
- Gemini/DeepSeek/Ollama visibility and provider isolation scenarios;
- `ai_model_<provider>` load/save including blank clearing;
- one-time legacy cloud-key migration with no resurrection on switches;
- saving provider A must not mutate provider B;
- no normal write to legacy `ai_api_key`;
- no dead Pipeline 1 keys or `ai_endpoint_deepseek`;
- diagnostics only through the approved `window.api` methods;
- no direct diagnostics fetch;
- CPU-only remains valid non-error;
- TTS/voice-clone and P1/P2/P3 boundaries preserved.

## Publication
Only after every required source gate passes:
- exact approved source staging only;
- normal-hook source commit;
- minimally update exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` together in a separate docs commit;
- fetch origin and require the remote branch has not moved from the retry startup basis;
- fast-forward push only to `review/RECOVERY-007E-SETTINGS-V1-001-REV5`;
- open a NEW Draft PR to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`;
- do not mark Ready;
- do not merge.

Owner manual app verification remains NOT STARTED and NOT AUTHORIZED until PM GitHub code-review PASS.
Merge permission remains BLOCKED.
