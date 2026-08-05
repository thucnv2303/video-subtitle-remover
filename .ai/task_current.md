# Current Task

## Task ID
RECOVERY-007E-AI-SETTINGS-001

## Name
IMPLEMENT PROVIDER KEYS AND OLLAMA MODEL DISCOVERY

## Status
WAITING_REVIEW

## Purpose
Separate provider credentials from model selection, discover installed Ollama models, route Ollama through the Electron preload bridge, and prevent Pipeline 2 from receiving AI configuration.

## Review target
- Draft PR: #8
- Base SHA: `7e18c04cf2483403010f237356dfb7f369dae1a8`
- Review branch: `review/RECOVERY-007E-AI-SETTINGS-001-ai-settings`
- Current source head: `e3d5615a58680a05e41bc1a380258ff6ab4ff157`
- Source commits: `03f07892fba09d9db276641d5e745ffc6ef25689`, `6b1a04e631cbcd273375c1ddca636a7e6b1091ac`, `e3d5615a58680a05e41bc1a380258ff6ab4ff157`

## Acceptance coverage
- Cloud keys and provider model are separate values.
- Ollama has endpoint/model controls and no API-key entry.
- Ollama models can be scanned, selected or entered manually.
- Ollama connection can be tested through the preload bridge.
- Pipeline 1 sends Ollama `model` as a model field.
- Pipeline 2 transport removes `ai_config`, provider, keys, model and endpoint.
- Pipeline 2 forces `ai_rewrite=false` and `tts_voice=none`.
- Pipeline 1 does not remove subtitles or render final video.
- Existing voice-clone preview and auto-selection behavior is retained.

## Verification
- `node --check` PASS: preload.js, settings.js, pipeline1-ai.js.
- Source scope: exactly three source files.
- Secret scan: no embedded key/token value found.
- Runtime app verification: NOT STARTED.

## Tracking
- BUG-008/BUG-009: CANDIDATE FIX — OWNER TEST PENDING
- Owner test: BLOCKED until code review PASS
- Merge: BLOCKED

## Verification gates
- Execution: PASS — implementation published to Draft PR #8
- Automated verification: PASS — static syntax and source-scope checks
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED
