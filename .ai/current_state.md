# Current State

## Status
WAITING_OWNER_RETEST — APPROVED UI + OLLAMA MODEL SCAN — RECOVERY-007E-SETTINGS-V1-001-REV7

## Documentation & Task State
- Canonical product baseline HEAD: `cf20a02f1e7491fddf7f05dab98fae12050460bb`.
- Active task: `RECOVERY-007E-SETTINGS-V1-001-REV7`.
- Draft PR: #38 on `review/RECOVERY-007E-SETTINGS-V1-001-REV7`.
- Owner runtime screenshot on 2026-08-09 confirms the approved-design rebuild UI is visually acceptable.
- Remaining owner-reported defect: Ollama models could not be scanned from the local Ollama runtime.
- Approved Settings architecture remains: overview 2x2 plus dedicated AI & Model, TTS & Giọng đọc, Lưu trữ, and Trạng thái hệ thống views.
- Ollama discovery implementation published through Electron main-process IPC and preload bridge.
- `src/main/main.js` now queries Ollama local `GET /api/tags` through Electron `net.fetch()` and returns installed model names.
- `src/main/preload.js` adds the Ollama model scan UI under the existing Model field when Ollama is selected; manual model entry remains available.
- Ollama discovery is restricted to local loopback endpoints (`localhost`, `127.0.0.1`, `::1`).
- Provider-specific model persistence remains unchanged.
- Pipeline 1/2/3 boundaries are unchanged.
- Owner product retest: AUTHORIZED for Ollama model scanning on the dedicated REV7 test worktree.
- Product merge permission: BLOCKED until owner PASS is recorded and explicit merge approval is given.

## Current branch
review/RECOVERY-007E-SETTINGS-V1-001-REV7
