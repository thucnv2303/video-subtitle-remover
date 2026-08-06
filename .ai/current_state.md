# Current State

## Status
WAITING_REVIEW

## Primary Input (OWNER CONFIRMED)
- Chinese product-review videos (Original source cho P1 và P2).

## Current Working Capabilities (OWNER CONFIRMED)
- Voice cloning currently works.
- TTS generation currently works.
- Hard-subtitle removal (Pipeline 2) currently works.

## Documentation & Task State
- INCIDENT-RECOVERY-007E-STAGED-TREE-001: COMPLETED
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED — PASS WITH GIT-NORMALIZED LF
- Project Manager Decision: PASS — SOURCE CONTENT ACCEPTED; LINE-ENDING NORMALIZATION RECORDED

## Source Publication Facts
- Published as Git-normalized LF text, content-equivalent to the approved local snapshots.
- **pipeline1-ai.js**: 3502E378BE17B0111FD6ECDA6373301276B0E4326780A2A76E73925BD18D4C31
- **pipeline3-finalize.js**: B22B80B1975921B3ACF4D5858C0ECD5279767D72EE5C976D74DD8F79015712EB
- **prompt-manager.js**: C5A144620554FB4E94C934EDC5903E8C6E6243B966590F59C8CBFBF6BB7F4793
- **store.js**: 1AF5545FF5537ED582B3AC0C8DE27ED2CFEA9F84E24CFE40C41A332ED5B25AC4
- **logger.js**: 44ED9EB4A8F59AF30031F99EAB7187040C26EF84EF1288FEA08BD50BDAA07905
- **dom.js**: 4A13A7E26ABDC0FA45422C0B341A47F010EE035558F6BD740CF0AA460DFD9B5B
- Five differences are CRLF → LF normalization only.
- No JavaScript token or runtime logic changed.
- Independent node --check: 6/6 PASS.

## Tracking
- Active task: RECOVERY-007E-AI-SETTINGS-001
- **Preload Runtime Failure**: Confirmed at old head 8e871c29... Root cause: Node core HTTP imports in sandboxed preload.
- **Corrected Architecture**: Ollama transport moved to main process, minimal IPC preload.
- Source fix commit SHA: 1e349b744ee52aeeaec21693e2681456ac7ac849
- Exact static results: node --check (4 files) PASS, git diff --check PASS. Preload contains no Node HTTP imports.
- Runtime provider-switching and persistence results: PASS.
- Ollama success result or dependency WAITING: WAITING (Controlled-error path passed locally, full models test passed via CDP locally).
- BUG-008 and BUG-009 remain CANDIDATE FIX — OWNER TEST PENDING
- RECOVERY-007 owner verification PAUSED
- PR #4 DO NOT MERGE
- PR #5 DO NOT MERGE
- PR #6 DO NOT MERGE
- PR #7 DO NOT MERGE
- PR #8 DO NOT MERGE

## Verification gates
- Execution: PASS — runtime fix published
- Automated verification: PASS WITH OLLAMA SUCCESS PATH WAITING
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED

## Current branch
review/RECOVERY-007E-AI-SETTINGS-001-ai-settings
