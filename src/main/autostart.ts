import { app } from "electron";
import { HIDDEN_FLAG } from "@shared/launch-args";

// Starting with Windows: a login item that opens Otto in the notification
// area (no window), so it is ready to listen as soon as the PC is on.
export function isAutostartEnabled(): boolean {
  return app.getLoginItemSettings({ args: [HIDDEN_FLAG] }).openAtLogin;
}

export function setAutostart(enabled: boolean): boolean {
  // In development the login item would point at the dev Electron binary.
  if (!app.isPackaged) return isAutostartEnabled();
  app.setLoginItemSettings({ openAtLogin: enabled, args: [HIDDEN_FLAG] });
  return isAutostartEnabled();
}

/** First run of the installed app: on by default, the point of Otto. */
export function enableAutostartOnFirstRun(firstRun: boolean): void {
  if (firstRun) setAutostart(true);
}
