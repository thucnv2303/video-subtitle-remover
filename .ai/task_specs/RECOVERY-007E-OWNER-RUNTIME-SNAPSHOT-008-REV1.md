# RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1

## Status
ACTIVE — OWNER-SELECTED RUNTIME SOURCE SNAPSHOT CONTINUATION

## Supersedes
`RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008` stopped correctly at its whitespace gate after staging the exact 21 approved source paths. The original task MUST NOT resume.

## Owner decision
The sole runtime selected for preservation and forward development remains exactly:
`E:\Project AI\Video-sub-remove`

This task preserves the exact current application-source bytes. Existing trailing whitespace is part of the selected baseline and MUST NOT be edited merely to satisfy a whitespace style gate.

## Authority
Repository: `thucnv2303/video-subtitle-remover`

Control branch:
`control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Expected local branch:
`rescue/wip-20260803`

Expected local HEAD before snapshot:
`d67a427f1c90a2e98da560977736ead80637db3a`

Expected upstream before snapshot:
`origin/rescue/wip-20260803` at `d67a427f1c90a2e98da560977736ead80637db3a`

Review branch to publish:
`review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`

Future Draft PR base:
`rescue/wip-20260803`

## Recovery basis
The stopped 008 execution reported:
- all syntax checks PASS;
- exact 21 allowlisted source paths staged;
- no source bytes edited;
- no excluded artifacts staged/deleted;
- no cleanup and no app launch;
- STOP occurred only because `git diff --cached --check` rejected pre-existing trailing whitespace in the selected Owner baseline.

REV1 does not accept those claims blindly. It re-verifies the current local HEAD, upstream, exact staged-path set, working-file hashes, and index blob hashes before permitting the snapshot commit.

## Hard boundary
Do NOT edit, normalize, trim, reformat, restore, reset, checkout, switch, clean, rebase, amend, delete, move, rename, or otherwise alter any existing file byte under `E:\Project AI\Video-sub-remove`.

Do NOT unstage the current exact source snapshot merely because 008 stopped.

No cleanup, archive, app launch, dependency change, documentation edit in the Owner runtime, 036-A/B/C/D work, force push, or push to `origin/rescue/wip-20260803` is authorized.

On first failure, mismatch, unexpected path, changed working byte, changed index byte, moved upstream, or remote review branch pre-existence:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR`

## Exact source allowlist
Exactly these 21 paths must be staged and committed, no others:

1. `api/server.py`
2. `src/main/main.js`
3. `src/main/preload.js`
4. `src/renderer/index.html`
5. `src/renderer/js/api.js`
6. `src/renderer/js/app.js`
7. `src/renderer/styles/main.css`
8. `src/renderer/js/components/job-manager.js`
9. `src/renderer/js/components/prompt-manager.js`
10. `src/renderer/js/components/settings.js`
11. `src/renderer/js/components/video-preview.js`
12. `src/renderer/js/pipeline.js`
13. `src/renderer/js/pipelines/pipeline1-ai.js`
14. `src/renderer/js/pipelines/pipeline2-remove.js`
15. `src/renderer/js/pipelines/pipeline3-finalize.js`
16. `src/renderer/js/pipelines/pipeline3-sub.js`
17. `src/renderer/js/pipelines/pipeline3-tts.js`
18. `src/renderer/js/store.js`
19. `src/renderer/js/utils/dom.js`
20. `src/renderer/js/utils/formatters.js`
21. `src/renderer/js/utils/logger.js`

Everything else remains untouched and unstaged.

## Accepted inventory critical working-file hashes
These ten hashes came from the PM-verified REV4 inventory and must still match:
- `api/server.py` = `c87dcbf9887ea46af4dc3a281cc21441326fc7af`
- `src/main/main.js` = `67d6bcdf250f111e06847c6566f45751fed93392`
- `src/main/preload.js` = `3babcb46feb101c3d206859d7f370802e8298309`
- `src/renderer/index.html` = `d4321c10795093718ccfb2f4319d16cb75651c65`
- `src/renderer/styles/main.css` = `09f3e16767ed2671a9656d53f5441b34267b4d35`
- `src/renderer/js/app.js` = `99c2cafa509ba2038b98f135156b34271da58c70`
- `src/renderer/js/components/settings.js` = `bfac033717ae7131c437679651827677e286af1d`
- `src/renderer/js/pipelines/pipeline1-ai.js` = `a2ba99e2871ad6771a9a18c2f6594bb807181292`
- `src/renderer/js/pipelines/pipeline2-remove.js` = `8bd0bb02b47ad47105372e8f3a96869f3207d1ef`
- `src/renderer/js/pipelines/pipeline3-finalize.js` = `85683b67c7a4a468fcc05fb348bad5d0ff17ff95`

## Positive command whitelist
Run only these commands in PowerShell.

