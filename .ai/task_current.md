# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Approved UI + Ollama Model Discovery

## Status
PASS — READY TO MERGE

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Review state
- Draft PR: #38.
- Approved Settings UI and information architecture are implemented.
- Ollama local model discovery is implemented through Electron IPC and `GET /api/tags`.
- Manual model entry remains supported.
- Provider-specific model/key persistence remains isolated.
- Owner runtime verification on 2026-08-09: PASS.
- Owner explicitly authorized merging Settings in the current interaction.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for available required static checks; no GitHub CI configured.
- Code review: PASS.
- Owner manual app verification: PASS.
- Documentation synchronization: PASS after closeout update.
- Merge permission: APPROVED for PR #38 only, provided GitHub head/source remains unchanged except closeout docs.

## Next task after merge
Rebuild Pipeline 1 UI using the Owner-approved demo dated 2026-08-09. The approved Pipeline 1 demo keeps existing functional contracts while reorganizing the screen into functional zones: AI & Prompt, Giọng đọc & Voice with `Nghe thử giọng`, Job Queue, selected-job detail, actions, and Console/Log. Implementation must start from the merged Settings canonical baseline, not from pre-merge branches.
