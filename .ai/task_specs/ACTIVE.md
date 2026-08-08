# Active PM Execution Spec

Status: INCIDENT_CAPTURE_ACTIVE

Task:
`INCIDENT-RECOVERY-007E-LOCAL-RUNTIME-SOURCE-MISMATCH-006`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Canonical HEAD entering capture:
`2d39a184d125a6df153d59863e484c6ad240c41c`

Spec:
`.ai/task_specs/INCIDENT-RECOVERY-007E-LOCAL-RUNTIME-SOURCE-MISMATCH-006.md`

Reason:
Owner reports that launching the app from `E:\Project AI\Video-sub-remove` shows a Settings UI different from the recently approved Task 034 UI.

Verified GitHub fact:
Current canonical `src/renderer/index.html` and `src/renderer/js/components/settings.js` are byte-identical to the approved Task 034 source versions. Therefore canonical GitHub UI source has not reverted; local runtime source/state must be verified before any further implementation or Owner testing.

Anti authorization:
READ-ONLY LOCAL SOURCE CAPTURE ONLY under the exact incident spec.

Application source/test/dependency authorization:
NONE.

Repair authorization:
NONE.

036-A/B/C/D authorization:
NONE.

Owner app verification:
NOT AUTHORIZED while runtime source identity is unresolved.

Merge permission:
BLOCKED for product implementation.

Next permitted action:
Anti performs the exact read-only capture in the active incident spec and reports evidence. No file modification, app launch, repair, commit or push is allowed.