1. `git fetch origin`
2. `git show "origin/control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1:.ai/task_specs/ACTIVE.md"`
3. `git show "origin/control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1.md"`
4. `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`
5. `git -C "E:\Project AI\Video-sub-remove" branch --show-current`
6. `git -C "E:\Project AI\Video-sub-remove" rev-parse origin/rescue/wip-20260803`
7. `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`
8. `git -C "E:\Project AI\Video-sub-remove" diff --cached --name-only`
9. `git -C "E:\Project AI\Video-sub-remove" diff --cached --raw`
10. `git -C "E:\Project AI\Video-sub-remove" hash-object -- "api/server.py" "src/main/main.js" "src/main/preload.js" "src/renderer/index.html" "src/renderer/js/api.js" "src/renderer/js/app.js" "src/renderer/styles/main.css" "src/renderer/js/components/job-manager.js" "src/renderer/js/components/prompt-manager.js" "src/renderer/js/components/settings.js" "src/renderer/js/components/video-preview.js" "src/renderer/js/pipeline.js" "src/renderer/js/pipelines/pipeline1-ai.js" "src/renderer/js/pipelines/pipeline2-remove.js" "src/renderer/js/pipelines/pipeline3-finalize.js" "src/renderer/js/pipelines/pipeline3-sub.js" "src/renderer/js/pipelines/pipeline3-tts.js" "src/renderer/js/store.js" "src/renderer/js/utils/dom.js" "src/renderer/js/utils/formatters.js" "src/renderer/js/utils/logger.js"`
11. `git -C "E:\Project AI\Video-sub-remove" ls-files -s -- "api/server.py" "src/main/main.js" "src/main/preload.js" "src/renderer/index.html" "src/renderer/js/api.js" "src/renderer/js/app.js" "src/renderer/styles/main.css" "src/renderer/js/components/job-manager.js" "src/renderer/js/components/prompt-manager.js" "src/renderer/js/components/settings.js" "src/renderer/js/components/video-preview.js" "src/renderer/js/pipeline.js" "src/renderer/js/pipelines/pipeline1-ai.js" "src/renderer/js/pipelines/pipeline2-remove.js" "src/renderer/js/pipelines/pipeline3-finalize.js" "src/renderer/js/pipelines/pipeline3-sub.js" "src/renderer/js/pipelines/pipeline3-tts.js" "src/renderer/js/store.js" "src/renderer/js/utils/dom.js" "src/renderer/js/utils/formatters.js" "src/renderer/js/utils/logger.js"`
12. `git ls-remote --heads origin review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`

Pre-commit requirements:
- command 4 = `d67a427f1c90a2e98da560977736ead80637db3a`;
- command 5 = `rescue/wip-20260803`;
- command 6 = `d67a427f1c90a2e98da560977736ead80637db3a`;
- command 7 shows upstream `+0 -0` and no new path beyond the PM-verified inventory;
- command 8 lists exactly the 21 allowlisted paths;
- command 9 contains exactly those 21 paths and no others;
- command 10 returns exactly 21 working-file hashes, and the ten accepted inventory hashes above match exactly;
- command 11 returns exactly 21 index entries, and each index blob SHA must equal the corresponding working-file hash from command 10;
- command 12 must return no output. If the remote review branch already exists, STOP.

There is intentionally NO whitespace-cleanliness gate in REV1. Existing whitespace is preserved as selected runtime content, not repaired during snapshot.

13. `git -C "E:\Project AI\Video-sub-remove" commit -m "snapshot: preserve Owner-selected runtime baseline 008 REV1"`
14. `git -C "E:\Project AI\Video-sub-remove" show --name-only --format= HEAD`
15. `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`
16. `git -C "E:\Project AI\Video-sub-remove" push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`
17. `git fetch origin`
18. `git rev-parse origin/review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1`
19. `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`

Publication requirements:
- command 14 lists exactly the same 21 allowlisted paths;
- command 15 = command 18;
- normal non-force push only;
- command 19 shows local `rescue/wip-20260803` exactly one commit ahead of upstream and no unexpected new path;
- excluded local files remain unstaged/untracked;
- no Owner runtime file byte was edited by this task.

## Forbidden actions
No source edit, whitespace cleanup, formatter, `git add`, `git add .`, `git add -A`, reset, restore, checkout, switch, clean, rebase, amend, force push, worktree removal, deletion, archive, app launch, dependency install/update, PR merge, `.ai` edit in Owner runtime, or 036-A/B/C/D work.

## Final status
On success: `WAITING_PM_REVIEW`.

## Final report schema
Return only:
- Status;
- remote control ACTIVE/spec read: YES/NO;
- initial Owner runtime HEAD;
- branch/upstream summary;
- staged files exact: YES/NO;
- 21 working-file hashes in allowlist order;
- 21 index blob hashes match working hashes: YES/NO;
- snapshot commit SHA;
- remote review branch HEAD;
- final local status summary;
- Owner runtime file bytes modified: NO;
- excluded artifacts staged/deleted: NO;
- cleanup performed: NO;
- app launched: NO;
- Owner action required now: NO.

## Next step after Anti success
Project Manager verifies the pushed commit directly on GitHub and opens a Draft PR from `review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1` to `rescue/wip-20260803`. Only after PM code review PASS will Owner real-app verification be authorized. Cleanup remains blocked until snapshot review + Owner verification complete.

Product merge permission: BLOCKED.
