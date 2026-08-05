# Current Task

## Task ID
INCIDENT-RECOVERY-007E-002

## Name
Targeted restoration of invalid RECOVERY-007E changes

## Objective
Restore only the five verified files (api/server.py, src/renderer/index.html, src/renderer/js/app.js, src/renderer/js/components/settings.js, src/renderer/js/pipelines/pipeline2-remove.js) and the six deleted pre-existing scripts.

## Restoration Details
- **Exact restored files**: api/server.py, src/renderer/index.html, src/renderer/js/app.js, src/renderer/js/components/settings.js, src/renderer/js/pipelines/pipeline2-remove.js, patch_app.py, patch_app_ui.py, patch_index_log.py, patch_main.py, patch_main_pos.py, patch_server.py.
- **Exact untouched files**: src/renderer/js/api.js, api/tts_engine.py, package.json, package-lock.json, src/main/main.js, src/main/preload.js, src/renderer/styles/main.css, and all other tracked/untracked source.
- **Evidence PRs**: PR #1 and PR #2.
- **Evidence commit**: bc447d515b05a1e13eb1b20aee3fbe422f1edf7b
- **Known prior PR commits**: bc447d515b05a1e13eb1b20aee3fbe422f1edf7b, 1a940da5e7c2bda6fe980f9b54df8e3f9d5cc8d5, 55dde57ee0e63b2f9dafaf8df7da938e5ca50afa
- **Current PR head is resolved from GitHub and is not hard-coded to avoid recursive stale metadata.**
- **Source/post-restore hash verification**: PASS
- **Syntax commands and exit codes**: python py_compile (Exit 0) and node --check (Exit 0)
- **RECOVERY-007 ASR**: Preserved
- **RECOVERY-007E**: Invalid implementation reverted and NOT IMPLEMENTED (no RECOVERY-007 implementation objective, scope or acceptance criteria, and no owner runtime PASS claims).

## Verification gates
- Execution: PASS
- Automated verification: PASS — static restoration checks only
- Code review: WAITING
- Owner manual app verification: DO NOT START
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED
