# RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2

## Status
ACTIVE — OWNER-SELECTED RUNTIME SOURCE SNAPSHOT CONTINUATION

## Supersedes
`RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1` is procedurally invalidated for forward execution after the required commit command was rejected by the local pre-commit hook and later commands in the same shell block still executed, creating the REV1 review branch at the unchanged old HEAD.

Do not reuse REV1 as execution authority or publication target.

## Owner decision
The sole runtime selected for preservation and forward development remains exactly:
`E:\Project AI\Video-sub-remove`

This task preserves the exact current application-source bytes. No product source edit, whitespace cleanup, formatting, cleanup, archive, or app launch is authorized.

## Verified recovery basis
Project Manager verified on GitHub that:
- remote `review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV1` exists but is IDENTICAL to `d67a427f1c90a2e98da560977736ead80637db3a` with zero new commits and zero changed files;
- therefore no Owner-runtime snapshot commit was published by REV1;
- executor reported the exact 21 approved source paths remain staged locally, with working-file hashes equal to index blob hashes;
- the commit blocker is a local pre-commit hook that requires `.ai` updates, which are intentionally forbidden in this source-only preservation task.

REV2 explicitly authorizes bypassing that local pre-commit hook for this one exact snapshot commit only. This is not a general permission to bypass hooks.

## Authority
Repository: `thucnv2303/video-subtitle-remover`

Control branch:
`control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`

Protected Owner runtime:
`E:\Project AI\Video-sub-remove`

Expected local branch:
`rescue/wip-20260803`

Expected local HEAD before snapshot:
`d67a427f1c90a2e98da560977736ead80637db3a`

Expected upstream before snapshot:
`origin/rescue/wip-20260803` at `d67a427f1c90a2e98da560977736ead80637db3a`

Review branch to publish:
`review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`

Future Draft PR base:
`rescue/wip-20260803`

## Exact source allowlist
Exactly these 21 paths must already be staged and may be committed, no others:

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

## Required 21 working-file hashes
The working-file hashes must remain exactly, in allowlist order:

1. `c87dcbf9887ea46af4dc3a281cc21441326fc7af`
2. `67d6bcdf250f111e06847c6566f45751fed93392`
3. `3babcb46feb101c3d206859d7f370802e8298309`
4. `d4321c10795093718ccfb2f4319d16cb75651c65`
5. `8e4316dd137e0fa45eed7b4cbb877675cbd07bbe`
6. `99c2cafa509ba2038b98f135156b34271da58c70`
7. `09f3e16767ed2671a9656d53f5441b34267b4d35`
8. `a19d04ee8b12bc4c5cac52386c10783cb383dd66`
9. `6864a2d11a4660ba66632eac00331407f7763682`
10. `bfac033717ae7131c437679651827677e286af1d`
11. `612888e8dd21bb2a30ea4183ca450535d89e287e`
12. `21f9d163969065d9bb83d963d6416946ef2b0b80`
13. `a2ba99e2871ad6771a9a18c2f6594bb807181292`
14. `8bd0bb02b47ad47105372e8f3a96869f3207d1ef`
15. `85683b67c7a4a468fcc05fb348bad5d0ff17ff95`
16. `2c81df4f4cf282c5813b7a545a0926bf71f837a8`
17. `3e7e7082437167aa688ac9413dc355646216d95e`
18. `8620db6f98b7dc20dc193fadcbec9958e7e26d79`
19. `4848066a0ded666a15e17833057923dd2c66d531`
20. `9893598decdc2365301f03d6f9cb3604197774f4`
21. `ca5250baa9511a260b428f53e1cac42f9777d8d5`

Each staged index blob SHA must equal the corresponding working-file hash.

## Hard boundary
Do not edit, normalize, trim, reformat, restore, reset, checkout, switch, clean, rebase, amend, delete, move, rename, stage, or unstage any file.

Do not run the application.
Do not perform cleanup/archive.
Do not update `.ai` inside the Owner runtime.
Do not push to `origin/rescue/wip-20260803`.
Do not use force push.
Do not start 036-A/B/C/D.

The only hook bypass authorized is the exact commit command listed below using `--no-verify` after every pre-commit identity check passes.

