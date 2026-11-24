import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { IPC, type AppInfo, type OttoBridge } from "@shared/ipc";
import type { LoginResult, SessionState } from "@shared/session";

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
  session: {
    get: () => ipcRenderer.invoke(IPC.sessionGet) as Promise<SessionState>,
    login: (request) =>
      ipcRenderer.invoke(IPC.sessionLogin, {
        email: request.email,
        password: request.password,
      }) as Promise<LoginResult>,
    logout: () => ipcRenderer.invoke(IPC.sessionLogout) as Promise<void>,
    onChange: (listener) => {
      const handler = (_event: IpcRendererEvent, state: SessionState) =>
        listener(state);
      ipcRenderer.on(IPC.sessionChanged, handler);
      return () => ipcRenderer.off(IPC.sessionChanged, handler);
    },
  },
};

contextBridge.exposeInMainWorld("otto", otto);
