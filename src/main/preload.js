const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  startPython: () => ipcRenderer.invoke('python:start'),
  stopPython: () => ipcRenderer.invoke('python:stop'),
  getPythonStatus: () => ipcRenderer.invoke('python:status'),
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  onPythonLog: (callback) => ipcRenderer.on('python:log', (e, msg) => callback(msg)),
  onPythonError: (callback) => ipcRenderer.on('python:error', (e, msg) => callback(msg)),
  platform: process.platform
});
