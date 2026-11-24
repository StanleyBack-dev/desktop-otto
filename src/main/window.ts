import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { resourcePath } from "./resources";

let window: BrowserWindow | null = null;
let quitting = false;

app.on("before-quit", () => {
  quitting = true;
});

// The single Otto window. Closing it only hides it: Otto keeps running in
// the notification area, listening.
export function createMainWindow(options: { show: boolean }): BrowserWindow {
  window = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 360,
    minHeight: 480,
    show: false,
    title: "Otto",
    icon: resourcePath("icon.png"),
    autoHideMenuBar: true,
    backgroundColor: "#0b1120",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // The microphone keeps streaming to the name listener while the
      // window is hidden in the notification area.
      backgroundThrottling: false,
    },
  });

  window.on("ready-to-show", () => {
    if (options.show) window?.show();
  });
  window.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      window?.hide();
    }
  });

  // Links open in the browser, never inside Otto.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event) => event.preventDefault());

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && devUrl) void window.loadURL(devUrl);
  else void window.loadFile(join(__dirname, "../renderer/index.html"));
  return window;
}

/** focus: false shows Otto without taking the keyboard from the app in use. */
export function showMainWindow(options: { focus?: boolean } = {}): void {
  if (!window) return;
  if (window.isMinimized()) window.restore();
  if (options.focus === false) {
    if (!window.isVisible()) window.showInactive();
    return;
  }
  window.show();
  window.focus();
}
