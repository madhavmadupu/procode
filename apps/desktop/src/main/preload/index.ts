import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("procode", {
  ipc: {
    invoke: (channel: string, payload: unknown) =>
      ipcRenderer.invoke(channel, payload),
    send: (channel: string, payload: unknown) =>
      ipcRenderer.send(channel, payload),
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
  },
  onFileChange: (callback: (change: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, change: unknown) =>
      callback(change);
    ipcRenderer.on("file-change", subscription);
    return () => ipcRenderer.removeListener("file-change", subscription);
  },
  onSettingsChange: (callback: (settings: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, settings: unknown) =>
      callback(settings);
    ipcRenderer.on("settings-change", subscription);
    return () => ipcRenderer.removeListener("settings-change", subscription);
  },
});
