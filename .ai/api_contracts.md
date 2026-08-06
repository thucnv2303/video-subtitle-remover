# API Contracts

## DeepSeek Provider Contracts

### Model Discovery
Request:
  GET https://api.deepseek.com/models
  Authorization: Bearer <decrypted_key>

Response (200):
  { data: [ { id: string }, ... ] }
  models = data.map(m => m.id)

Failure (401, 403):
  Key invalid or unauthorized. Do not store key.

### Rewrite / Chat Completion
Request:
  POST https://api.deepseek.com/chat/completions
  Authorization: Bearer <decrypted_key>
  Content-Type: application/json

Body:
  {
    model: string,
    messages: [
      { role: system, content: prompt },
      { role: user, content: srt_content }
    ],
    stream: false
  }

Response (200):
  { choices: [ { message: { content: string } } ] }
  result = choices[0].message.content

Failure:
  error.message returned from provider. Key not exposed in error.

Key rotation:
  Bounded retry across stored valid keys (max 3 attempts).
  No infinite retry.

## Gemini Provider Contracts

### Model Discovery
Request:
  GET https://generativelanguage.googleapis.com/v1beta/models?key=<decrypted_key>

Response (200 - valid):
  { models: [ { name: string, supportedGenerationMethods: [...] } ] }
  Filter by supportedGenerationMethods includes generateContent.
  Returns flat string[] of model IDs (e.g. ['gemini-1.5-flash', 'gemini-1.5-pro']).
  Invalid JSON -> validation error (rejected).
  Missing models array -> validation error (rejected).
  No compatible models -> controlled rejection:
    Error: 'API key được xác thực nhưng không có model generateContent tương thích.'
  No hardcoded fallback model list. No structured {verified,models} object returned.

NOTE: Key is in URL query string. Do not log the URL.

### Rewrite / Generate Content
Request:
  POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=<decrypted_key>
  Content-Type: application/json

Body:
  {
    system_instruction: { parts: { text: prompt } },
    contents: [ { parts: [{ text: srt_content }] } ]
  }

Response (200):
  { candidates: [ { content: { parts: [ { text: string } ] } } ] }
  result = candidates[0].content.parts[0].text

## Ollama Provider Contracts (unchanged)

Model discovery:
  GET <endpoint>/api/tags

Chat:
  POST <endpoint>/api/chat
  Body: { model, messages, stream: false }

## Renderer aiRewrite Payload Contract
Payload sent from renderer to main process (IPC: ai:rewrite):
  {
    provider: string,   // deepseek | gemini
    model:    string,
    prompt:   string,
    srt_content: string
  }

No API key field in payload.
No url field in payload.

## safeStorage Contract
- safeStorage.isEncryptionAvailable() must return true before any key operation.
- Encrypt: safeStorage.encryptString(plaintext) -> Buffer -> hex string.
- Decrypt: safeStorage.decryptString(Buffer.from(hex, hex)) -> plaintext.
- Storage: app.getPath(userData)/ai_keys.json as JSON { provider: [hex, ...] }.
- ENOENT with no recovery artifact returns empty store {}.
- Invalid JSON, invalid shape or invalid ciphertext fails closed (throws, does not return {}).
- Valid backup (ai_keys.json.bak) may be restored through deterministic crash recovery (recoverKeyStore).
- Ambiguous recovery state (e.g. all three files corrupt, or keys missing with only tmp) returns a controlled error and preserves all artifacts.
- Write errors propagate as IPC error response with typed error code (WRITE_FAILED, RESTORE_FAILED, STORE_CORRUPT).
- Key values are never logged.
