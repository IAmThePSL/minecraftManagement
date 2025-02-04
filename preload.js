const { contextBridge, ipcRenderer } = require("electron");

// Expose necessary APIs to the renderer process
contextBridge.exposeInMainWorld("electron", {
  startServer: () => ipcRenderer.invoke("start-server"),
  stopServer: () => ipcRenderer.invoke("stop-server"),
  getServerStatus: () => ipcRenderer.invoke("server-status"),
  getFiles: () => ipcRenderer.invoke("get-files"),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
});
