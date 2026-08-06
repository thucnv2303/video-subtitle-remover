const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: filters => ipcRenderer.invoke('dialog:openFile', filters),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: defaultPath => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  startPython: () => ipcRenderer.invoke('python:start'),
  stopPython: () => ipcRenderer.invoke('python:stop'),
  getPythonStatus: () => ipcRenderer.invoke('python:status'),
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  listOllamaModels: endpoint => ipcRenderer.invoke('ollama:list-models', endpoint),
  ollamaChat: payload => ipcRenderer.invoke('ollama:chat', payload),
  onPythonLog: callback => ipcRenderer.on('python:log', (event, message) => callback(message)),
  onPythonError: callback => ipcRenderer.on('python:error', (event, message) => callback(message)),
  hasProviderKeys: provider => ipcRenderer.invoke('ai:has-provider-keys', provider),
  deleteProviderKeys: provider => ipcRenderer.invoke('ai:delete-provider-keys', provider),
  saveProviderKeys: (provider, keys) => ipcRenderer.invoke('ai:save-provider-keys', provider, keys),
  testProvider: provider => ipcRenderer.invoke('ai:test-provider', provider),
  aiRewrite: payload => ipcRenderer.invoke('ai:rewrite', payload),
  platform: process.platform
});
