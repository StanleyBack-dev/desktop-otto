import { describe, expect, it, vi } from "vitest";
import { ApiError, GraphqlClient } from "../api/graphql-client";
import { SessionService } from "./session.service";
import {
  SessionStore,
  type FileStore,
  type SecretBox,
  type StoredSession,
} from "./session-store";

const NOW = Date.parse("2026-11-24T12:00:00Z");
const DEVICE = { name: "PC-DO-QUARTO", platform: "WINDOWS" as const };

function tokens(n: number, accessMinutes = 15) {
  return {
    deviceId: "dev-1",
    accessToken: `access-${n}`,
    accessTokenExpiresAt: new Date(NOW + accessMinutes * 60_000).toISOString(),
    refreshToken: `dev-1.secret-${n}`,
    refreshTokenExpiresAt: new Date(NOW + 90 * 86_400_000).toISOString(),
  };
}

function memoryStore(initial: StoredSession | null = null, available = true) {
  let data: Buffer | null = initial
    ? Buffer.from(`enc:${JSON.stringify(initial)}`)
    : null;
  const box: SecretBox = {
    isAvailable: () => available,
    encrypt: (text) => Buffer.from(`enc:${text}`),
    decrypt: (buffer) => {
      const text = buffer.toString();
      if (!text.startsWith("enc:")) throw new Error("bad");
      return text.slice(4);
    },
  };
  const file: FileStore = {
    read: () => data,
    write: (buffer) => {
      data = buffer;
    },
    remove: () => {
      data = null;
    },
  };
  return { store: new SessionStore(box, file), raw: () => data?.toString() };
}

type Call = {
  query: string;
  variables: Record<string, unknown>;
  token?: string | null;
};

// A fake API answering by operation name.
function fakeApi(handlers: Record<string, (call: Call) => unknown>): {
  api: GraphqlClient;
  calls: Call[];
} {
  const calls: Call[] = [];
  const api = {
    request: vi.fn(
      async (query: string, variables = {}, token?: string | null) => {
        const call = { query, variables, token };
        calls.push(call);
        const name = query.match(/(?:mutation|query) (\w+)/)?.[1] ?? "";
        const handler = handlers[name];
        if (!handler) throw new Error(`no handler for ${name}`);
        return handler(call);
      },
    ),
  } as unknown as GraphqlClient;
  return { api, calls };
}

const USER = { name: "Stanley Rodrigues", email: "owner@example.com" };

