# Current State

## Status
PIPELINE2-MANUAL-REGION-REVISION-002 — CODE REVIEW PASS / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent P2 branch: `review/PIPELINE2-APPROVED-UI-001`.
- Exact parent head: `39c2ac7254977c44d2cedb79cabd914fe124c3a7`.
- Active review branch: `review/PIPELINE2-MANUAL-REGION-REVISION-002`.
- Draft PR: #43.
- Current reviewed source commit: `0e20fc0c6300240276da8e4bef16f67186a08889`.

## Owner outcome targeted
The previous P2 retest proved backend/STTN execution, realtime preview, clean output and P3 success unlock, but remained PARTIAL PASS because:
1. manual ROI was displaced under the letterboxed portrait layout;
2. manual regions did not persist independent mask modes;
3. visible P2 Console contained frame/poll noise.

## Current source revision
Changed application source relative to the exact parent is limited to:
- `src/renderer/js/pipeline2-runtime.js`;
- `src/renderer/js/pipelines/pipeline2-remove.js`.

Current behavior:
- ROI source/display conversion uses `canvas-original.getBoundingClientRect()` and letterbox offsets;
- draw starts outside the rendered video are rejected and the legacy wrapper handler is suppressed while manual drawing is active;
- runtime observers immediately restore corrected region UI/overlays after legacy list/frame rendering mutates the DOM;
- new regions inherit the current global mask selector and persist `maskMode` independently;
- legacy regions fall back to `job.maskMode || 'box'`;
- the active manual request resolves the current region mask;
- successful `/api/frame/...` and poll logs plus expected active `/api/preview` 404 lines are suppressed without suppressing unexpected errors.

No backend, preload/python bridge, `pipeline-state.js`, P1, P3, Settings or dependency source is changed by this task.

## Verification evidence
- Published runtime blob SHA: `f2b39abb2a948eb14e21665f6e0f234a1bef6ae1`; identical local file hash and `node --check`: PASS.
- Published `pipeline2-remove.js` blob SHA: `67340ba29825ced3b4e5e5c583b591cba0ed2510`; exact local hash match and `node --check`: PASS.
- Deterministic ROI simulation: <=1 CSS px criterion PASS; latest run maximum error 0.25 px.
- Mask simulation: `box`, `tight`, legacy fallback `soft` — PASS.
- Log simulation: frame 200 hidden; preview 404 hidden; preview 500/completion visible — PASS.
- GitHub compare parent → `0e20fc0...`: final tree contains only the two approved source files plus canonical task documentation.
- GitHub CI/status checks: none configured.
- Exact unchanged `src/renderer/js/app.js` blob `99c2cafa509ba2038b98f135156b34271da58c70`: reconstructed byte-identical; `node --check`: PASS.
- Exact changed-file reconstruction from parent blob hashes to current source/docs: `git diff --check`: PASS.

## Controlled publication incident
During PM verification an accidental one-line probe file `.ai/.pm_probe_should_not_exist` was created in commit `78252c198e6790722e92877c17bfee62312877a0` and immediately removed in normal follow-up commit `cec184210ab9a622c5c62163712ff0f44a9ffe5c`. No force/history rewrite was used. GitHub compare `d84d809...` → `cec1842...` reports zero final file differences, and the final PR changed-file set contains no probe file. The incident is therefore contained, but is recorded rather than hidden.

## Gates
- Execution: PASS for source publication.
- Automated verification: PASS.
- Code review: PASS.
- Owner manual app verification: NOT STARTED — READY FOR OWNER RETEST.
- Documentation synchronization: PASS at this checkpoint.
- Merge permission: BLOCKED.

## Next permitted action
Owner performs fresh real-app retest of PR #43 against the QA checklist. Do not merge until Owner PASS is recorded in canonical `.ai/`.
