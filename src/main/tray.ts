import { app, Menu, nativeImage, Tray } from "electron";
import { isAutostartEnabled, setAutostart } from "./autostart";
import { resourcePath } from "./resources";
import { showMainWindow } from "./window";

let tray: Tray | null = null;

// The Otto icon in the notification area: open, start with Windows, quit.
export function createTray(): Tray {
  tray = new Tray(nativeImage.createFromPath(resourcePath("tray.png")));
  tray.setToolTip("Otto");
  tray.on("click", () => showMainWindow());
  refreshTrayMenu();
  return tray;
}

export function refreshTrayMenu(): void {
  tray?.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Abrir o Otto", click: () => showMainWindow() },
      { type: "separator" },
      {
        label: "Iniciar com o Windows",
        type: "checkbox",
        checked: isAutostartEnabled(),
        enabled: app.isPackaged,
        click: (item) => {
          setAutostart(item.checked);
          refreshTrayMenu();
        },
      },
      { type: "separator" },
      { label: "Sair", click: () => app.quit() },
    ]),
  );
}
