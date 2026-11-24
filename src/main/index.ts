import { app } from "electron";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { wasStartedHidden } from "@shared/launch-args";
import { enableAutostartOnFirstRun } from "./autostart";
import { registerIpc } from "./ipc";
import { createTray } from "./tray";
import { createMainWindow, showMainWindow } from "./window";

// One Otto per Windows session: a second launch only shows the window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setAppUserModelId("dev.stanleyrodrigues.otto");
  app.on("second-instance", showMainWindow);

  void app.whenReady().then(() => {
    const marker = join(app.getPath("userData"), ".first-run-done");
    const firstRun = app.isPackaged && !existsSync(marker);
    enableAutostartOnFirstRun(firstRun);
    if (firstRun) writeFileSync(marker, new Date().toISOString());

    registerIpc();
    createTray();
    createMainWindow({ show: !wasStartedHidden(process.argv) });
  });

  // Closing the window keeps Otto in the notification area.
  app.on("window-all-closed", () => undefined);
}
