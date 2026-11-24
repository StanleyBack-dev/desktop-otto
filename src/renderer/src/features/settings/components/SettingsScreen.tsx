import { useEffect, useState } from "react";
import type { AppInfo } from "@shared/ipc";
import type { SessionUser } from "@shared/session";
import { Button, Card, Switch } from "@/design-system";
import { authClient } from "@/features/auth/api/auth.client";
import { systemClient } from "@/features/system/api/system.client";

// App settings on this PC: start with Windows, the shortcut and the account.
export function SettingsScreen({
  user,
  info,
  onBack,
}: {
  user: SessionUser;
  info: AppInfo | null;
  onBack: () => void;
}) {
  const [autostart, setAutostart] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    void systemClient.autostart().then(setAutostart);
  }, []);

  return (
    <main className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h1 className="font-semibold">Ajustes</h1>
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <Card title="Inicialização">
          <Switch
            label="Iniciar com o Windows"
            hint={
              info && info.platform !== "win32"
                ? "Disponível no Windows."
                : "Abro minimizado ao ligar o PC, pronto para ouvir. Fechar a janela não me desliga."
            }
            checked={autostart}
            onChange={(enabled) => {
              void systemClient.setAutostart(enabled).then(setAutostart);
            }}
          />
        </Card>

        <Card title="Atalhos (de qualquer lugar do Windows)">
          <ul className="flex flex-col gap-2 text-sm">
            <ShortcutRow keys={info?.talkShortcut} action="falar com o Otto" />
            <ShortcutRow
              keys={info?.askShortcut}
              action="digitar uma pergunta"
            />
          </ul>
        </Card>

        <Card title="Conta">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              loading={leaving}
              onClick={() => {
                setLeaving(true);
                void authClient.logout();
              }}
            >
              Sair da conta
            </Button>
          </div>
        </Card>

        <p className="mt-auto text-center text-xs text-ink-muted">
          {info ? `${info.name} ${info.version}` : ""}
        </p>
      </div>
    </main>
  );
}

function ShortcutRow({
  keys,
  action,
}: {
  keys: string | null | undefined;
  action: string;
}) {
  return (
    <li>
      {keys ? (
        <>
          <kbd className="rounded border border-line px-1.5 py-0.5 text-xs">
            {keys}
          </kbd>{" "}
          {action}
        </>
      ) : (
        `Atalho para ${action} em uso por outro programa.`
      )}
    </li>
  );
}
