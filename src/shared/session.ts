// The session as the screens see it. Tokens never leave the main process.
export type SessionUser = { name: string; email: string };

export type SessionState =
  /** Still reading the saved session at start-up. */
  | { status: "loading" }
  | { status: "signed-out"; reason?: "expired" | "logout" }
  /** Signed in; `offline` while the API cannot be reached. */
  | { status: "signed-in"; user: SessionUser; offline: boolean };

export type LoginRequest = { email: string; password: string };

/** A failed call: the API code (e.g. IDENTITY_INVALID_CREDENTIALS) and its Portuguese message. */
export type ApiFailure = { code: string; message: string };

export type LoginResult = { ok: true } | { ok: false; error: ApiFailure };
