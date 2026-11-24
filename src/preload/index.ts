import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { AskResult, VoiceSettings } from "@shared/assistant";
import { IPC, type AppInfo, type OttoBridge } from "@shared/ipc";
import type { LoginResult, SessionState } from "@shared/session";

// Subscribes to a main → renderer event; returns the unsubscribe function.
function on<T extends unknown[]>(
  channel: string,
  listener: (...args: T) => void,
): () => void {
  const handler = (_event: IpcRendererEvent, ...args: unknown[]) =>
    listener(...(args as T));
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

// The only door from the screens to the Node side: a few typed calls, no
// raw ipcRenderer.
const otto: OttoBridge = {
  app: {
    info: () => ipcRenderer.invoke(IPC.appInfo) as Promise<AppInfo>,
    onFocusQuestion: (listener) => on(IPC.focusQuestion, listener),
    onStartListening: (listener) => on(IPC.startListening, listener),
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
    onChange: (listener) =>
      on<[SessionState]>(IPC.sessionChanged, (state) => listener(state)),
  },
  assistant: {
    ask: (request) =>
      ipcRenderer.invoke(IPC.assistantAsk, {
        text: request.text,
        conversationId: request.conversationId,
      }) as Promise<AskResult>,
    askByVoice: (request) =>
      ipcRenderer.invoke(IPC.assistantAskByVoice, {
        audioBase64: request.audioBase64,
        mimeType: request.mimeType,
        conversationId: request.conversationId,
      }) as Promise<AskResult>,
    voiceSettings: () =>
      ipcRenderer.invoke(IPC.voiceSettings) as Promise<VoiceSettings>,
  },
};

contextBridge.exposeInMainWorld("otto", otto);
