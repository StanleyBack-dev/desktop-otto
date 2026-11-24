import { ipcMain } from "electron";
import type { AccountResult } from "@shared/account";
import { isRecord, pickPlace, pickSettingsChange } from "./account-input";
import { IPC } from "@shared/ipc";
import type { AccountService } from "./account.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalid = (message: string): AccountResult<never> => ({
  ok: false,
  error: { code: "INVALID_INPUT", message },
});

// Account settings for Ajustes. Inputs from the screens are checked here
// (the API validates the values again).
export function registerAccountIpc(account: AccountService): void {
  ipcMain.handle(IPC.accountSettings, () => account.settings());
  ipcMain.handle(IPC.accountUpdateSettings, (_e, value: unknown) => {
    const change = pickSettingsChange(value);
    return change
      ? account.updateSettings(change)
      : invalid("Nada para salvar.");
  });
  ipcMain.handle(IPC.accountUpdateName, (_e, name: unknown) =>
    typeof name === "string" && name.length <= 120
      ? account.updateName(name)
      : invalid("Nome inválido."),
  );
  ipcMain.handle(IPC.accountSearchPlaces, (_e, name: unknown) =>
    typeof name === "string" && name.trim().length >= 2
      ? account.searchPlaces(name.trim().slice(0, 100))
      : { ok: true, data: [] },
  );
  ipcMain.handle(IPC.accountSetLocation, (_e, value: unknown) => {
    const place = pickPlace(value);
    return place ? account.setLocation(place) : invalid("Cidade inválida.");
  });
  ipcMain.handle(IPC.accountNewsSources, () => account.newsSources());
  ipcMain.handle(IPC.accountSuggestedSources, () =>
    account.suggestedNewsSources(),
  );
  ipcMain.handle(IPC.accountAddSource, (_e, value: unknown) => {
    if (
      !isRecord(value) ||
      typeof value.url !== "string" ||
      typeof value.category !== "string" ||
      value.url.length > 1000
    ) {
      return invalid("Informe o link do feed e a categoria.");
    }
    return account.addNewsSource({
      url: value.url.trim(),
      category: value.category.trim().slice(0, 40),
    });
  });
  ipcMain.handle(IPC.accountUpdateSource, (_e, value: unknown) => {
    if (
      !isRecord(value) ||
      typeof value.id !== "string" ||
      !UUID.test(value.id)
    ) {
      return invalid("Fonte inválida.");
    }
    return account.updateNewsSource({
      id: value.id,
      ...(typeof value.active === "boolean" ? { active: value.active } : {}),
      ...(typeof value.category === "string"
        ? { category: value.category.trim().slice(0, 40) }
        : {}),
    });
  });
  ipcMain.handle(IPC.accountRemoveSource, (_e, id: unknown) =>
    typeof id === "string" && UUID.test(id)
      ? account.removeNewsSource(id)
      : invalid("Fonte inválida."),
  );
}
