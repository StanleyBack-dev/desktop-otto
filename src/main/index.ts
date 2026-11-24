import { app, BrowserWindow, ipcMain, Notification } from "electron";
import { existsSync, writeFileSync } from "fs";
import { hostname } from "os";
import { join } from "path";
import { IPC } from "@shared/ipc";
import { wasStartedHidden } from "@shared/launch-args";
import { GraphqlClient } from "./api/graphql-client";
import { registerAccountIpc } from "./account/account.ipc";
import { TodayService } from "./today/today.service";
import { AccountService } from "./account/account.service";
import { AssistantService } from "./assistant/assistant.service";
import { BriefingScheduler } from "./briefing/briefing-scheduler";
import { BriefingService } from "./briefing/briefing.service";
import { enableAutostartOnFirstRun } from "./autostart";
import { loadConfig } from "./config";
import { registerIpc } from "./ipc";
import { createSessionStore } from "./session/electron-session-store";
import { SessionService } from "./session/session.service";
import { restrictPermissions } from "./permissions";
import { registerShortcuts, unregisterShortcuts } from "./shortcut";
import { resourcePath } from "./resources";
import { createTray } from "./tray";
import { WakeDiagnostics } from "./wake/wake-diagnostics";
import { WakeService } from "./wake/wake.service";
import { createMainWindow, showMainWindow } from "./window";

// Portuguese for the native controls (24 h time fields, dialogs).
app.commandLine.appendSwitch("lang", "pt-BR");

// One Otto per Windows session: a second launch only shows the window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setAppUserModelId("dev.stanleyrodrigues.otto");
  app.on("second-instance", () => showMainWindow());

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

    const broadcast = (channel: string, payload: unknown) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(channel, payload);
      }
    };
    const wake = new WakeService(
      resourcePath("models"),
      (event) => {
        showMainWindow({ focus: false });
        broadcast(IPC.wakeHeard, event);
      },
      (status) => broadcast(IPC.wakeStatusChanged, status),
      app.isPackaged ? null : new WakeDiagnostics(),
    );
    app.on("will-quit", () => wake.disable());

    const briefing = new BriefingService(session);
    const scheduler = new BriefingScheduler(
      briefing,
      join(app.getPath("userData"), "briefing-presented.txt"),
      (today) => {
        broadcast(IPC.briefingPresented, today);
        if (Notification.isSupported()) {
          const notice = new Notification({
            title: "Seu resumo do dia está pronto",
            body: today.text.split(/(?<=[.!?])\s/)[0].slice(0, 180),
            icon: resourcePath("icon.png"),
          });
          notice.on("click", () => showMainWindow());
          notice.show();
        }
      },
      () => session.current().status === "signed-in",
    );
    session.onChange((state) => {
      if (state.status === "signed-in") scheduler.start();
      else scheduler.stop();
    });
    app.on("will-quit", () => scheduler.stop());

    registerAccountIpc(new AccountService(session));
    const today = new TodayService(session);
    ipcMain.handle(IPC.todayWeather, () => today.weather());
    ipcMain.handle(IPC.todayAgenda, () => today.agenda());
    ipcMain.handle(IPC.todayNews, () => today.news());
    restrictPermissions(isAppPage);
    registerIpc({
      session,
      assistant: new AssistantService(session),
      shortcuts: registerShortcuts(),
      wake,
      briefing,
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

/** The app's own screens: the dev server or the bundled files. */
function isAppPage(url: string): boolean {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && devUrl && url.startsWith(new URL(devUrl).origin)) {
    return true;
  }
  return url.startsWith("file://");
}

function platformOf(): "WINDOWS" | "MACOS" | "LINUX" {
  if (process.platform === "darwin") return "MACOS";
  if (process.platform === "linux") return "LINUX";
  return "WINDOWS";
}
