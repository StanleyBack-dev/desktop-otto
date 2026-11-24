import { app, ipcMain } from "electron";
import { IPC, type AppInfo } from "@shared/ipc";
import { isAutostartEnabled, setAutostart } from "./autostart";
import { refreshTrayMenu } from "./tray";

// What the screens may ask the Node side. Every handler validates its input:
// the renderer is treated as untrusted.
export function registerIpc(): void {
  ipcMain.handle(IPC.appInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
  }));
  ipcMain.handle(IPC.autostartGet, () => isAutostartEnabled());
  ipcMain.handle(IPC.autostartSet, (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") return isAutostartEnabled();
    const result = setAutostart(enabled);
    refreshTrayMenu();
    return result;
  });
}
