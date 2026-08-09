# RECOVERY-007E-SETTINGS-V1-001-REV6 — PM Amendment 01

Date: 2026-08-09
Status: ACTIVE

## Review of first REV6 local attempt
The first local REV6 attempt is INVALIDATED.

Verified facts:
- Startup authority was `ed4c80e8ad8106dc8f2430c2f7f575bfc8d5467c`.
- The executor edited `src/renderer/index.html`, then ran forbidden `git checkout cf20a02f1e7491fddf7f05dab98fae12050460bb -- src/renderer/index.html` before continuing.
- The executor later rewrote `index.html` and `settings.js` and reached the required verification gate.
- `git diff --check` emitted trailing-whitespace errors and exited nonzero.
- The executor then STOPPED and reported the failure without committing or pushing.
- GitHub verification confirms remote REV6 remained unchanged at `ed4c80e8ad8106dc8f2430c2f7f575bfc8d5467c`; no REV6 Draft PR exists.

Decision:
- local worktree `E:\Project AI\Video-sub-remove-clean-REV6` is invalidated and must remain preserved/untouched;
- do not reuse or mine source/candidate text from that worktree;
- remote REV6 task remains valid because no failed implementation reached GitHub.

## Why the retry method changes
Repeated normal-editor whole-file writes have produced CRLF/EOL/whitespace churn. The next retry must avoid direct editing of the task worktree and must prove that the candidate diff is narrow before touching tracked source.

## Authorized fresh-candidate workflow
Use a NEW isolated clean task worktree from the CURRENT remote REV6 HEAD.

Before editing, record read-only EOL state:
- `git ls-files --eol src/renderer/index.html src/renderer/js/components/settings.js`
- `git hash-object src/renderer/index.html`
- `git hash-object src/renderer/js/components/settings.js`

The hashes must match the canonical source blobs recorded by GitHub for the canonical source basis. If not, STOP.

Create a NEW candidate directory outside the repository containing only fresh copies of:
- `src/renderer/index.html`
- `src/renderer/js/components/settings.js`

Also create a separate baseline-copy directory outside the repository containing the same two files copied from the NEW clean task worktree before any editing.

Rules:
- no previous scratch/candidate/patch may be read or reused;
- do not initialize Git in either external directory;
- edit candidate copies only; do not edit tracked source directly;
- no Python/Node/PowerShell/sed/perl source rewrite or string-replacement scripts;
- normal editor only for candidate text changes;
- do not rewrite files merely to normalize formatting or line endings.

## Candidate diff preflight
Generate a standard unified diff outside the repository using `git diff --no-index --ignore-space-at-eol` between the fresh baseline-copy directory and fresh candidate directory.

Important exception: for this exact `git diff --no-index` patch-generation command only, exit code 1 is EXPECTED when differences exist and is not a failed gate. Do not hide or rewrite the exit code with shell fallbacks. Any diagnostic/error other than normal diff content, or any exit code other than 0/1, requires STOP.

Before applying anything to the task worktree, inspect:
- complete patch text;
- patch stat/numstat or equivalent read-only diff summary;
- candidate whitespace errors using a read-only diff check.

Candidate scope gate:
- only the two approved source files may appear;
- no full-file replacement or EOL-only churn;
- `index.html`: total additions + deletions must be <= 160;
- `settings.js`: total additions + deletions must be <= 220;
- if either threshold is exceeded, STOP for PM review before applying the patch.

## Authorized patch application
The patch file must remain outside the repository.

The only whitespace-tolerant application exception authorized is `--ignore-space-change`, solely to match CRLF/LF differences in unchanged context. `--ignore-whitespace`, `--whitespace=nowarn`, and whitespace suppression/bypass are NOT authorized.

First run an apply check equivalent to:
`git apply --check -p1 --ignore-space-change --whitespace=error-all <PATCH_PATH>`

Requirements:
- exit code 0;
- no warning/error output.

Only then apply exactly once with the same safety options, without `--check`.

Immediately after application run, in this order:
1. `git diff --check` — must exit 0 with no output.
2. `git ls-files --eol src/renderer/index.html src/renderer/js/components/settings.js` — working-tree EOL classification for each file must match its recorded pre-edit classification; any new `mixed` classification is a hard STOP.
3. `git diff --stat`
4. `git diff --numstat`
5. inspect the complete task-worktree diff.

If any post-apply gate fails, STOP immediately and leave the task worktree untouched. No self-repair, checkout, restore, reset, clean, or second patch application.

## Functional acceptance
All original REV6 requirements remain authoritative, including:
- exactly five top-level Settings `.settings-card` sections;
- every hard-gate DOM ID exactly once;
- Gemini/DeepSeek/Ollama visibility behavior;
- `ai_api_keys_<provider>` API-key authority;
- `ai_model_<provider>` model authority including blank clearing;
- provider isolation;
- conditional one-time legacy `ai_api_key` migration only for the initially persisted cloud provider when its own key list is missing/empty;
- no legacy resurrection on switching;
- no normal global `ai_api_key` write;
- no global `ai_model` authority;
- no dead Pipeline 1 keys and no `ai_endpoint_deepseek`;
- diagnostics only via the approved `window.api` methods;
- no Settings diagnostic `fetch`;
- CPU-only valid/non-error;
- TTS/voice-clone and P1/P2/P3 boundaries preserved.

## Existing hard controls remain
Still forbidden throughout the retry:
- `git checkout <path>`
- `git restore`
- `git reset`
- `git clean`
- rebase/amend/force push/history rewrite
- `git add .`
- `git add -A`
- hook bypass / `--no-verify`
- shell fallbacks that mask failures
- invalidated implementation reuse
- source rewrite scripts
- line-ending normalization/conversion

## Verification and publication
After the patch-level gates pass, complete every original REV6 verification item before commit.

Only if all source gates PASS:
- stage exact approved source paths only;
- inspect cached names and full cached diff;
- create a source commit with normal hooks;
- minimally update exactly `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` in a separate docs commit;
- fetch origin and require the remote REV6 branch still equals the retry startup authority;
- fast-forward push only;
- open a NEW Draft PR to `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`;
- do not mark Ready;
- do not merge.

Owner app verification remains NOT STARTED and NOT AUTHORIZED until PM GitHub code-review PASS.
Merge permission remains BLOCKED.
