import type { AppInfo } from "@shared/ipc";

// App-level calls to the Node side, through the preload bridge.
export const systemClient = {
  info: (): Promise<AppInfo> => window.otto.app.info(),
  autostart: (): Promise<boolean> => window.otto.autostart.get(),
  setAutostart: (enabled: boolean): Promise<boolean> =>
    window.otto.autostart.set(enabled),
};
