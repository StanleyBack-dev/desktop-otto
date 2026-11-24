import type { LoginRequest, LoginResult, SessionState } from "@shared/session";

// Session calls through the preload bridge (tokens stay in the main process).
export const authClient = {
  state: (): Promise<SessionState> => window.otto.session.get(),
  login: (request: LoginRequest): Promise<LoginResult> =>
    window.otto.session.login(request),
  logout: (): Promise<void> => window.otto.session.logout(),
  onChange: (listener: (state: SessionState) => void): (() => void) =>
    window.otto.session.onChange(listener),
};
