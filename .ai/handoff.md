# Handoff

## RECOVERY-007E-PIPELINE1-JOB-MODEL-VOICE-RUNTIME-FIX-024
The application has been repaired to securely handle Pipeline 1 per-job state.
pp.js and pipeline1-ai.js now read job-specific properties (p1AiModel, p1TtsVoice, p1TtsSpeed).
Models are dynamically listed inside the UI on the iModelChanged event instead of collapsing to a single option.
Mojibake in the renderer UI label has been fixed.
The unhandledrejection trace has been enriched with stack traces and state is not defined crashes mitigated by protecting against uninitialized job data.
	k-job-card has been introduced into main.css.
15 runtime assertions execute natively using node against the source strings and successfully PASS.

Pending tasks:
1. Owner to run application in production environment to manually verify state is not defined is gone and job model selection is operational.
2. PM to review PR.
