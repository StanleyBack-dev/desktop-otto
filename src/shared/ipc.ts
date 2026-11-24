// The contract between the screens (renderer) and the Node side (main):
// channel names and the API the preload exposes as `window.otto`.
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
} as const;

export type AppInfo = {
  name: string;
  version: string;
  /** "win32", "darwin"… */
  platform: string;
};

export interface OttoBridge {
  app: {
    info(): Promise<AppInfo>;
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
}
