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
  platform: process.platform
});
