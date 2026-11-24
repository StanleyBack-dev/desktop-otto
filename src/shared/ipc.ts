// The contract between the screens (renderer) and the Node side (main):
// channel names and the API the preload exposes as `window.otto`.
import type {
  AskRequest,
  AskResult,
  VoiceAskRequest,
  VoiceSettings,
} from "./assistant";
import type { LoginRequest, LoginResult, SessionState } from "./session";

export const IPC = {
  appInfo: "app:info",
  autostartGet: "autostart:get",
  autostartSet: "autostart:set",
  sessionGet: "session:get",
  sessionLogin: "session:login",
  sessionLogout: "session:logout",
  /** main → renderer: the session changed. */
  sessionChanged: "session:changed",
  assistantAsk: "assistant:ask",
  assistantAskByVoice: "assistant:ask-by-voice",
  voiceSettings: "assistant:voice-settings",
  /** main → renderer: the global shortcut was pressed. */
  focusQuestion: "ui:focus-question",
  /** main → renderer: the talk shortcut was pressed. */
  startListening: "ui:start-listening",
} as const;

export type AppInfo = {
  name: string;
  version: string;
  /** "win32", "darwin"… */
  platform: string;
  /** Global shortcut that opens the question box (e.g. Ctrl+Shift+Space). */
  askShortcut: string | null;
  /** Global shortcut to ask by voice (e.g. Ctrl+Shift+O). */
  talkShortcut: string | null;
};

export interface OttoBridge {
  app: {
    info(): Promise<AppInfo>;
    /** The global shortcut was pressed. Returns the unsubscribe function. */
    onFocusQuestion(listener: () => void): () => void;
    /** The talk shortcut was pressed. */
    onStartListening(listener: () => void): () => void;
  };
  autostart: {
    /** Starts with Windows (minimized to the notification area). */
    get(): Promise<boolean>;
    set(enabled: boolean): Promise<boolean>;
  };
  session: {
    get(): Promise<SessionState>;
    login(request: LoginRequest): Promise<LoginResult>;
    logout(): Promise<void>;
    /** Returns the unsubscribe function. */
    onChange(listener: (state: SessionState) => void): () => void;
  };
  assistant: {
    ask(request: AskRequest): Promise<AskResult>;
    askByVoice(request: VoiceAskRequest): Promise<AskResult>;
    voiceSettings(): Promise<VoiceSettings>;
  };
}
