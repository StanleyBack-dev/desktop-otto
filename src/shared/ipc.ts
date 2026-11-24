// The contract between the screens (renderer) and the Node side (main):
// channel names and the API the preload exposes as `window.otto`.

export const IPC = {
  appInfo: "app:info",
  autostartGet: "autostart:get",
  autostartSet: "autostart:set",
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
}
