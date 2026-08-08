# RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008

## Status
ACTIVE — OWNER-SELECTED RUNTIME SOURCE SNAPSHOT ONLY

## Owner decision
The one runtime to preserve and continue from is exactly:

`E:\Project AI\Video-sub-remove`

The Owner selected the currently running application in that directory as the forward product baseline. This task preserves that runtime source on GitHub without changing its file contents. It does NOT clean up duplicate/test copies yet.

## Evidence basis
PM-verified inventory evidence:
- PR #30 — `RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV4`
- evidence commit: `959c178172356ec0e1abf7355a91fad938c799f6`
- evidence file: `.ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV4.json`

Verified Owner runtime identity from that evidence:
- path: `E:\Project AI\Video-sub-remove`
- branch: `rescue/wip-20260803`
- HEAD: `d67a427f1c90a2e98da560977736ead80637db3a`
- upstream: `origin/rescue/wip-20260803`
- upstream divergence at capture: `+0 -0`

The evidence also proves the Owner runtime contains intentional local product-source changes plus unrelated local audit/patch/test artifacts. Therefore source preservation must be isolated from cleanup.

## Control authority
Repository: `thucnv2303/video-subtitle-remover`

Remote control branch:
`control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`

Anti must read ACTIVE and this complete spec from that remote control branch after `git fetch origin`.

Source review branch to publish:
`review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`

Source PR base after publication:
`rescue/wip-20260803`

Project Manager, not Anti, will open the Draft PR after Anti pushes the source snapshot. This is a deliberate recovery exception because the protected Owner runtime is a dirty working tree and must not ingest PM control commits before its exact source is preserved.

## Hard boundary
This task MUST NOT change the bytes of any existing file under `E:\Project AI\Video-sub-remove`.

The only permitted changes inside that Git repository are:
1. staging the exact approved product-source allowlist;
2. creating one snapshot commit from those existing bytes;
3. advancing the local Git HEAD by that commit;
4. pushing that commit to the dedicated remote review branch.

All other local modifications/untracked files remain untouched and unstaged.

No cleanup, deletion, archive, restore, reset, checkout, switch, clean, rebase, amend, force push, dependency change, application launch, 036-A/B/C/D work, or documentation rewrite is authorized.

