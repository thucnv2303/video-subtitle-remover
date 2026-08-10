# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
WAITING_OWNER_TEST

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
Make the approved Pipeline 1 Start flow execute the enabled chain correctly:
`ASR → AI Rewrite → TTS → P1 COMPLETE → P2 READY`.

## Root cause
1. Approved P1 UI no longer has legacy `chk-ai-rewrite` / `chk-tts-generate` controls.
2. Job defaults remain `aiRewrite=false`, `ttsGenerate=false`.
3. Start All did not map provider/model/prompt/voice UI state into the jobs, so AI and TTS were skipped.
4. AI/TTS helper failures were logged and swallowed, so an enabled-stage failure could still end in P1 `finished`.

## Candidate source scope
- `src/renderer/js/pipeline1-run-config.js` — new run-configuration bridge.
- `src/renderer/js/pipelines/pipeline1-ai.js` — strict enabled-stage success/failure contract.

## Required behavior
- Approved P1 UI stays unchanged.
- Start validates and snapshots the visible provider/model/prompt/voice configuration before jobs enter the P1 queue.
- AI Rewrite is part of the approved P1 Start chain.
- TTS runs when the user selected a voice; `none` intentionally disables TTS.
- Cloud provider requires its provider-specific key list; Ollama requires model/prompt but not a cloud API key.
- Any enabled AI/TTS error must fail P1.
- P1 failure/cancel must keep P2 locked via the already accepted handoff gate.
- Only successful completion of all enabled P1 stages may unlock P2.
- P1 must not remove subtitles or render video.

## Verification
- `pipeline1-run-config.js` Git blob: `a26dc1230a91c252ce49139772b2b4afffde7c6f`; exact reconstructed hash match + `node --check` PASS.
- `pipeline1-ai.js` Git blob: `12859d4e40d84c716a479820610fef2fe692bd37`; exact reconstructed hash match + `node --check` PASS.
- Targeted simulation: PASS for valid config snapshot, strict AI failure rejection, strict TTS failure rejection.
- PR #41 base/head/scope verified directly from GitHub.
- Net product source diff against canonical: exactly two files listed above.
- No approved UI source changes.
- No P2/P3 product source changes.
- GitHub CI: not configured; PR comments: none unresolved.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for Owner runtime test.
- Owner manual app verification: NOT STARTED / AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Owner test
With a valid provider/model/prompt and selected voice:
1. add a fresh P1 job;
2. Start must log the run configuration;
3. ASR must succeed;
4. AI Rewrite must actually run and produce rewritten content;
5. TTS must actually run and produce playable audio;
6. only then may P1 become complete and P2 become ready;
7. a deliberate AI/TTS failure must leave P1 in error and P2 locked.
