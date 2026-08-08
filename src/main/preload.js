const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  startPython: () => ipcRenderer.invoke('python:start'),
  stopPython: () => ipcRenderer.invoke('python:stop'),
  getPythonStatus: () => ipcRenderer.invoke('python:status'),
  openPath: (p) => ipcRenderer.invoke('app:openPath', p),
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  onPythonLog: (callback) => ipcRenderer.on('python:log', (e, msg) => callback(msg)),
  onPythonError: (callback) => ipcRenderer.on('python:error', (e, msg) => callback(msg)),
  platform: process.platform
});
