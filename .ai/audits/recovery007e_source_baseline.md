# RECOVERY-007E-SOURCE-BASELINE-001 Publication Report

## Scope & Metadata
- **Task ID**: RECOVERY-007E-SOURCE-BASELINE-001
- **Original local branch**: rescue/wip-20260803
- **Original local HEAD**: d67a427f1c90a2e98da560977736ead80637db3a
- **Stack base branch**: review/INCIDENT-RECOVERY-007E-TRACKING-001-evidence
- **Stack base SHA**: 2100d2bab683a43825a3e37537ed1976fe8583c4
- **Source commit SHA**: 29d1d6a17ef7ed71041863ab1ca3911aa039f957
- **Exact six source paths**:
  - `src/renderer/index.html`
  - `src/renderer/js/app.js`
  - `src/renderer/js/api.js`
  - `src/renderer/js/components/settings.js`
  - `src/renderer/js/pipelines/pipeline2-remove.js`
  - `api/server.py`

## Size and Hash Verification
| File | Source Size | Dest Size | Source SHA256 | Dest SHA256 | Track Classification |
|---|---|---|---|---|---|
| `index.html` | 48059 | 48059 | 15653A...5A2B | 15653A...5A2B | TRACKED — MODIFIED |
| `app.js` | 67768 | 67768 | 95BAE3...0ED4 | 95BAE3...0ED4 | TRACKED — MODIFIED |
| `api.js` | 9477 | 9477 | 485CEC...9664 | 485CEC...9664 | TRACKED — MODIFIED |
| `settings.js` | 15377 | 15377 | 40D845...C130 | 40D845...C130 | UNTRACKED |
| `pipeline2-remove.js`| 5811 | 5811 | 0B83DD...4850 | 0B83DD...4850 | UNTRACKED |
| `server.py` | 117725| 117725| 0D3212...8287 | 0D3212...8287 | TRACKED — MODIFIED |

## Assertions
- **Source Files Copy**: Confirmed copied byte-for-byte perfectly.
- **Original Dirty Tree**: Confirmed untouched.
- **Python syntax result**: PASS (exit code 0)
- **Four JavaScript syntax results**: PASS (all exit code 0)
- **Git diff --check result**: PASS
- **Secret scan result**: SECRET SCAN: NO SUSPECTED VALUES FOUND
- **RECOVERY-007 ASR preservation result**: Preserved intact (no edits).
- **Pipeline 2 preservation result**: Preserved intact (no edits).
- **AI Settings implementation status**: NOT STARTED.

## Limitations
This baseline simply incorporates the current valid but untracked UI runtime logic to resolve tracking conflicts. No new logic was implemented.

## Recommendation
WAITING_REVIEW
