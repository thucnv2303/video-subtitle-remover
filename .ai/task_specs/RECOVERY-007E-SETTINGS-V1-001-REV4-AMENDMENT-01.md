# RECOVERY-007E-SETTINGS-V1-001-REV4 — PM Amendment 01

Date: 2026-08-09
Status: ACTIVE

## Reason
The executor reported that the normal editor's fuzzy replacement repeatedly damaged nearby repetitive HTML structure while attempting the PM-requested revision on PR #35. The executor stopped and kept remote PR #35 unchanged at `25acd4a6c259fe75cebf104b294e93c6b7cac6c4`.

This amendment does NOT relax the ban on source rewrite scripts. It authorizes one deterministic patch-application mechanism so the revision can proceed without fuzzy editor matching.

## Existing review authority
- Repository: `thucnv2303/video-subtitle-remover`
- Draft PR: `#35`
- Review branch: `review/RECOVERY-007E-SETTINGS-V1-001-REV4`
- Canonical base: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Canonical source basis: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Pre-amendment PR head: `25acd4a6c259fe75cebf104b294e93c6b7cac6c4`

## PM review blockers still required
1. Implement provider model authority `ai_model_<provider>` for Gemini, DeepSeek, and Ollama.
2. Remove unused parallel state `p1_default_ai_model` and `p1_default_tts_voice`; Pipeline 1 Defaults must expose only existing app contracts.
3. Remove `ai_endpoint_deepseek`; `ai_endpoint` remains the Ollama endpoint authority for this task.
4. Preserve provider-specific key isolation and one-time legacy-key migration semantics.
5. Preserve the good REV4 structure: exactly five Settings sections, unique hard-gate DOM IDs, renderer-API-only diagnostics, CPU-only valid non-error state, existing TTS/voice-clone contracts, and Pipeline boundaries.

## One-time editing-method exception
The following method is AUTHORIZED for this revision only:

- create or prepare a standard unified diff OUTSIDE the repository worktree, or feed it directly through stdin;
- the patch may modify only:
  - `src/renderer/index.html`
  - `src/renderer/js/components/settings.js`
  - `src/renderer/styles/main.css` only if a narrow layout fix is genuinely required;
- inspect the complete unified diff before applying it;
- run `git apply --check <PATCH>` first;
- only if `git apply --check` exits 0, run `git apply <PATCH>` once;
- immediately inspect `git diff --check`, `git diff --stat`, `git diff --numstat`, and the full source diff;
- if application creates unexpected changes, broad churn, EOL conversion, unrelated edits, or any failed required command: STOP. Do not repair, retry, normalize, or generate a second patch in the same execution.

A patch file, if used, MUST remain outside the repository and MUST NOT be staged or committed.

## Still forbidden
- Python/Node.js/PowerShell/sed/perl source rewrite or string-replacement scripts;
- generated `patch.py`, `patch.js`, `.ps1`, or equivalent source-rewrite helpers;
- whole-file replacement scripts;
- line-ending normalization or deliberately mixed EOL manipulation;
- `git reset --hard`, `git clean`, rebase, amend, force push, history rewrite;
- `git add .`, `git add -A`;
- hook bypass / `--no-verify`;
- reuse of local commits `2ead767` or `a126aa9` from the stopped retry;
- reuse of any REV3/REV2 invalidated implementation source.

## Dirty-worktree rule for the stopped local retry
The executor reported local uncommitted edits to the three dynamic `.ai` files. Do not destroy or overwrite that dirty worktree to continue this revision.

Use a new isolated clean git worktree from the CURRENT remote REV4 head. The existing dirty worktree must remain preserved and untouched.

The clean worktree may be detached at `origin/review/RECOVERY-007E-SETTINGS-V1-001-REV4`; commits from that worktree may be pushed as a fast-forward update to the same remote review branch only after all gates pass.

## Revision verification
Before source commit, rerun all original REV4 gates plus:
- `ai_model_gemini` load/save path present;
- `ai_model_deepseek` load/save path present;
- `ai_model_ollama` load/save path present;
- no persisted `p1_default_ai_model`;
- no persisted `p1_default_tts_voice`;
- no `ai_endpoint_deepseek`;
- no normal-save write to legacy `ai_api_key`;
- no direct diagnostic `fetch()` fallback;
- CPU-only state visibly non-error;
- hard-gate DOM IDs each occur exactly once.

## Commit / publication
- Source revision commit: exact approved source files only.
- Documentation revision commit after source success: exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` together.
- Fast-forward push only to `review/RECOVERY-007E-SETTINGS-V1-001-REV4`.
- Update existing Draft PR #35; do not open a new PR.
- Do not mark Ready.
- Do not merge.
- Owner test remains NOT STARTED until PM GitHub code-review PASS.

## STOP condition
Any failed required command, patch-check failure, patch-application mismatch, remote-head movement after startup, unexpected source file, EOL churn, or non-fast-forward push condition => STOP and report. No self-repair.