describe("SessionService", () => {
  it("logs in, stores the encrypted session and reports the user", async () => {
    const { store, raw } = memoryStore();
    const { api, calls } = fakeApi({
      Login: () => ({ login: tokens(1) }),
      Me: () => ({ me: USER }),
    });
    const service = new SessionService(api, store, DEVICE, () => NOW);
    const states: string[] = [];
    service.onChange((state) => states.push(state.status));

    await expect(
      service.login({ email: " owner@example.com ", password: "x" }),
    ).resolves.toEqual({ ok: true });
    expect(calls[0].variables).toEqual({
      input: {
        email: "owner@example.com",
        password: "x",
        deviceName: "PC-DO-QUARTO",
        platform: "WINDOWS",
      },
    });
    expect(calls[1].token).toBe("access-1");
    expect(service.current()).toEqual({
      status: "signed-in",
      user: USER,
      offline: false,
    });
    expect(states).toEqual(["signed-in"]);
    // Only the refresh token is kept, never the access token.
    expect(raw()).toContain("dev-1.secret-1");
    expect(raw()).not.toContain("access-1");
  });

  it("returns the API message on a wrong password", async () => {
    const { store } = memoryStore();
    const { api } = fakeApi({
      Login: () => {
        throw new ApiError(
          "IDENTITY_INVALID_CREDENTIALS",
          "E-mail ou senha incorretos.",
        );
      },
    });
    const result = await new SessionService(api, store, DEVICE).login({
      email: "a@b.c",
      password: "x",
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "IDENTITY_INVALID_CREDENTIALS",
        message: "E-mail ou senha incorretos.",
      },
    });
  });

  it("restores a saved session, offline when the API is unreachable", async () => {
    const saved = { ...tokens(1), user: USER };
    const online = fakeApi({ Refresh: () => ({ refreshSession: tokens(2) }) });
    const first = memoryStore(saved);
    await expect(
      new SessionService(online.api, first.store, DEVICE, () => NOW).restore(),
    ).resolves.toMatchObject({ status: "signed-in", offline: false });
    expect(first.raw()).toContain("secret-2");

    const offline = fakeApi({
      Refresh: () => {
        throw new ApiError("NETWORK", "sem internet", true);
      },
    });
    const second = memoryStore(saved);
    await expect(
      new SessionService(offline.api, second.store, DEVICE).restore(),
    ).resolves.toMatchObject({ status: "signed-in", offline: true });
    expect(second.raw()).toBeDefined();
  });

  it("signs out when the device was removed", async () => {
    const { store, raw } = memoryStore({ ...tokens(1), user: USER });
    const { api } = fakeApi({
      Refresh: () => {
        throw new ApiError("IDENTITY_REFRESH_INVALID", "Sessão encerrada.");
      },
    });
    await expect(
      new SessionService(api, store, DEVICE).restore(),
    ).resolves.toEqual({ status: "signed-out", reason: "expired" });
    expect(raw()).toBeUndefined();
  });

  it("renews the access token before it expires and shares one refresh", async () => {
    let clock = NOW;
    let refreshes = 0;
    const { store } = memoryStore();
    const { api, calls } = fakeApi({
      Login: () => ({ login: tokens(1) }),
      Me: () => ({ me: USER }),
      Refresh: () => ({ refreshSession: tokens(++refreshes + 1) }),
      Ping: (call) => ({ ping: call.token }),
    });
    const service = new SessionService(api, store, DEVICE, () => clock);
    await service.login({ email: "a@b.c", password: "x" });

    const ping = `query Ping { ping }`;
    await expect(service.call<{ ping: string }>(ping)).resolves.toEqual({
      ping: "access-1",
    });
    clock = NOW + 14.5 * 60_000; // inside the renewal margin
    await Promise.all([service.call(ping), service.call(ping)]);
    expect(refreshes).toBe(1);
    expect(calls.at(-1)?.token).toBe("access-2");
  });

  it("logs out locally even when the API is unreachable", async () => {
    const { store, raw } = memoryStore();
    const { api } = fakeApi({
      Login: () => ({ login: tokens(1) }),
      Me: () => ({ me: USER }),
      Logout: () => {
        throw new ApiError("NETWORK", "sem internet", true);
      },
    });
    const service = new SessionService(api, store, DEVICE, () => NOW);
    await service.login({ email: "a@b.c", password: "x" });
    await service.logout();
    expect(service.current()).toEqual({
      status: "signed-out",
      reason: "logout",
    });
    expect(raw()).toBeUndefined();
  });

  it("never stores the session without encryption", async () => {
    const { store, raw } = memoryStore(null, false);
    const { api } = fakeApi({
      Login: () => ({ login: tokens(1) }),
      Me: () => ({ me: USER }),
    });
    await new SessionService(api, store, DEVICE, () => NOW).login({
      email: "a@b.c",
      password: "x",
    });
    expect(raw()).toBeUndefined();
  });
});

describe("GraphqlClient", () => {
  const reply = (status: number, body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

  it("sends the client key and the token, and maps API errors", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => reply(200, { data: { ping: "pong" } }))
      .mockImplementationOnce(() =>
        reply(200, {
          errors: [
            {
              message: "Faça login para continuar.",
              extensions: { code: "IDENTITY_SESSION_REQUIRED" },
            },
          ],
          data: null,
        }),
      )
      .mockImplementationOnce(() => Promise.reject(new Error("offline")));
    const client = new GraphqlClient(
      "https://api.example.com",
      "key",
      fetchMock as unknown as typeof fetch,
    );

    await expect(client.request("{ ping }", {}, "tok")).resolves.toEqual({
      ping: "pong",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/graphql");
    expect(init.headers).toMatchObject({
      "x-client-api-key": "key",
      authorization: "Bearer tok",
    });
    await expect(client.request("{ me { name } }")).rejects.toMatchObject({
      code: "IDENTITY_SESSION_REQUIRED",
    });
    await expect(client.request("{ ping }")).rejects.toMatchObject({
      code: "NETWORK",
      network: true,
    });
  });
});