On first failed command, mismatch, unexpected path, changed byte, moved upstream, or pre-existing REV2 review branch:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR`

## Positive command whitelist
Run commands individually in PowerShell. Do not combine commit/push/verification into one multi-command block.

1. `git fetch origin`
2. `git show "origin/control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2:.ai/task_specs/ACTIVE.md"`
3. `git show "origin/control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2.md"`
4. `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`
5. `git -C "E:\Project AI\Video-sub-remove" branch --show-current`
6. `git -C "E:\Project AI\Video-sub-remove" rev-parse origin/rescue/wip-20260803`
7. `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`
8. `git -C "E:\Project AI\Video-sub-remove" diff --cached --name-only`
9. `git -C "E:\Project AI\Video-sub-remove" diff --cached --raw`
10. `git -C "E:\Project AI\Video-sub-remove" hash-object -- "api/server.py" "src/main/main.js" "src/main/preload.js" "src/renderer/index.html" "src/renderer/js/api.js" "src/renderer/js/app.js" "src/renderer/styles/main.css" "src/renderer/js/components/job-manager.js" "src/renderer/js/components/prompt-manager.js" "src/renderer/js/components/settings.js" "src/renderer/js/components/video-preview.js" "src/renderer/js/pipeline.js" "src/renderer/js/pipelines/pipeline1-ai.js" "src/renderer/js/pipelines/pipeline2-remove.js" "src/renderer/js/pipelines/pipeline3-finalize.js" "src/renderer/js/pipelines/pipeline3-sub.js" "src/renderer/js/pipelines/pipeline3-tts.js" "src/renderer/js/store.js" "src/renderer/js/utils/dom.js" "src/renderer/js/utils/formatters.js" "src/renderer/js/utils/logger.js"`
11. `git -C "E:\Project AI\Video-sub-remove" ls-files -s -- "api/server.py" "src/main/main.js" "src/main/preload.js" "src/renderer/index.html" "src/renderer/js/api.js" "src/renderer/js/app.js" "src/renderer/styles/main.css" "src/renderer/js/components/job-manager.js" "src/renderer/js/components/prompt-manager.js" "src/renderer/js/components/settings.js" "src/renderer/js/components/video-preview.js" "src/renderer/js/pipeline.js" "src/renderer/js/pipelines/pipeline1-ai.js" "src/renderer/js/pipelines/pipeline2-remove.js" "src/renderer/js/pipelines/pipeline3-finalize.js" "src/renderer/js/pipelines/pipeline3-sub.js" "src/renderer/js/pipelines/pipeline3-tts.js" "src/renderer/js/store.js" "src/renderer/js/utils/dom.js" "src/renderer/js/utils/formatters.js" "src/renderer/js/utils/logger.js"`
12. `git ls-remote --heads origin review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`

Pre-commit requirements:
- command 4 = `d67a427f1c90a2e98da560977736ead80637db3a`;
- command 5 = `rescue/wip-20260803`;
- command 6 = `d67a427f1c90a2e98da560977736ead80637db3a`;
- command 7 shows upstream `+0 -0` and no new path beyond the PM-verified inventory;
- command 8 lists exactly the 21 allowlisted paths;
- command 9 contains exactly those 21 paths and no others;
- command 10 exactly matches the 21 required hashes above;
- command 11 returns exactly 21 index entries and every index blob SHA equals the corresponding command-10 hash;
- command 12 returns no output.

If any check fails, STOP.

13. `git -C "E:\Project AI\Video-sub-remove" commit --no-verify -m "snapshot: preserve Owner-selected runtime baseline 008 REV2"`

Command 13 must succeed and create exactly one new commit. If it fails, STOP and do not run command 14 or later.

14. `git -C "E:\Project AI\Video-sub-remove" show --name-only --format= HEAD`
15. `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`

Command 14 must list exactly the same 21 allowlisted source paths. Otherwise STOP.

16. `git -C "E:\Project AI\Video-sub-remove" push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`
17. `git fetch origin`
18. `git rev-parse origin/review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2`
19. `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`

Publication requirements:
- command 15 = command 18;
- normal non-force push only;
- command 19 shows local branch exactly one commit ahead of `origin/rescue/wip-20260803`;
- excluded local artifacts remain unstaged/untracked;
- no Owner runtime file byte was edited.

## Final status
On success: `WAITING_PM_REVIEW`.

## Final report schema
Return only:
- Status;
- remote control ACTIVE/spec read: YES/NO;
- initial Owner runtime HEAD;
- branch/upstream summary;
- staged files exact: YES/NO;
- 21 working-file hashes match required hashes: YES/NO;
- 21 index blob hashes match working hashes: YES/NO;
- hook bypass used exactly as authorized: YES/NO;
- snapshot commit SHA;
- remote review branch HEAD;
- final local status summary;
- Owner runtime file bytes modified: NO;
- excluded artifacts staged/deleted: NO;
- cleanup performed: NO;
- app launched: NO;
- Owner action required now: NO.

## Next step after Anti success
Project Manager verifies the pushed commit directly on GitHub and opens a Draft PR from `review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008-REV2` to `rescue/wip-20260803`.
Only after PM code review PASS will Owner real-app verification be authorized.
Cleanup remains blocked until snapshot review + Owner verification complete.

Product merge permission: BLOCKED.
