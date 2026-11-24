import { app, ipcMain } from "electron";
import type { AskResult } from "@shared/assistant";
import { IPC, type AppInfo } from "@shared/ipc";
import type { LoginResult } from "@shared/session";
import type { AssistantService } from "./assistant/assistant.service";
import { isAutostartEnabled, setAutostart } from "./autostart";
import type { SessionService } from "./session/session.service";
import type { ShortcutLabels } from "./shortcut";
import type { WakeService } from "./wake/wake.service";
import { refreshTrayMenu } from "./tray";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// What the screens may ask the Node side. Every handler validates its input:
// the renderer is treated as untrusted.
export function registerIpc(deps: {
  session: SessionService;
  assistant: AssistantService;
  shortcuts: ShortcutLabels;
  wake: WakeService;
}): void {
  const { session, assistant, wake } = deps;

  ipcMain.handle(IPC.appInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    askShortcut: deps.shortcuts.ask,
    talkShortcut: deps.shortcuts.talk,
  }));
  ipcMain.handle(IPC.autostartGet, () => isAutostartEnabled());
  ipcMain.handle(IPC.autostartSet, (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") return isAutostartEnabled();
    const result = setAutostart(enabled);
    refreshTrayMenu();
    return result;
  });

  ipcMain.handle(IPC.sessionGet, () => session.current());
  ipcMain.handle(
    IPC.sessionLogin,
    (_event, request: unknown): Promise<LoginResult> | LoginResult => {
      const { email, password } = (request ?? {}) as Record<string, unknown>;
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        email.length > 254 ||
        password.length > 200
      ) {
        return {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Informe e-mail e senha." },
        };
      }
      return session.login({ email, password });
    },
  );
  ipcMain.handle(IPC.sessionLogout, () => session.logout());

  ipcMain.handle(
    IPC.assistantAsk,
    (_event, request: unknown): Promise<AskResult> | AskResult => {
      const { text, conversationId } = (request ?? {}) as Record<
        string,
        unknown
      >;
      if (
        typeof text !== "string" ||
        (conversationId != null &&
          (typeof conversationId !== "string" || !UUID.test(conversationId)))
      ) {
        return {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Pergunta inválida." },
        };
      }
      return assistant.ask({
        text,
        conversationId: (conversationId as string | null) ?? null,
      });
    },
  );
  ipcMain.handle(
    IPC.assistantAskByVoice,
    (_event, request: unknown): Promise<AskResult> | AskResult => {
      const { audioBase64, mimeType, conversationId } = (request ??
        {}) as Record<string, unknown>;
      if (
        typeof audioBase64 !== "string" ||
        mimeType !== "audio/wav" ||
        (conversationId != null &&
          (typeof conversationId !== "string" || !UUID.test(conversationId)))
      ) {
        return {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Gravação inválida." },
        };
      }
      return assistant.askByVoice({
        audioBase64,
        mimeType,
        conversationId: (conversationId as string | null) ?? null,
      });
    },
  );
  ipcMain.handle(IPC.voiceSettings, () => assistant.voiceSettings());
  ipcMain.handle(IPC.setWakeWordSetting, (_event, enabled: unknown) =>
    typeof enabled === "boolean" ? assistant.setWakeWord(enabled) : false,
  );

  ipcMain.handle(IPC.wakeEnable, (_event, name: unknown) =>
    wake.enable(typeof name === "string" ? name.slice(0, 40) : "Otto"),
  );
  ipcMain.handle(IPC.wakeDisable, () => wake.disable());
  ipcMain.handle(IPC.wakeStatus, () => wake.current());
  ipcMain.on(IPC.wakeAudio, (_event, samples: unknown) => {
    // At most 1 s of audio per message.
    if (samples instanceof Float32Array && samples.length <= 16_000) {
      wake.acceptAudio(samples);
    }
  });
  ipcMain.on(IPC.wakePause, (_event, paused: unknown) => {
    if (typeof paused === "boolean") wake.setPaused(paused);
  });
}
