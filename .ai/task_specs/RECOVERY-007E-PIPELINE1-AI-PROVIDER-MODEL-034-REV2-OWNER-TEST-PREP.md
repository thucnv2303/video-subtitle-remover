# PM Execution Spec

## Task
RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-OWNER-TEST-PREP

## Status
AUTHORIZED_FOR_EXECUTION

## Objective
Prepare a safe, exact Owner Manual Verification environment for `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` without modifying application source, tests, canonical task state, or the existing dirty/local working tree.

This task exists because Anti reported local context from `rescue/wip-20260803`, which is historical/stale for the active 034-REV2 review. Owner verification MUST NOT be performed from that historical branch.

## Reviewed GitHub basis
Repository:
`thucnv2303/video-subtitle-remover`

Active PR:
`#14`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

PR base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Reviewed source SHA to test:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

PM governance HEAD before this spec:
`7de83b3b3af29c68cf70e483bf67e8483169a22c`

Canonical active task:
`RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`

Canonical state:
`WAITING_OWNER_VERIFICATION`

Code Review:
`PASS`

Automated Verification:
`PASS`

Owner:
`WAITING`

Merge:
`BLOCKED`

## Finding
Anti reported:

- Current local branch: `rescue/wip-20260803`
- Current task: `INCIDENT-RECOVERY-007E-002`

This is NOT the current canonical 034-REV2 review context.

GitHub canonical state on PR #14 says:

- active task = `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- review branch = `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`
- source SHA = `ea9521f6fe957e24e49cc5d090e275511d91141d`
- status = `WAITING_OWNER_VERIFICATION`

The historical `rescue/wip-20260803` branch must not be used as the Owner-test runtime source.

## Allowed actions
Read-only repository inspection plus creation of ONE isolated local owner-test worktree outside the main working tree.

Allowed local test path:
`E:\Project AI\_owner_test\034-rev2`

Allowed commands/actions:

1. `git fetch origin`
2. Read `.ai/task_specs/ACTIVE.md` and this spec from the active review branch.
3. Verify remote PR/review branch ancestry and source SHA.
4. Inspect existing working-tree status read-only.
5. Create a detached clean worktree pinned to the exact reviewed source SHA:

   `git worktree add --detach "E:\Project AI\_owner_test\034-rev2" ea9521f6fe957e24e49cc5d090e275511d91141d`

6. In the isolated worktree verify:

   `git rev-parse HEAD`

   must equal:

   `ea9521f6fe957e24e49cc5d090e275511d91141d`

7. Verify tracked tree cleanliness with:

   `git status --short`

   No tracked modifications are allowed.

8. Prepare runtime dependencies WITHOUT installing packages:
   - If the isolated worktree can run using already available dependencies, use them.
   - If `E:\Project AI\Video-sub-remove\node_modules` exists but the isolated worktree lacks dependencies, a LOCAL-ONLY junction/symlink may be used to reuse that existing dependency directory.
   - Do not commit the junction/symlink.
   - Do not run `npm install`, `npm ci`, pip installs, package-manager updates, or dependency modifications.

9. Launch the application from the isolated worktree only if the exact source SHA and clean-tree checks pass.

## Forbidden actions

Do NOT:

- run Owner verification from `rescue/wip-20260803`;
- modify application source;
- modify tests;
- modify canonical `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`, QA, bugs, architecture, or API contracts in this prep task;
- edit this PM execution spec;
- edit `.ai/task_specs/ACTIVE.md`;
- checkout/switch/reset/restore/clean the existing main working tree;
- overwrite dirty work;
- use `git add .`;
- use `git add -A`;
- create a source commit;
- create a documentation commit;
- push implementation changes;
- merge PR #14;
- install or update dependencies;
- start Pipeline 2 intentionally as part of environment preparation.

## Owner verification checklist to present after successful prep

Owner must test 034-REV2 from the isolated runtime environment and report:

1. Saved provider/model restored — PASS/FAIL
2. Restart restores provider/model — PASS/FAIL
3. Settings change updates P1 defaults with no selected job — PASS/FAIL
4. Real `Thêm Video` captures current defaults — PASS/FAIL
5. Existing job remains unchanged after Settings change — PASS/FAIL
6. Provider switch selects correct model and persists A -> B -> A — PASS/FAIL
7. AI Rewrite uses selected job provider/model — PASS/FAIL
8. No unintended Pipeline 2 execution — PASS/FAIL
9. Observed errors — exact text/state or `none`

## Acceptance criteria

PASS only if all are true:

- Anti acknowledges the previously loaded `rescue/wip-20260803` context is historical/stale for 034-REV2.
- Main working tree is not switched/reset/restored/cleaned.
- An isolated worktree is created at the allowed path, or an already-existing exact clean worktree at that path is verified.
- Isolated worktree HEAD is exactly `ea9521f6fe957e24e49cc5d090e275511d91141d`.
- No tracked modifications exist in the isolated worktree before Owner testing.
- No dependencies are installed or updated.
- The application launches from the isolated worktree, OR Anti reports a concrete environment blocker without altering source/dependencies.
- Owner is given the exact 034-REV2 checklist above.
- No source/docs commit or push is created by this prep task.

## Stop conditions

`STOP — WRONG SOURCE SHA`
if the isolated worktree cannot be pinned to `ea9521f6fe957e24e49cc5d090e275511d91141d`.

`STOP — OWNER TEST ENV BLOCKED`
if the app cannot launch without installing/changing dependencies.

`STOP — EXISTING TEST WORKTREE CONFLICT`
if `E:\Project AI\_owner_test\034-rev2` already exists but is not safely verifiable as the exact reviewed source.

`STOP — MAIN TREE SAFETY RISK`
if preparation would require checkout/reset/restore/clean or overwriting the existing working tree.

`STOP — SPEC CONFLICT`
if current GitHub canonical state has moved to a different source task or code SHA.

## Required final report

Return exactly:

- Active GitHub task
- PR #14 current head
- Reviewed source SHA
- Main local branch observed
- Main tree touched: YES/NO
- Isolated owner-test path
- Isolated HEAD
- Isolated `git status --short`
- Dependency reuse method, if any
- Dependency install performed: YES/NO
- App launch: PASS/FAIL/BLOCKED
- Exact launch command
- Any launch error
- Owner checklist presented: YES/NO
- Source files changed: NONE or exact list
- Commits created: NONE
- Push performed: NO
- Merge: BLOCKED

## Merge permission
BLOCKED.

This task only prepares valid Owner verification. It does not authorize merge or task closeout.
