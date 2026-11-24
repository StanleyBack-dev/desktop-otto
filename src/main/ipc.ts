import { app, ipcMain } from "electron";
import { IPC, type AppInfo } from "@shared/ipc";
import type { LoginResult } from "@shared/session";
import { isAutostartEnabled, setAutostart } from "./autostart";
import type { SessionService } from "./session/session.service";
import { refreshTrayMenu } from "./tray";

// What the screens may ask the Node side. Every handler validates its input:
// the renderer is treated as untrusted.
export function registerIpc(session: SessionService): void {
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

  ipcMain.handle(IPC.sessionGet, () => session.current());
  ipcMain.handle(
    IPC.sessionLogin,
    (_event, request: unknown): Promise<LoginResult> | LoginResult => {
      const { email, password } = (request ?? {}) as Record<string, unknown>;
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        email.length > 254 ||
        password.length > 200
      ) {
        return {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Informe e-mail e senha." },
        };
      }
      return session.login({ email, password });
    },
  );
  ipcMain.handle(IPC.sessionLogout, () => session.logout());
}
