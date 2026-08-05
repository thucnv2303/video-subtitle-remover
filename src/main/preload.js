const { contextBridge, ipcRenderer } = require('electron');
const http = require('http');
const https = require('https');
const { URL } = require('url');

function normalizeOllamaChatEndpoint(endpoint) {
  let value = String(endpoint || '').trim() || 'http://localhost:11434/api/chat';
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `http://${value}`;
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Ollama endpoint chỉ hỗ trợ http hoặc https.');
  }
  let pathname = parsed.pathname.replace(/\/+$/, '');
  if (!pathname || pathname === '/') pathname = '/api/chat';
  else if (pathname.endsWith('/api/tags')) pathname = pathname.slice(0, -9) + '/api/chat';
  else if (!pathname.endsWith('/api/chat')) pathname = pathname.endsWith('/api') ? `${pathname}/chat` : `${pathname}/api/chat`;
  parsed.pathname = pathname;
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function requestJson(urlValue, { method = 'GET', body = null, timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(urlValue); }
    catch { reject(new Error('Endpoint không hợp lệ.')); return; }

    const transport = parsed.protocol === 'https:' ? https : http;
    const payload = body == null ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const request = transport.request(parsed, {
      method,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : undefined,
    }, response => {
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) {
          request.destroy(new Error('Phản hồi Ollama vượt quá giới hạn 2 MB.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data;
        try { data = text ? JSON.parse(text) : {}; }
        catch { reject(new Error(`Ollama trả về JSON không hợp lệ (HTTP ${response.statusCode || 0}).`)); return; }
        if ((response.statusCode || 500) >= 400) {
          reject(new Error(data.error || `Ollama HTTP ${response.statusCode}`));
          return;
        }
        resolve(data);
      });
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error('Ollama request timeout.')));
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function listOllamaModels(endpoint) {
  try {
    const chatEndpoint = normalizeOllamaChatEndpoint(endpoint);
    const tagsEndpoint = chatEndpoint.replace(/\/api\/chat$/, '/api/tags');
    const data = await requestJson(tagsEndpoint, { timeoutMs: 8000 });
    const models = Array.isArray(data.models) ? data.models.map(item => item?.name || item?.model).filter(Boolean) : [];
    return { status: 'ok', endpoint: chatEndpoint, models: [...new Set(models)] };
  } catch (error) {
    return { status: 'error', error: error.message, models: [] };
  }
}

async function ollamaChat(payload = {}) {
  try {
    const model = String(payload.model || '').trim();
    if (!model) throw new Error('Chưa chọn model Ollama.');
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    if (messages.length === 0) throw new Error('Nội dung gửi Ollama đang trống.');
    const endpoint = normalizeOllamaChatEndpoint(payload.endpoint);
    const data = await requestJson(endpoint, {
      method: 'POST',
      body: { model, messages, stream: false },
      timeoutMs: 120000,
    });
    const result = data?.message?.content;
    if (!result) throw new Error('Ollama không trả về nội dung.');
    return { status: 'ok', result, endpoint, model };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: filters => ipcRenderer.invoke('dialog:openFile', filters),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: defaultPath => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  startPython: () => ipcRenderer.invoke('python:start'),
  stopPython: () => ipcRenderer.invoke('python:stop'),
  getPythonStatus: () => ipcRenderer.invoke('python:status'),
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  listOllamaModels,
  ollamaChat,
  onPythonLog: callback => ipcRenderer.on('python:log', (event, message) => callback(message)),
  onPythonError: callback => ipcRenderer.on('python:error', (event, message) => callback(message)),
  platform: process.platform
});