On the first failed command, mismatch, unexpected path, or moved upstream:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR`

## Exact product-source allowlist
Exactly these 21 paths may be staged and committed:

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

Explicitly excluded from this snapshot:
- all `.ai/**` local modifications/untracked files;
- `src/renderer/js/app.backup.js`;
- `fix_main3.py`;
- `patch_app.py`;
- `patch_app_ui.py`;
- `patch_index_log.py`;
- `patch_main.py`;
- `patch_main_pos.py`;
- `patch_server.py`;
- all `scratch/**` files;
- `test_ocr_check.srt`;
- `test_ocr_check_tts.mp3`;
- all other paths not in the 21-file allowlist.

## Known critical hashes from accepted inventory
Before staging, these exact current working-file Git hashes must still match:
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

If any known hash differs, STOP: `OWNER RUNTIME MOVED SINCE INVENTORY`.

## Positive command whitelist
No command outside this list is authorized. Run commands from PowerShell.

### Authority and preflight
1. `git fetch origin`
2. `git show "origin/control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008:.ai/task_specs/ACTIVE.md"`
3. `git show "origin/control/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008:.ai/task_specs/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008.md"`
4. `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`
5. `git -C "E:\Project AI\Video-sub-remove" branch --show-current`
6. `git -C "E:\Project AI\Video-sub-remove" rev-parse origin/rescue/wip-20260803`
7. `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`
8. `git -C "E:\Project AI\Video-sub-remove" diff --cached --name-only`

Required preflight:
- command 4 = `d67a427f1c90a2e98da560977736ead80637db3a`;
- command 5 = `rescue/wip-20260803`;
- command 6 = `d67a427f1c90a2e98da560977736ead80637db3a`;
- command 7 must show upstream `origin/rescue/wip-20260803` with `+0 -0` and may contain only the previously inventoried local dirty/untracked paths; no new path outside the inventory is allowed;
- command 8 must be empty.

If any requirement fails, STOP.

### Hash all approved source files
9. `git -C "E:\Project AI\Video-sub-remove" hash-object -- "api/server.py" "src/main/main.js" "src/main/preload.js" "src/renderer/index.html" "src/renderer/js/api.js" "src/renderer/js/app.js" "src/renderer/styles/main.css" "src/renderer/js/components/job-manager.js" "src/renderer/js/components/prompt-manager.js" "src/renderer/js/components/settings.js" "src/renderer/js/components/video-preview.js" "src/renderer/js/pipeline.js" "src/renderer/js/pipelines/pipeline1-ai.js" "src/renderer/js/pipelines/pipeline2-remove.js" "src/renderer/js/pipelines/pipeline3-finalize.js" "src/renderer/js/pipelines/pipeline3-sub.js" "src/renderer/js/pipelines/pipeline3-tts.js" "src/renderer/js/store.js" "src/renderer/js/utils/dom.js" "src/renderer/js/utils/formatters.js" "src/renderer/js/utils/logger.js"`

Record all 21 hashes in order in the final report. Verify the ten known critical hashes above exactly. Missing file or mismatch = STOP.

### Syntax verification without modifying source
10. `python -m py_compile "E:\Project AI\Video-sub-remove\api\server.py"`
11. `node --check "E:\Project AI\Video-sub-remove\src\main\main.js"`
12. `node --check "E:\Project AI\Video-sub-remove\src\main\preload.js"`
13. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\api.js"`
14. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\app.js"`
15. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\pipeline.js"`
16. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\components\job-manager.js"`
17. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\components\prompt-manager.js"`
18. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\components\settings.js"`
19. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\components\video-preview.js"`
20. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\pipelines\pipeline1-ai.js"`
21. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\pipelines\pipeline2-remove.js"`
22. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\pipelines\pipeline3-finalize.js"`
23. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\pipelines\pipeline3-sub.js"`
24. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\pipelines\pipeline3-tts.js"`
25. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\store.js"`
26. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\utils\dom.js"`
27. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\utils\formatters.js"`
28. `node --check "E:\Project AI\Video-sub-remove\src\renderer\js\utils\logger.js"`

Every command 10-28 must exit 0. If any fails, STOP. Do not repair.

### Stage exact existing bytes only
29. `git -C "E:\Project AI\Video-sub-remove" add -- "api/server.py" "src/main/main.js" "src/main/preload.js" "src/renderer/index.html" "src/renderer/js/api.js" "src/renderer/js/app.js" "src/renderer/styles/main.css" "src/renderer/js/components/job-manager.js" "src/renderer/js/components/prompt-manager.js" "src/renderer/js/components/settings.js" "src/renderer/js/components/video-preview.js" "src/renderer/js/pipeline.js" "src/renderer/js/pipelines/pipeline1-ai.js" "src/renderer/js/pipelines/pipeline2-remove.js" "src/renderer/js/pipelines/pipeline3-finalize.js" "src/renderer/js/pipelines/pipeline3-sub.js" "src/renderer/js/pipelines/pipeline3-tts.js" "src/renderer/js/store.js" "src/renderer/js/utils/dom.js" "src/renderer/js/utils/formatters.js" "src/renderer/js/utils/logger.js"`
30. `git -C "E:\Project AI\Video-sub-remove" diff --cached --name-only`
31. `git -C "E:\Project AI\Video-sub-remove" diff --cached --raw`
32. `git -C "E:\Project AI\Video-sub-remove" -c core.whitespace=cr-at-eol diff --cached --check`

Command 30 must list exactly the 21 allowlisted paths and no others. Command 32 must exit 0. Otherwise STOP.

### Commit and publish snapshot
33. `git -C "E:\Project AI\Video-sub-remove" commit -m "snapshot: preserve Owner-selected runtime baseline"`
34. `git -C "E:\Project AI\Video-sub-remove" show --name-only --format= HEAD`
35. `git -C "E:\Project AI\Video-sub-remove" push origin HEAD:review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`
36. `git -C "E:\Project AI\Video-sub-remove" rev-parse HEAD`
37. `git fetch origin`
38. `git rev-parse origin/review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008`
39. `git -C "E:\Project AI\Video-sub-remove" status --porcelain=v2 --branch`

Required publication gates:
- command 34 lists exactly the same 21 source paths;
- push is normal, non-force;
- command 36 = command 38;
- command 39 shows local branch one commit ahead of `origin/rescue/wip-20260803` and all previously excluded local artifacts remain unstaged/untracked; no additional path appears.

Do not push to `origin/rescue/wip-20260803` in this task.

## Forbidden actions
- no source/content edits of any kind;
- no `git add .` or `git add -A`;
- no staging `.ai`, scratch, patch, backup, test-media, or any non-allowlisted path;
- no reset/restore/checkout/switch/clean/rebase/amend;
- no force push;
- no deleting/removing/moving/renaming any file or directory;
- no `git worktree remove`;
- no application launch / `npm start`;
- no dependency install/update;
- no PR merge;
- no cleanup of duplicate copies;
- no 036-A/B/C/D work;
- no self-repair after failure.

## Final status
On success: `WAITING_PM_REVIEW`.

## Final report schema
Return only:
- Status;
- remote control ACTIVE/spec read: YES/NO;
- initial Owner runtime HEAD;
- branch/upstream summary;
- 21 source hashes in allowlist order;
- syntax checks: PASS/FAIL;
- staged files exact: YES/NO;
- snapshot commit SHA;
- remote review branch HEAD;
- final local status summary;
- Owner runtime file bytes modified: NO;
- excluded artifacts staged/deleted: NO;
- cleanup performed: NO;
- app launched: NO;
- Owner action required now: NO.

## Next step after Anti success
Project Manager independently verifies the pushed commit on GitHub and opens a Draft PR from `review/RECOVERY-007E-OWNER-RUNTIME-SNAPSHOT-008` to `rescue/wip-20260803`.

Only after PM code review PASS will the Owner be asked to run the app. After Owner PASS, PM will designate this source snapshot as the sole forward baseline, synchronize canonical `.ai` knowledge, and issue a separate exact-path cleanup task for duplicate/test copies and local junk.

Product merge permission: BLOCKED until those gates pass.