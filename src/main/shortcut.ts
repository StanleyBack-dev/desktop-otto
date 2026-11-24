import { BrowserWindow, globalShortcut } from "electron";
import { IPC } from "@shared/ipc";
import { showMainWindow } from "./window";

export const ASK_SHORTCUT = "CommandOrControl+Shift+Space";

// From anywhere in Windows: brings Otto up with the question box focused.
export function registerAskShortcut(): boolean {
  return globalShortcut.register(ASK_SHORTCUT, () => {
    showMainWindow();
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IPC.focusQuestion);
    }
  });
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
