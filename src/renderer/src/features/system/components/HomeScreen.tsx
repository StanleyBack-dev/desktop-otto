import { useEffect, useState } from "react";
import type { AppInfo } from "@shared/ipc";
import type { SessionUser } from "@shared/session";
import { Alert, Button, Card, ListeningMark, Switch } from "@/design-system";
import { authClient } from "@/features/auth/api/auth.client";
import { systemClient } from "@/features/system/api/system.client";

// Signed in: Otto is running in the notification area. The conversation
// and the voice come in the next phases.
export function HomeScreen({
  user,
  offline,
}: {
  user: SessionUser;
  offline: boolean;
}) {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [autostart, setAutostart] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const firstName = user.name.split(" ")[0];

  useEffect(() => {
    void systemClient.info().then(setInfo);
    void systemClient.autostart().then(setAutostart);
  }, []);

  return (
    <main className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col items-center gap-4 pt-6 text-center">
        <ListeningMark />
        <div>
          <h1 className="text-2xl font-semibold">Olá, {firstName}!</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Estou rodando na área de notificação. Fechar esta janela não me
            desliga.
          </p>
        </div>
      </header>

      {offline && (
        <Alert tone="warning">
          Sem conexão com o servidor do Otto. Tento de novo sozinho.
        </Alert>
      )}

      <Card title="Inicialização">
        <Switch
          label="Iniciar com o Windows"
          hint={
            info && info.platform !== "win32"
              ? "Disponível no Windows."
              : "Abro minimizado ao ligar o PC, pronto para ouvir."
          }
          checked={autostart}
          onChange={(enabled) => {
            void systemClient.setAutostart(enabled).then(setAutostart);
          }}
        />
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

      <footer className="mt-auto text-center text-xs text-ink-muted">
        {info ? `${info.name} ${info.version}` : ""}
      </footer>
    </main>
  );
}
