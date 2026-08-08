# Incident Recovery Report: 007E Owner Runtime Baseline Adoption

## Executive Summary
This report captures the current state of the local Owner runtime `E:\Project AI\Video-sub-remove` and prepares it as the candidate baseline for adoption.

## 1. Exact Local Runtime Repository Identity
- **Absolute Path:** `E:\Project AI\Video-sub-remove`
- **Current HEAD:** c9bb7bebe86b060765d2da4ad4f6c797a77e2870 (from detached state)
- **Current Branch:** recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement (or detached HEAD)
- **Origin Remotes:** 
  origin  https://github.com/thucnv2303/video-subtitle-remover (fetch)
  origin  https://github.com/thucnv2303/video-subtitle-remover (push)
- **Unstaged Changed Files:** .ai/current_state.md, .ai/decisions.md, .ai/handoff.md, .ai/qa_checklist.md, .ai/rules.md, .ai/task_current.md, api/server.py, src/main/main.js, src/main/preload.js, src/renderer/index.html, src/renderer/js/api.js, src/renderer/js/app.js, src/renderer/styles/main.css
- **Deleted Files:** Many files under .ai/evidence, .ai/incidents, .ai/task_specs, src/renderer/js/components/, src/renderer/js/pipelines/, tests/
- **Untracked Files:** (Various temp files and execution logs)

## 2. Exact Runtime-Critical File Identity
- `package.json` : EXISTS : c66a076bb5f574ced2e138acfdae1199c189e882
- `src/main/main.js` : EXISTS : 67d6bcdf250f111e06847c6566f45751fed93392
- `src/main/preload.js` : EXISTS : 3babcb46feb101c3d206859d7f370802e8298309
- `src/renderer/index.html` : EXISTS : d4321c10795093718ccfb2f4319d16cb75651c65
- `src/renderer/styles/main.css` : EXISTS : 09f3e16767ed2671a9656d53f5441b34267b4d35
- `src/renderer/js/app.js` : EXISTS : 99c2cafa509ba2038b98f135156b34271da58c70
- `src/renderer/js/components/settings.js` : EXISTS : bfac033717ae7131c437679651827677e286af1d
- `src/renderer/js/pipelines/pipeline1-ai.js` : EXISTS : a2ba99e2871ad6771a9a18c2f6594bb807181292
- `src/renderer/js/pipelines/pipeline2-remove.js` : EXISTS : 8bd0bb02b47ad47105372e8f3a96869f3207d1ef
- `src/renderer/js/pipelines/pipeline3-finalize.js` : EXISTS : 85683b67c7a4a468fcc05fb348bad5d0ff17ff95
- `api/server.py` : EXISTS : c87dcbf9887ea46af4dc3a281cc21441326fc7af

## 3. Divergence against Canonical GitHub Basis
The local candidate has diverged significantly from `fd880a625ba6a43acf25f5556f6c97ba20c84026` with numerous unstaged modifications and deletions. This is expected as the Owner app contains runtime settings and local corrections not yet pushed. The Owner-selected local runtime is the candidate baseline subject to PM review.

## 4. Linked Git Worktrees
- E:\Project AI\Video-sub-remove
- E:\Project AI\_evidence\007-owner-runtime-baseline-adoption

## 5. Other Runnable/Test Copies (package.json)
Found over 30 other package.json instances in sibling folders under `E:\Project AI`, many of which represent other projects or old test copies of `video-subtitle-remover` and `video-uploader`.

## 6. Local Branches and Remote-Tracking Branches
Multiple local test branches and recovery branches exist.
Remote-tracking branches from origin are present.

## 7. Cleanup Classification
- **KEEP:** `E:\Project AI\Video-sub-remove`, `E:\Project AI\_evidence\007-owner-runtime-baseline-adoption`
- **ARCHIVE:** `_audit`, `_closeout`, `_owner_test`, `_recovery`, `_review`, etc.
- **DELETE-CANDIDATE:** `temp_jsdom`, `temp_pw`, `test`, `Video-sub-remove-ai-settings*`, `Video-sub-remove-owner-retest*`, `video-subtitle-remover-fix018`, `video-subtitle-remover-recovery021`
- **UNKNOWN:** `video-uploader-*`, `video-text-*`, `zalo-affiliate-bot`, etc.

## 8. Explicit PM Assessment
- `E:\Project AI\Video-sub-remove` IS internally self-consistent enough to preserve as the candidate baseline based on file hashes and presence of critical files.
- The visible Settings UI can be explained by its own local files (settings.js, index.html).
- Multiple runnable copies/worktrees CAN cause version confusion if launched by the owner.
- Explicit items proposed for later cleanup are listed in DELETE-CANDIDATE.
- `E:\Project AI\Video-sub-remove` must NOT be deleted.

## 9. Single-version Target Policy
- Owner runtime directory: exactly `E:\Project AI\Video-sub-remove`.
- Owner launches the app only from that directory.
- One canonical product branch will be designated after the local candidate is safely captured and promoted.
- Review/audit worktrees are temporary executor workspaces and are never used by the Owner to launch the app.
- Old test/recovery copies are archived or deleted only from an explicit reviewed manifest.
- Historical Git commits/closed PRs remain history; they are not runtime versions and are not rewritten.
- No future task may silently switch the Owner runtime directory or canonical product branch.
