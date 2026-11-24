import type { LoginRequest, LoginResult, SessionState } from "@shared/session";
import { ApiError, type GraphqlClient } from "../api/graphql-client";
import type { SessionStore, StoredSession } from "./session-store";

type Tokens = {
  deviceId: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

const TOKENS = `deviceId accessToken accessTokenExpiresAt refreshToken refreshTokenExpiresAt`;
const LOGIN = `mutation Login($input: LoginInput!) { login(input: $input) { ${TOKENS} } }`;
const REFRESH = `mutation Refresh($input: RefreshSessionInput!) { refreshSession(input: $input) { ${TOKENS} } }`;
const ME = `query Me { me { name email } }`;
const LOGOUT = `mutation Logout { logout }`;

/** Renew the access token this long before it expires. */
const RENEW_MARGIN_MS = 60_000;

/** Codes that mean the device was signed out for good. */
const ENDED = new Set([
  "IDENTITY_REFRESH_INVALID",
  "IDENTITY_USER_INACTIVE",
  "IDENTITY_SESSION_REQUIRED",
]);

// The signed-in state of this PC. Every API call of the app goes through
// `call`, which adds the access token, renews it when it is about to
// expire and signs out when the device was removed.
export class SessionService {
  private state: SessionState = { status: "loading" };
  private stored: StoredSession | null = null;
  private access: { token: string; expiresAt: number } | null = null;
  private refreshing: Promise<void> | null = null;
  private readonly listeners = new Set<(state: SessionState) => void>();

  constructor(
    private readonly api: GraphqlClient,
    private readonly store: SessionStore,
    private readonly device: {
      name: string;
      platform: "WINDOWS" | "MACOS" | "LINUX";
    },
    private readonly now: () => number = Date.now,
  ) {}

  current(): SessionState {
    return this.state;
  }

  onChange(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** At start-up: reuse the saved session, if any. */
  async restore(): Promise<SessionState> {
    this.stored = this.store.load();
    if (!this.stored) return this.set({ status: "signed-out" });
    try {
      await this.renew();
      return this.set({
        status: "signed-in",
        user: this.stored.user,
        offline: false,
      });
    } catch (error) {
      if (error instanceof ApiError && ENDED.has(error.code)) {
        return this.end("expired");
      }
      // Offline or server trouble: keep the saved session, it works again
      // when the API is back.
      return this.set({
        status: "signed-in",
        user: this.stored.user,
        offline: true,
      });
    }
  }

  async login(request: LoginRequest): Promise<LoginResult> {
    try {
      const { login } = await this.api.request<{ login: Tokens }>(LOGIN, {
        input: {
          email: request.email.trim(),
          password: request.password,
          deviceName: this.device.name,
          platform: this.device.platform,
        },
      });
      this.useTokens(login);
      const { me } = await this.api.request<{
        me: { name: string; email: string };
      }>(ME, {}, login.accessToken);
      this.stored = this.toStored(login, me);
      this.store.save(this.stored);
      this.set({ status: "signed-in", user: me, offline: false });
      return { ok: true };
    } catch (error) {
      const failure =
        error instanceof ApiError
          ? error.toFailure()
          : { code: "UNKNOWN", message: "Não consegui entrar. Tente de novo." };
      return { ok: false, error: failure };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.stored) await this.call(LOGOUT);
    } catch {
      // Signed out locally even if the API is unreachable.
    }
    this.end("logout");
  }

  /** An authenticated API call (used by every feature of the app). */
  async call<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    if (!this.stored) {
      throw new ApiError(
        "IDENTITY_SESSION_REQUIRED",
        "Faça login para continuar.",
      );
    }
    if (!this.access || this.access.expiresAt - RENEW_MARGIN_MS <= this.now()) {
      await this.renewOnce();
    }
    try {
      const result = await this.api.request<T>(
        query,
        variables,
        this.access?.token,
      );
      this.markOnline();
      return result;
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "IDENTITY_SESSION_EXPIRED"
      ) {
        await this.renewOnce();
        return this.api.request<T>(query, variables, this.access?.token);
      }
      if (error instanceof ApiError && ENDED.has(error.code))
        this.end("expired");
      if (error instanceof ApiError && error.network) this.markOffline();
      throw error;
    }
  }

  // Parallel calls share one refresh.
  private renewOnce(): Promise<void> {
    this.refreshing ??= this.renew().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing.catch((error: unknown) => {
      if (error instanceof ApiError && ENDED.has(error.code))
        this.end("expired");
      throw error;
    });
  }

  private async renew(): Promise<void> {
    const stored = this.stored;
    if (!stored)
      throw new ApiError(
        "IDENTITY_SESSION_REQUIRED",
        "Faça login para continuar.",
      );
    const { refreshSession } = await this.api.request<{
      refreshSession: Tokens;
    }>(REFRESH, { input: { refreshToken: stored.refreshToken } });
    this.useTokens(refreshSession);
    this.stored = this.toStored(refreshSession, stored.user);
    this.store.save(this.stored);
  }

  private useTokens(tokens: Tokens): void {
    this.access = {
      token: tokens.accessToken,
      expiresAt: Date.parse(tokens.accessTokenExpiresAt),
    };
  }

  private toStored(tokens: Tokens, user: StoredSession["user"]): StoredSession {
    return {
      deviceId: tokens.deviceId,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      user,
    };
  }

  private markOnline(): void {
    if (this.state.status === "signed-in" && this.state.offline) {
      this.set({ ...this.state, offline: false });
    }
  }

  private markOffline(): void {
    if (this.state.status === "signed-in" && !this.state.offline) {
      this.set({ ...this.state, offline: true });
    }
  }

  private end(reason: "expired" | "logout"): SessionState {
    this.stored = null;
    this.access = null;
    this.store.clear();
    return this.set({ status: "signed-out", reason });
  }

  private set(state: SessionState): SessionState {
    this.state = state;
    for (const listener of this.listeners) listener(state);
    return state;
  }
}
