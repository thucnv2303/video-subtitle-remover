# PIPELINE1-PER-JOB-SEMANTIC-REMIX-011

Status: APPROVED FOR PM DIRECT EXECUTION

## Repository / refs
- Repository: `thucnv2303/video-subtitle-remover`
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Exact base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`
- Review branch: `review/PIPELINE1-PER-JOB-SEMANTIC-REMIX-011`
- Prior sibling PRs remain separate: #52 BUG-039 log observability, #53 BUG-040 Prompt Manager V2.

## Owner requirement
Semantic Remix is an optional capability per video/job, not a global application mode. The user must be able to enable Remix for one Job and leave another Job in Standard mode in the same Pipeline 1 queue.

## Verified current defect
`src/renderer/js/pipeline1-run-config.js` currently:
- injects one global `#step1-semantic-remix` checkbox near the Pipeline 1 start action;
- persists that checkbox in `localStorage` key `p1_semantic_remix_enabled`;
- reads one boolean at run start and copies the same `semanticRemixEnabled` value into every idle Job's `p1Config`.

This conflicts with the desired per-Job semantics.

Downstream architecture already supports the desired model: `runPipeline1MultimodalAnalysis(job)` reads `Boolean(job.p1Config.semanticRemixEnabled)` and selects Standard vs Semantic Remix independently for that Job.

## Product decision
Place a compact `Remix` toggle on each Pipeline 1 Job card in the Job Queue.

Reason:
- the choice belongs to the video/job itself;
- multiple jobs can mix Standard and Remix in one queue;
- the mode is visible before the user starts processing;
- no hidden global state or app-wide persistence is needed.

Do NOT put the toggle in Settings or as one global control beside `Bắt đầu chạy`.

## State model
- `job.semanticRemixEnabled: boolean` is the editable per-Job UI value; default `false` when absent.
- No `localStorage` is authoritative for Remix mode.
- At run snapshot time, each Job receives its own `job.p1Config.semanticRemixEnabled = Boolean(job.semanticRemixEnabled)`.
- Once a Job is queued/processing, its toggle is disabled so the mode cannot drift after snapshot.
- An idle/error Job may be changed. If an error Job already has `p1Config`, changing the toggle also updates only that Job's `p1Config.semanticRemixEnabled` so a retry uses the newly selected mode.

## UI
Each `#step1-job-list .tk-job-card` receives one compact control:
- label: `Remix`;
- checkbox/switch OFF by default;
- state copy `Standard` when OFF and `Remix` when ON;
- title/aria copy explains that Remix analyzes product/customer/story and creates a semantic edit plan;
- stop click propagation so toggling does not accidentally trigger another Job-card action;
- disabled for queued/processing Jobs.

The old global Semantic Remix control must no longer be created.

## Implementation scope
Allowed application source only:
1. `src/renderer/js/pipeline1-run-config.js`
2. new `src/renderer/js/pipeline1-semantic-remix-per-job.js`
3. new `src/renderer/styles/pipeline1-semantic-remix-per-job.css`

No `app.js`, `index.html`, Prompt Manager, P2, P3, backend, TTS, AI analysis, log routing, dependencies, or unrelated formatting changes.

## Implementation requirements
1. New per-Job module periodically/safely syncs Job cards with `window._appState.jobs`, using the same card-index -> Job mapping already used by `pipeline1-run-ux.js`.
2. Initialize missing `job.semanticRemixEnabled` to `false` only; do not read the legacy global localStorage key.
3. Do not duplicate controls across rerenders.
4. Toggle updates the owning Job only.
5. Toggle is disabled when effective P1 state is `queued` or `processing`.
6. If toggled while idle/error and `job.p1Config` already exists, update only `job.p1Config.semanticRemixEnabled` for retry correctness.
7. `pipeline1-run-config.js` removes creation/use/persistence of the global semantic checkbox and legacy Remix localStorage as authority.
8. Run snapshot keeps provider/model/prompt/TTS as shared run settings, but creates a separate `p1Config` for each idle Job with that Job's boolean.
9. Run log reports a concise Remix count such as `Remix=2/5 jobs` rather than one global ScriptMode.
10. Existing downstream analysis/artifact behavior is unchanged.

## Compatibility
- Legacy `p1_semantic_remix_enabled` may remain in old user storage but is ignored by this task.
- Existing Job objects without the new field become Standard (`false`).
- No persistent migration is required because the option is intentionally per transient Job.

## Verification
Static required:
```text
node --check src/renderer/js/pipeline1-semantic-remix-per-job.js
node --check src/renderer/js/pipeline1-run-config.js
git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD
```

Source review:
- source diff limited to the 3 authorized files;
- no global Remix checkbox creation remains;
- no Remix localStorage read/write remains in run config;
- each Job snapshot uses its own value;
- toggle cannot affect another Job;
- queued/processing toggle disabled.

## Owner runtime acceptance
1. Add at least 2 P1 videos. Both Job cards show `Remix` switch OFF / `Standard` by default.
2. Turn Remix ON for Job A only. Job B stays OFF.
3. Start queue. Job A logs/runs `ScriptMode=semantic-remix`; Job B logs/runs Standard.
4. Toggle cannot be changed for a queued/processing Job.
5. A new Job added later starts OFF even if another Job is ON.
6. App restart does not globally force future Jobs into Remix.
7. Existing Standard P1 and Semantic P1 downstream behavior remain unchanged.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: NOT STARTED.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
