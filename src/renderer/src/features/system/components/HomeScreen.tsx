import { useEffect, useState } from "react";
import type { AppInfo } from "@shared/ipc";
import { Card, ListeningMark, Switch } from "@/design-system";
import { systemClient } from "@/features/system/api/system.client";

// First screen: Otto is running in the notification area. The session,
// the conversation and the voice come in the next phases.
export function HomeScreen() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    void systemClient.info().then(setInfo);
    void systemClient.autostart().then(setAutostart);
  }, []);

  return (
    <main className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col items-center gap-4 pt-8 text-center">
        <ListeningMark />
        <div>
          <h1 className="text-2xl font-semibold">Olá! Eu sou o Otto.</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Estou rodando na área de notificação. Fechar esta janela não me
            desliga.
          </p>
        </div>
      </header>

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

      <footer className="mt-auto text-center text-xs text-ink-muted">
        {info ? `${info.name} ${info.version}` : ""}
      </footer>
    </main>
  );
}
