# INCIDENT-RECOVERY-007E-LOCAL-RUNTIME-SOURCE-MISMATCH-006

Status: ACTIVE — READ-ONLY CAPTURE ONLY

Purpose:
Determine why running the app from `E:\Project AI\Video-sub-remove` shows a Settings UI different from the recently Owner-approved Task 034 UI.

Known GitHub truth before capture:
- canonical branch: `recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`
- canonical HEAD entering incident: `2d39a184d125a6df153d59863e484c6ad240c41c`
- approved Task 034 source: `ea9521f6fe957e24e49cc5d090e275511d91141d`
- canonical `src/renderer/index.html` blob equals approved Task 034 blob: `50a8c9dd66d9049fa53b6a1829dc9f484736d2d2`
- canonical `src/renderer/js/components/settings.js` blob equals approved Task 034 blob: `056c318724728f190de34e5d161edfe6b7642253`

This means GitHub canonical Settings UI source has not reverted from the Owner-approved Task 034 source. The unresolved question is which local source state is actually being launched.

## Hard rules
READ ONLY. No file edits, no checkout, no restore, no reset, no clean, no rebase, no commit, no push, no worktree removal, no npm start, no application launch, no localStorage edits, no dependency changes.

On any unexpected result or need for an unlisted command:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

## Exact target path
`E:\Project AI\Video-sub-remove`

## Authorized commands only
Run from the existing repository, then Set-Location to the exact target path when required:

1. `git fetch origin`
2. `Set-Location "E:\Project AI\Video-sub-remove"`
3. `$PWD.Path`
4. `git branch --show-current`
5. `git rev-parse HEAD`
6. `git rev-parse "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement"`
7. `git status --short`
8. `git status --branch --short`
9. `git worktree list --porcelain`
10. `git hash-object package.json`
11. `git hash-object src/renderer/index.html`
12. `git hash-object src/renderer/js/components/settings.js`
13. `git hash-object src/renderer/styles/main.css`
14. `git hash-object src/main/main.js`
15. `git rev-parse "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement:package.json"`
16. `git rev-parse "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement:src/renderer/index.html"`
17. `git rev-parse "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement:src/renderer/js/components/settings.js"`
18. `git rev-parse "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement:src/renderer/styles/main.css"`
19. `git rev-parse "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement:src/main/main.js"`
20. `git diff --name-status "origin/recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement" -- package.json src/renderer/index.html src/renderer/js/components/settings.js src/renderer/styles/main.css src/main/main.js`
21. `git diff --name-status`
22. `git diff --numstat`

Exact exit-code diagnostics `echo "Exit: $LASTEXITCODE"` or `Write-Output "Exit: $LASTEXITCODE"` are allowed only immediately after an approved command.

Decorative shell output commands are forbidden.

## Required classification
Return exactly one primary classification:
- `LOCAL_SOURCE_MISMATCH` — local UI/runtime files differ from canonical.
- `LOCAL_HEAD_MISMATCH` — local HEAD/branch is not canonical even if selected UI files currently match.
- `LOCAL_DIRTY_TREE` — uncommitted local edits affect or could affect runtime source.
- `MULTIPLE_WORKTREE_CONFUSION` — worktree layout shows a credible wrong-copy launch risk.
- `SOURCE_MATCHES_CANONICAL` — selected local runtime source exactly matches canonical; if so, do not repair. PM will separately investigate persisted UI state/provider-panel behavior.

Multiple secondary findings may be reported, but no repair is allowed in this task.

## Required final report
- Exact local path
- Current local branch
- Current local HEAD
- Remote canonical HEAD
- Local `git status --short`
- Worktree list summary
- Local vs canonical hashes for the five runtime files
- Runtime-file diff result
- Whole-tree status/diff summary
- Primary classification
- Files modified by this task: NONE
- Repair performed: NO
- App launched: NO
- STATUS: WAITING_PM_REVIEW
