import { app, safeStorage } from "electron";
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { SessionStore } from "./session-store";

// The session file lives in the Windows user's AppData, encrypted with
// DPAPI: another user or another PC cannot read it.
export function createSessionStore(): SessionStore {
  const path = join(app.getPath("userData"), "session.bin");
  return new SessionStore(
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (text) => safeStorage.encryptString(text),
      decrypt: (data) => safeStorage.decryptString(data),
    },
    {
      read: () => (existsSync(path) ? readFileSync(path) : null),
      write: (data) => writeFileSync(path, data, { mode: 0o600 }),
      remove: () => rmSync(path, { force: true }),
    },
  );
}
