import { app, BrowserWindow } from "electron";
import { existsSync, writeFileSync } from "fs";
import { hostname } from "os";
import { join } from "path";
import { IPC } from "@shared/ipc";
import { wasStartedHidden } from "@shared/launch-args";
import { GraphqlClient } from "./api/graphql-client";
import { AssistantService } from "./assistant/assistant.service";
import { enableAutostartOnFirstRun } from "./autostart";
import { loadConfig } from "./config";
import { registerIpc } from "./ipc";
import { createSessionStore } from "./session/electron-session-store";
import { SessionService } from "./session/session.service";
import { registerAskShortcut, unregisterShortcuts } from "./shortcut";
import { createTray } from "./tray";
import { createMainWindow, showMainWindow } from "./window";

// One Otto per Windows session: a second launch only shows the window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setAppUserModelId("dev.stanleyrodrigues.otto");
  app.on("second-instance", showMainWindow);

  void app.whenReady().then(async () => {
    const marker = join(app.getPath("userData"), ".first-run-done");
    const firstRun = app.isPackaged && !existsSync(marker);
    enableAutostartOnFirstRun(firstRun);
    if (firstRun) writeFileSync(marker, new Date().toISOString());

    const config = loadConfig();
    const session = new SessionService(
      new GraphqlClient(config.apiUrl, config.clientApiKey),
      createSessionStore(),
      { name: hostname().slice(0, 60) || "PC", platform: platformOf() },
    );
    session.onChange((state) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(IPC.sessionChanged, state);
      }
    });

    const askShortcut = registerAskShortcut() ? "Ctrl+Shift+Espaço" : null;
    registerIpc({
      session,
      assistant: new AssistantService(session),
      askShortcut,
    });
    createTray();
    const startedHidden = wasStartedHidden(process.argv);
    createMainWindow({ show: !startedHidden });

    const state = await session.restore();
    // Signed out at start-up: show the login even when started hidden.
    if (state.status === "signed-out" && startedHidden) showMainWindow();
  });

  app.on("will-quit", unregisterShortcuts);

  // Closing the window keeps Otto in the notification area.
  app.on("window-all-closed", () => undefined);
}

function platformOf(): "WINDOWS" | "MACOS" | "LINUX" {
  if (process.platform === "darwin") return "MACOS";
  if (process.platform === "linux") return "LINUX";
  return "WINDOWS";
}
