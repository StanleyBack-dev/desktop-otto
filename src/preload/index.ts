import { contextBridge, ipcRenderer } from "electron";
import { IPC, type AppInfo, type OttoBridge } from "@shared/ipc";

// The only door from the screens to the Node side: a few typed calls, no
// raw ipcRenderer.
const otto: OttoBridge = {
  app: {
    info: () => ipcRenderer.invoke(IPC.appInfo) as Promise<AppInfo>,
  },
  autostart: {
    get: () => ipcRenderer.invoke(IPC.autostartGet) as Promise<boolean>,
    set: (enabled) =>
      ipcRenderer.invoke(IPC.autostartSet, enabled) as Promise<boolean>,
  },
};

contextBridge.exposeInMainWorld("otto", otto);
