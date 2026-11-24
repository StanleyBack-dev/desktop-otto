import { BrowserWindow, globalShortcut } from "electron";
import { IPC } from "@shared/ipc";
import { showMainWindow } from "./window";

// From anywhere in Windows. Each one is optional: another program may own
// the keys, and Otto just shows that the shortcut is unavailable.
const SHORTCUTS = {
  /** Opens Otto with the question box focused. */
  ask: {
    accelerator: "CommandOrControl+Shift+Space",
    label: "Ctrl+Shift+Espaço",
    event: IPC.focusQuestion,
  },
  /** Opens Otto and starts listening ("O" de Otto). */
  talk: {
    accelerator: "CommandOrControl+Shift+O",
    label: "Ctrl+Shift+O",
    event: IPC.startListening,
  },
} as const;

export type ShortcutLabels = { ask: string | null; talk: string | null };

export function registerShortcuts(): ShortcutLabels {
  const register = (shortcut: (typeof SHORTCUTS)[keyof typeof SHORTCUTS]) =>
    globalShortcut.register(shortcut.accelerator, () => {
      showMainWindow();
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(shortcut.event);
      }
    })
      ? shortcut.label
      : null;
  return { ask: register(SHORTCUTS.ask), talk: register(SHORTCUTS.talk) };
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
