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
| `index.html` | 48059 | 48059 | 15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B | 15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B | TRACKED — MODIFIED |
| `app.js` | 67768 | 67768 | 95BAE3351D9437C5B1F8ADE173200996738F6C4785A1DBBE6F6C8563614D0ED4 | 95BAE3351D9437C5B1F8ADE173200996738F6C4785A1DBBE6F6C8563614D0ED4 | TRACKED — MODIFIED |
| `api.js` | 9477 | 9477 | 485CEC25E950A61B3858D0B06AF1488402BAA066AC94CD3269903AC25AA39664 | 485CEC25E950A61B3858D0B06AF1488402BAA066AC94CD3269903AC25AA39664 | TRACKED — MODIFIED |
| `settings.js` | 15377 | 15377 | 40D845884D896A58A4D9D89EF7A755D53DC8373361D5604F645C7BDCD9DCC130 | 40D845884D896A58A4D9D89EF7A755D53DC8373361D5604F645C7BDCD9DCC130 | UNTRACKED |
| `pipeline2-remove.js`| 5811 | 5811 | 0B83DD7748FE800EAFF9E53D49485D5BC0F8776DA5A13747E49C3B7C8AD44850 | 0B83DD7748FE800EAFF9E53D49485D5BC0F8776DA5A13747E49C3B7C8AD44850 | UNTRACKED |
| `server.py` | 117725| 117725| 0D3212626B0121E3D316B7128D0345817039128D2781B1017053F5DEB9098287 | 0D3212626B0121E3D316B7128D0345817039128D2781B1017053F5DEB9098287 | TRACKED — MODIFIED |

## Assertions
- **Source Files Copy**: Confirmed copied byte-for-byte perfectly. No byte changes were made relative to the six files in the original dirty runtime source. The baseline PR intentionally introduces the existing runtime-source delta relative to its GitHub stack base. This is source publication, not new AI Settings implementation.
- **Original Dirty Tree**: Confirmed untouched.
- **Python syntax result**: PASS (exit code 0)
- **Four JavaScript syntax results**: PASS (all exit code 0)
- **Git diff --check result**: FAIL (exit code 2). The failure is caused by trailing whitespace inherited from the original dirty runtime source and intentionally preserved by this byte-for-byte baseline task.
- **Secret scan result**: SECRET SCAN: NO SUSPECTED VALUES FOUND
- **RECOVERY-007 ASR preservation result**: Preserved intact (no edits).
- **Pipeline 2 preservation result**: Preserved intact (no edits).
- **AI Settings implementation status**: NOT STARTED.

## Limitations
This baseline simply incorporates the current untracked UI runtime logic to resolve tracking conflicts.

## Recommendation
WAITING_REVIEW
