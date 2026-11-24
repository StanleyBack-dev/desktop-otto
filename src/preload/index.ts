import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { AskResult, VoiceSettings } from "@shared/assistant";
import { IPC, type AppInfo, type OttoBridge } from "@shared/ipc";
import type { LoginResult, SessionState } from "@shared/session";
import type { WakeEvent, WakeStatus } from "@shared/wake";
import type { Briefing } from "@shared/briefing";

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
    setWakeWord: (enabled) =>
      ipcRenderer.invoke(IPC.setWakeWordSetting, enabled) as Promise<boolean>,
  },
  account: {
    settings: () => ipcRenderer.invoke(IPC.accountSettings),
    updateSettings: (change) =>
      ipcRenderer.invoke(IPC.accountUpdateSettings, { ...change }),
    updateName: (name) => ipcRenderer.invoke(IPC.accountUpdateName, name),
    searchPlaces: (name) => ipcRenderer.invoke(IPC.accountSearchPlaces, name),
    setLocation: (place) =>
      ipcRenderer.invoke(IPC.accountSetLocation, { ...place }),
    newsSources: () => ipcRenderer.invoke(IPC.accountNewsSources),
    suggestedNewsSources: () => ipcRenderer.invoke(IPC.accountSuggestedSources),
    addNewsSource: (source) =>
      ipcRenderer.invoke(IPC.accountAddSource, { ...source }),
    updateNewsSource: (change) =>
      ipcRenderer.invoke(IPC.accountUpdateSource, { ...change }),
    removeNewsSource: (id) => ipcRenderer.invoke(IPC.accountRemoveSource, id),
  },
  today: {
    weather: () => ipcRenderer.invoke(IPC.todayWeather),
    agenda: () => ipcRenderer.invoke(IPC.todayAgenda),
    news: () => ipcRenderer.invoke(IPC.todayNews),
  },
  briefing: {
    today: () => ipcRenderer.invoke(IPC.briefingToday) as Promise<Briefing>,
    regenerate: () =>
      ipcRenderer.invoke(IPC.briefingRegenerate) as Promise<Briefing>,
    onPresented: (listener) =>
      on<[Briefing]>(IPC.briefingPresented, (briefing) => listener(briefing)),
  },
  wake: {
    enable: (name) =>
      ipcRenderer.invoke(IPC.wakeEnable, name) as Promise<WakeStatus>,
    disable: () => ipcRenderer.invoke(IPC.wakeDisable) as Promise<WakeStatus>,
    status: () => ipcRenderer.invoke(IPC.wakeStatus) as Promise<WakeStatus>,
    sendAudio: (samples) => ipcRenderer.send(IPC.wakeAudio, samples),
    setPaused: (paused) => ipcRenderer.send(IPC.wakePause, paused),
    onHeard: (listener) =>
      on<[WakeEvent]>(IPC.wakeHeard, (event) => listener(event)),
    onStatus: (listener) =>
      on<[WakeStatus]>(IPC.wakeStatusChanged, (status) => listener(status)),
  },
};

contextBridge.exposeInMainWorld("otto", otto);
