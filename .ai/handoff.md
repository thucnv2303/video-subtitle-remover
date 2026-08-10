# AgentOS Handoff Status

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
- Canonical task base: `dd520054b385ae18b8154b7c897eb9baad7eac02`.

## Active task
`BUG-005 — Pipeline 1 Full Processing Chain`

## Status
WAITING_OWNER_RETEST — MULTIMODAL REVISION

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Previous candidate
Owner runtime FAIL remains authoritative for the previous text-only candidate: wrong ASR content, no original-video visual analysis, hidden generated TTS audio, and premature P2 unlock.

## Revised candidate
- ASR language is forced to auto for P1 Start.
- Original-video keyframes + transcript feed a local Ollama multimodal analysis path.
- Selected model is used directly when vision-capable; otherwise an installed local vision-capable model may provide visual context to the selected reasoning model.
- No vision model => P1 fails closed; P2 remains locked.
- Structured summary/insights/scenes/timed remix script/edit plan are required.
- JSON/SRT artifacts are persisted under `jobs/<job_id>/p1/` with source SHA256 fingerprint + video metadata.
- TTS audio is copied from temp to durable `voice.*` in the same P1 artifact directory; `tts_timed.srt` is persisted.
- Running P1 Job owns both P1 selection and legacy active selection, fixing detail text/audio/status mismatch.
- `p1ArtifactsReady` and the artifact guard prevent false legacy completion from unlocking P2.
- Approved UI and P2/P3 product source remain unchanged.

## Review evidence
- Exact published JS equivalents: syntax PASS + Git blob hash match.
- Run-config ASR-auto/multimodal snapshot: PASS.
- Direct vision-model path: PASS.
- Separate local vision fallback: PASS.
- No-vision fail-closed path: PASS.
- Durable TTS artifact copy: PASS.
- False legacy completion relock: PASS.
- GitHub code review: PASS for fresh Owner retest.
- GitHub CI: not configured.

## Known limitation
Fresh retest scope is local Ollama multimodal. Gemini/DeepSeek are blocked in P1 rather than degraded to text-only. Scene understanding uses sampled keyframes + vision reasoning; deterministic CV scene-boundary detection is later work.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for fresh Owner retest.
- Owner manual app verification: previous candidate FAIL; fresh multimodal retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Next action
Owner tests a fresh Job on PR #41. PASS requires meaningful analysis/remix content grounded in the video, visible playable TTS audio, required files under `jobs/<job_id>/p1/`, and P2 unlock only after the artifact gate passes. If no vision-capable Ollama model is installed, the expected result is an explicit P1 error with P2 locked, not false completion.
