// The contract between the screens (renderer) and the Node side (main):
// channel names and the API the preload exposes as `window.otto`.
import type { AskRequest, AskResult, VoiceSettings } from "./assistant";
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
  voiceSettings: "assistant:voice-settings",
  /** main → renderer: the global shortcut was pressed. */
  focusQuestion: "ui:focus-question",
} as const;

export type AppInfo = {
  name: string;
  version: string;
  /** "win32", "darwin"… */
  platform: string;
  /** Global shortcut that opens the question box (e.g. Ctrl+Shift+Space). */
  askShortcut: string | null;
};

export interface OttoBridge {
  app: {
    info(): Promise<AppInfo>;
    /** The global shortcut was pressed. Returns the unsubscribe function. */
    onFocusQuestion(listener: () => void): () => void;
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
    voiceSettings(): Promise<VoiceSettings>;
  };
}
