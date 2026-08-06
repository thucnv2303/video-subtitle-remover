# Runtime Field Contract

## 1. aiModel / p1AiModel
- **UI Path (app.js):** Reads/writes job.aiModel upon Job selection.
- **Execution Path (pipeline1-ai.js):** 	riggerAutoAiRewrite reads exclusively from localStorage.getItem('ai_provider') and localStorage.getItem(\i_model_\\). It completely ignores job.aiModel.
- **Verdict:** MISMATCH. The per-job AI model selection is cosmetically saved but ignored during actual AI execution.

## 2. ttsVoice / p1TtsVoice
- **UI Path (app.js):** Reads/writes job.ttsVoice.
- **Execution Path (pipeline1-ai.js):** 	riggerAutoTts correctly prioritizes job.ttsVoice via const voice = job.ttsVoice || localStorage.getItem('tts_voice') || 'none'; and passes it in the payload.
- **Verdict:** MATCH.

## 3. ttsSpeed / p1TtsSpeed
- **UI Path (app.js):** Reads/writes job.ttsSpeed natively via my added patch.
- **Execution Path (pipeline1-ai.js):** 	riggerAutoTts does not read job.ttsSpeed or transmit a speed parameter to /api/tts-retry.
- **Verdict:** MISMATCH. Per-job speed is saved but ignored by the execution engine.

**Conclusion:**
Per-job execution is currently INCOMPLETE because pipeline1-ai.js ignores the locally cached job.aiModel and job.ttsSpeed values, falling back to globals or ignoring them entirely.
