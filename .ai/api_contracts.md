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

Response (200):
  { models: [ { name: string, supportedGenerationMethods: [...] } ] }
  Filter by supportedGenerationMethods includes generateContent.
  Fallback: gemini-1.5-flash, gemini-1.5-pro (if API unavailable or empty).

NOTE: Gemini model discovery via this endpoint is not separately contract-verified.
Manual model entry is supported.

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
- Parse errors return empty object (safe default).
- Write errors propagate as IPC error response.
- Key values are never logged.
