# INCIDENT-RECOVERY-007E-TRACKING-001 Report

## Exact Source Tracking State

### src/renderer/index.html
- **Exists locally**: YES
- **Tracked at local HEAD**: YES
- **Present in canonical GitHub base**: YES
- **Present at PR #2 head**: YES
- **Git status code**: M (Modified)
- **Ignored**: NO
- **SHA256**: 15653AF95D50006040DD9A3571F359D1BBBAA24F839071CB4CDE684453105A2B
- **Actual responsibility**: UI layout for AI settings and forms.
- **Another file duplicates responsibility**: NO

### src/renderer/js/app.js
- **Exists locally**: YES
- **Tracked at local HEAD**: YES
- **Present in canonical GitHub base**: YES
- **Present at PR #2 head**: YES
- **Git status code**: M (Modified)
- **Ignored**: NO
- **SHA256**: 95BAE3351D9437C5B1F8ADE173200996738F6C4785A1DBBE6F6C8563614D0ED4
- **Actual responsibility**: Constructs Pipeline 1 `ai_config` payload and duplicates settings DOM element mapping.
- **Another file duplicates responsibility**: YES (settings.js duplicates persistence logic)

### src/renderer/js/api.js
- **Exists locally**: YES
- **Tracked at local HEAD**: YES
- **Present in canonical GitHub base**: YES
- **Present at PR #2 head**: YES
- **Git status code**: M (Modified)
- **Ignored**: NO
- **SHA256**: 485CEC25E950A61B3858D0B06AF1488402BAA066AC94CD3269903AC25AA39664
- **Actual responsibility**: Frontend-to-backend API wrappers.
- **Another file duplicates responsibility**: NO

### src/renderer/js/components/settings.js
- **Exists locally**: YES
- **Tracked at local HEAD**: NO
- **Present in canonical GitHub base**: NO
- **Present at PR #2 head**: NO
- **Git status code**: ?? (Untracked)
- **Ignored**: NO
- **SHA256**: 40D845884D896A58A4D9D89EF7A755D53DC8373361D5604F645C7BDCD9DCC130
- **Actual responsibility**: Core settings event binding and `localStorage` persistence.
- **Another file duplicates responsibility**: YES (`app.js` reads/writes these values in some places too).

### src/renderer/js/pipelines/pipeline2-remove.js
- **Exists locally**: YES
- **Tracked at local HEAD**: NO
- **Present in canonical GitHub base**: NO
- **Present at PR #2 head**: NO
- **Git status code**: ?? (Untracked)
- **Ignored**: NO
- **SHA256**: 0B83DD7748FE800EAFF9E53D49485D5BC0F8776DA5A13747E49C3B7C8AD44850
- **Actual responsibility**: Pipeline 2 execution.
- **Another file duplicates responsibility**: NO

### api/server.py
- **Exists locally**: YES
- **Tracked at local HEAD**: YES
- **Present in canonical GitHub base**: YES
- **Present at PR #2 head**: YES
- **Git status code**: M (Modified)
- **Ignored**: NO
- **SHA256**: 0D3212626B0121E3D316B7128D0345817039128D2781B1017053F5DEB9098287
- **Actual responsibility**: Backend API definitions and `ai_config` consumption.
- **Another file duplicates responsibility**: NO

## Explicit Answers
**Is local HEAD exactly d67a427f1c90a2e98da560977736ead80637db3a?**
YES.

**Is settings.js tracked, untracked, ignored or absent?**
It is untracked (`??`).

**Is pipeline2-remove.js tracked, untracked, ignored or absent?**
It is untracked (`??`).

**Why did the previous preflight classify both as “Modified” and “GitHub Base: Yes”?**
The previous preflight falsely assumed they were tracked modified files based on a simplified reading of a previous context, instead of running exact status commands against the git staging/tracking index.

**Is api.js modified locally, and why was it omitted from Current Source Map?**
Yes, it is modified locally (status `M`). It was omitted previously because it didn't surface in a superficial AI settings symbol search during the previous turn, despite containing API wrappers that pass `ai_config`.

**Which file actually owns AI settings persistence?**
`src/renderer/js/components/settings.js` primarily sets persistence, but `src/renderer/js/app.js` currently duplicates loading from `localStorage`.

**Which file actually owns provider-change event binding?**
`src/renderer/js/components/settings.js`.

**Which file constructs the Pipeline 1 ai_config payload?**
`src/renderer/js/app.js`.

**Does any current Pipeline 2 file read AI provider, key, endpoint or model?**
Yes, the untracked `src/renderer/js/pipelines/pipeline2-remove.js` directly calls `localStorage.getItem('ai_provider')`, `ai_api_key`, and `ai_endpoint` on lines 7-9.

**Can future implementation hunks be isolated without staging unrelated RECOVERY-007 work?**
Because `settings.js` and `pipeline2-remove.js` are currently completely untracked, any attempt to `git add` them will add the entire file, which may include dirty work from other tasks (like P2 stuff) that aren't on GitHub. To safely isolate changes, we either need to selectively add hunks or use separate files.
