import { app } from "electron";
import { join } from "path";

// Files shipped next to the app: resources/ in development, the installed
// resources folder in the packaged app.
export function resourcePath(file: string): string {
  return app.isPackaged
    ? join(process.resourcesPath, file)
    : join(app.getAppPath(), "resources", file);
}
