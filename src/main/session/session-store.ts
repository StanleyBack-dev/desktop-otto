// What keeps this PC signed in across restarts: the device's refresh token,
// encrypted with the Windows user's key (DPAPI via Electron safeStorage).
// The short-lived access token stays in memory only.
export type StoredSession = {
  deviceId: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: { name: string; email: string };
};

export interface SecretBox {
  isAvailable(): boolean;
  encrypt(text: string): Buffer;
  decrypt(data: Buffer): string;
}

export interface FileStore {
  read(): Buffer | null;
  write(data: Buffer): void;
  remove(): void;
}

export class SessionStore {
  constructor(
    private readonly box: SecretBox,
    private readonly file: FileStore,
  ) {}

  load(): StoredSession | null {
    const data = this.file.read();
    if (!data || !this.box.isAvailable()) return null;
    try {
      const session = JSON.parse(this.box.decrypt(data)) as StoredSession;
      return session.refreshToken && session.deviceId ? session : null;
    } catch {
      // Unreadable (another Windows user, corrupted): start over.
      this.file.remove();
      return null;
    }
  }

  save(session: StoredSession): void {
    // Never write a token in plain text: without encryption the session
    // only lives until Otto closes.
    if (!this.box.isAvailable()) return;
    this.file.write(this.box.encrypt(JSON.stringify(session)));
  }

  clear(): void {
    this.file.remove();
  }
}
