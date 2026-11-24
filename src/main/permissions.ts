import { session } from "electron";

// The only permission Otto's screens get is the microphone (to ask by
// voice), and only for the app's own pages. Everything else is denied.
export function restrictPermissions(isAppPage: (url: string) => boolean): void {
  const allowed = (permission: string, url: string) =>
    permission === "media" && isAppPage(url);

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const audioOnly =
        permission !== "media" ||
        !details ||
        !("mediaTypes" in details) ||
        (details.mediaTypes ?? []).every((type) => type === "audio");
      callback(
        audioOnly &&
          allowed(permission, details?.requestingUrl ?? webContents.getURL()),
      );
    },
  );
  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission, requestingOrigin) =>
      allowed(permission, requestingOrigin),
  );
}
