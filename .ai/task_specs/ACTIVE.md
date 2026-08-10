# Active PM Execution Spec

Status: WAITING_OWNER_TEST

Task:
`PIPELINE2-APPROVED-UI-001`

Repository:
`thucnv2303/video-subtitle-remover`

Stacked base:
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Base SHA: `97d5a13e77b6919931c251c74fab4c191fa04cec`
- Dependency: Draft PR #41 remains unmerged and is preserved as the current P1 functional checkpoint.

Review branch:
`review/PIPELINE2-APPROVED-UI-001`

Draft PR:
#42

Execution / acceptance spec:
`.ai/task_specs/PIPELINE2-APPROVED-UI-001.md`

Current source checkpoint:
`5c9c2f0fa12c884b19fa5d8bfcee080a31364203`

Application source scope:
- `src/renderer/js/pipeline.js`
- `src/renderer/styles/pipeline2-approved.css`

Review facts:
- P2 source diff is isolated from the stacked P1 base.
- No `app.js`, `pipeline-state.js`, backend, P1 engine, P3, Settings, or dependency source file is changed by PR #42.
- Existing P1→P2 eligibility/start guard remains authoritative in unchanged `pipeline-state.js`.
- Direct P2 upload/drop remains hidden and blocked.
- New P2 adapter block parses with `node --check` in isolated delta verification; GitHub CI is not configured.
- Exact full-file `node --check` of the published GitHub blob is not independently recorded, so Automated/static verification remains WAITING for merge purposes.

Code review:
PASS for Owner runtime UI verification.

Owner app verification:
AUTHORIZED / NOT STARTED.

Merge permission:
BLOCKED pending Owner PASS, recorded result, documentation resync, automated gate closure, and explicit merge approval.
